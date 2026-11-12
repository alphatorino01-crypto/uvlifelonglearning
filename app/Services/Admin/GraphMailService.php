<?php

namespace App\Services\Admin;

use App\Exceptions\GraphMailException;
use App\Models\OrganizationMailboxConnection;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;

class GraphMailService
{
    private const SCOPES = 'openid profile offline_access User.Read Mail.Send';

    public function isConfigured(): bool
    {
        return filled(config('services.microsoft_graph.tenant_id'))
            && filled(config('services.microsoft_graph.client_id'))
            && filled(config('services.microsoft_graph.client_secret'))
            && $this->hasValidRedirectUri()
            && str_ends_with(strtolower((string) config('mail.from.address')), '@uv.edu.ph');
    }

    public function callbackUrl(): string
    {
        return (string) config('services.microsoft_graph.redirect_uri');
    }

    public function authorizationUrl(string $state): string
    {
        $this->ensureConfigured();

        return $this->authorityUrl('/oauth2/v2.0/authorize').'?'.http_build_query([
            'client_id' => config('services.microsoft_graph.client_id'),
            'response_type' => 'code',
            'redirect_uri' => $this->callbackUrl(),
            'response_mode' => 'query',
            'scope' => self::SCOPES,
            'state' => $state,
        ], '', '&', PHP_QUERY_RFC3986);
    }

    public function connect(string $code, User $admin): string
    {
        $response = $this->tokenRequest([
            'grant_type' => 'authorization_code',
            'code' => $code,
            'redirect_uri' => $this->callbackUrl(),
            'scope' => self::SCOPES,
        ]);
        $token = $response->json();
        $accessToken = $token['access_token'] ?? null;
        $refreshToken = $token['refresh_token'] ?? null;
        if (! is_string($accessToken) || ! is_string($refreshToken)) {
            throw new GraphMailException('Microsoft did not return the required mailbox authorization. Check the delegated permissions and offline_access consent.');
        }

        try {
            $profileResponse = Http::withToken($accessToken)
                ->acceptJson()
                ->timeout(15)
                ->get('https://graph.microsoft.com/v1.0/me', ['$select' => 'mail,userPrincipalName']);
        } catch (ConnectionException) {
            throw new GraphMailException('Microsoft Graph could not verify the connected mailbox. Try again.');
        }
        $this->ensureSuccessful($profileResponse, 'Unable to verify the connected Microsoft mailbox.');

        $profile = $profileResponse->json();
        $email = strtolower(trim((string) ($profile['mail'] ?? '')));
        if ($email === '') {
            $email = strtolower(trim((string) ($profile['userPrincipalName'] ?? '')));
        }
        $senderEmail = strtolower((string) config('mail.from.address'));
        if ($email === '' || ! hash_equals($senderEmail, $email)) {
            throw new GraphMailException('Sign in with the mailbox configured as MAIL_FROM_EMAIL.');
        }

        OrganizationMailboxConnection::query()->updateOrCreate(
            ['id' => 1],
            [
                'mailbox_email' => $email,
                'access_token' => $accessToken,
                'refresh_token' => $refreshToken,
                'expires_at' => Carbon::now()->addSeconds((int) ($token['expires_in'] ?? 3600)),
                'connected_by' => $admin->id,
            ],
        );

        return $email;
    }

    public function send(string $recipient, string $subject, string $html): void
    {
        $connection = $this->connection();
        $accessToken = $this->validAccessToken($connection);

        $response = $this->sendRequest($accessToken, $recipient, $subject, $html);

        if ($response->unauthorized()) {
            $connection->expires_at = Carbon::now()->subMinute();
            $connection->save();
            $accessToken = $this->validAccessToken($connection);
            $response = $this->sendRequest($accessToken, $recipient, $subject, $html);
        }

        $this->ensureSuccessful($response, 'Microsoft Graph could not send the email.');
    }

    public function sendTestEmail(): void
    {
        $connection = $this->connection();
        $this->send(
            $connection->mailbox_email,
            'UV Lifelong Learning mail connection test',
            '<p>Your organization mailbox is connected and can send mail for the '
                .e((string) config('mail.from.name'))
                .'.</p>',
        );
    }

    public function assertReady(): void
    {
        $this->connection();
    }

