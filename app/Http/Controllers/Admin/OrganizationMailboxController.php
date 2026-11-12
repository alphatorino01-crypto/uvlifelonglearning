<?php

namespace App\Http\Controllers\Admin;

use App\Exceptions\GraphMailException;
use App\Http\Controllers\Controller;
use App\Models\OrganizationMailboxConnection;
use App\Services\Admin\GraphMailService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class OrganizationMailboxController extends Controller
{
    public function connect(Request $request, GraphMailService $graphMail): RedirectResponse
    {
        try {
            $state = Str::random(64);
            $request->session()->put('microsoft_graph_oauth_state', $state);

            return redirect()->away($graphMail->authorizationUrl($state));
        } catch (GraphMailException $exception) {
            return redirect()->route('admin.users')->withErrors(['mailbox' => $exception->getMessage()]);
        }
    }

    public function callback(Request $request, GraphMailService $graphMail): RedirectResponse
    {
        $expectedState = $request->session()->pull('microsoft_graph_oauth_state');
        $receivedState = $request->query('state');
        if (! is_string($expectedState) || ! is_string($receivedState) || ! hash_equals($expectedState, $receivedState)) {
            return redirect()->route('admin.users')->withErrors([
                'mailbox' => 'Microsoft mailbox authorization could not be verified. Start the connection again.',
            ]);
        }

        if ($request->filled('error')) {
            return redirect()->route('admin.users')->withErrors([
                'mailbox' => 'Microsoft mailbox authorization was not completed. Review the Entra consent settings and try again.',
            ]);
        }

        $validated = $request->validate([
            'code' => ['required', 'string'],
        ]);

        try {
            $email = $graphMail->connect($validated['code'], $request->user());
        } catch (GraphMailException $exception) {
            return redirect()->route('admin.users')->withErrors(['mailbox' => $exception->getMessage()]);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Organization mailbox {$email} connected.",
        ]);

        return redirect()->route('admin.users');
    }

    public function sendTest(Request $request, GraphMailService $graphMail): RedirectResponse
    {
        try {
            $graphMail->sendTestEmail();
        } catch (GraphMailException $exception) {
            return back()->withErrors(['mailbox' => $exception->getMessage()]);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'A test email was sent to the connected organization mailbox.',
        ]);

        return back();
    }

    /**
     * @return array{configured: bool, connected: bool, email: string|null, connected_at: string|null, callback_url: string, sender_email: string}
     */
    public static function status(GraphMailService $graphMail): array
    {
        $connection = OrganizationMailboxConnection::query()->find(1);

        return [
            'configured' => $graphMail->isConfigured(),
            'connected' => $connection !== null
                && strtolower($connection->mailbox_email) === strtolower((string) config('mail.from.address')),
            'email' => $connection?->mailbox_email,
            'connected_at' => $connection?->updated_at?->toDateTimeString(),
            'callback_url' => $graphMail->callbackUrl(),
            'sender_email' => (string) config('mail.from.address'),
        ];
    }
}