    private function validAccessToken(OrganizationMailboxConnection $connection): string
    {
        if ($connection->expires_at->isAfter(now()->addMinute())) {
            return $connection->access_token;
        }

        $response = $this->tokenRequest([
            'grant_type' => 'refresh_token',
            'refresh_token' => $connection->refresh_token,
            'scope' => self::SCOPES,
        ]);
        $token = $response->json();
        if (! is_string($token['access_token'] ?? null)) {
            throw new GraphMailException('Microsoft did not return a refreshed access token. Reconnect the organization mailbox.');
        }

        $connection->access_token = $token['access_token'];
        if (is_string($token['refresh_token'] ?? null)) {
            $connection->refresh_token = $token['refresh_token'];
        }
        $connection->expires_at = Carbon::now()->addSeconds((int) ($token['expires_in'] ?? 3600));
        $connection->save();

        return $connection->access_token;
    }

    private function sendRequest(string $accessToken, string $recipient, string $subject, string $html): Response
    {
        try {
            return Http::withToken($accessToken)
                ->acceptJson()
                ->timeout(20)
                ->post('https://graph.microsoft.com/v1.0/me/sendMail', [
                    'message' => [
                        'subject' => $subject,
                        'body' => [
                            'contentType' => 'HTML',
                            'content' => $html,
                        ],
                        'toRecipients' => [[
                            'emailAddress' => ['address' => $recipient],
                        ]],
                    ],
                    'saveToSentItems' => true,
                ]);
        } catch (ConnectionException) {
            throw new GraphMailException('Microsoft Graph is temporarily unavailable. Try sending the email again.');
        }
    }

    /**
     * @param  array<string, string>  $data
     */
    private function tokenRequest(array $data): Response
    {
        $this->ensureConfigured();
        try {
            $response = Http::asForm()
                ->acceptJson()
                ->timeout(15)
                ->post($this->authorityUrl('/oauth2/v2.0/token'), [
                    ...$data,
                    'client_id' => config('services.microsoft_graph.client_id'),
                    'client_secret' => config('services.microsoft_graph.client_secret'),
                ]);
        } catch (ConnectionException) {
            throw new GraphMailException('Microsoft authorization service is temporarily unavailable. Try again.');
        }
        $this->ensureSuccessful($response, 'Microsoft authorization failed. Check the Entra application and consent settings.');

        return $response;
    }

    private function connection(): OrganizationMailboxConnection
    {
        $this->ensureConfigured();

        $connection = OrganizationMailboxConnection::query()->find(1)
            ?? throw new GraphMailException('Connect the organization mailbox before importing students or sending mail.');

        if (! hash_equals(
            strtolower((string) config('mail.from.address')),
            strtolower($connection->mailbox_email),
        )) {
            throw new GraphMailException('The connected mailbox no longer matches MAIL_FROM_EMAIL. Reconnect the configured sender mailbox.');
        }

        return $connection;
    }

    private function ensureConfigured(): void
    {
        if (! $this->isConfigured()) {
            throw new GraphMailException('Configure the Microsoft Graph credentials, set MSGRAPH_REDIRECT_URI to the exact callback URI registered in Entra, and set MAIL_FROM_EMAIL to the organization mailbox using the @uv.edu.ph domain.');
        }
    }

    private function hasValidRedirectUri(): bool
    {
        $redirectUri = config('services.microsoft_graph.redirect_uri');
        if (! is_string($redirectUri) || filter_var($redirectUri, FILTER_VALIDATE_URL) === false) {
            return false;
        }

        $parts = parse_url($redirectUri);
        $query = [];
        if (is_array($parts) && isset($parts['query'])) {
            parse_str($parts['query'], $query);
        }

        return is_array($parts)
            && isset($parts['scheme'], $parts['host'], $parts['path'])
            && in_array(strtolower($parts['scheme']), ['http', 'https'], true)
            && str_ends_with($parts['path'], '/admin/users/mail/callback')
            && $query === []
            && ! isset($parts['user'], $parts['pass'], $parts['fragment']);
    }

    private function ensureSuccessful(Response $response, string $message): void
    {
        if (! $response->successful()) {
            throw new GraphMailException($message);
        }
    }

    private function authorityUrl(string $path): string
    {
        return 'https://login.microsoftonline.com/'
            .rawurlencode((string) config('services.microsoft_graph.tenant_id'))
            .$path;
    }
}
