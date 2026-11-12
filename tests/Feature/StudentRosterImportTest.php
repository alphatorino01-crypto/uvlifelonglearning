<?php

namespace Tests\Feature;

use App\Models\OrganizationMailboxConnection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;
use Tests\TestCase;

class StudentRosterImportTest extends TestCase
{
    use RefreshDatabase;

    private const HEADERS = [
        'STUDENT NO.',
        'LAST NAME',
        'FIRST NAME',
        'MIDDLE NAME',
        'DATE ENROLLED',
        'STATUS',
        'MODALITY',
        'CLASS ID',
        'SUBJECT',
        'SECTION',
        'SCHEDULE',
        'O365 EMAIL',
        'DISPLAY NAME',
    ];

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'mail.from.address' => 'jack_torino@uv.edu.ph',
            'services.microsoft_graph.tenant_id' => 'tenant-id',
            'services.microsoft_graph.client_id' => 'client-id',
            'services.microsoft_graph.client_secret' => 'test-client-secret',
            'services.microsoft_graph.redirect_uri' => 'https://uvlifelonglearning.uvbeams.com/admin/users/mail/callback',
        ]);
        OrganizationMailboxConnection::query()->create([
            'id' => 1,
            'mailbox_email' => 'jack_torino@uv.edu.ph',
            'access_token' => 'test-access-token',
            'refresh_token' => 'test-refresh-token',
            'expires_at' => now()->addHour(),
        ]);
    }

    public function test_admin_can_import_student_accounts_and_email_temporary_credentials(): void
    {
        Http::fake([
            'https://graph.microsoft.com/v1.0/me/sendMail' => Http::response([], 202),
        ]);
        $admin = User::factory()->create(['role' => 'admin', 'name' => 'ZZ Admin']);
        $file = $this->makeWorkbook([
            ['2026001', 'Santos', 'Maria', 'Clara', 'June 1, 2026', 'Enrolled', 'Online', 'UV101', 'Digital Skills', 'A', 'MWF 9:00', 'maria.santos@uv.edu.ph', 'Maria Clara Santos'],
        ]);

        $this->actingAs($admin)
            ->post(route('admin.users.import'), ['file' => $file])
            ->assertRedirect();

        $student = User::query()->where('email', 'maria.santos@uv.edu.ph')->firstOrFail();
        $this->assertSame('student', $student->role);
        $this->assertSame('Maria Clara Santos', $student->name);
        $this->assertSame('2026001', $student->student_no);
        $this->assertSame('Maria', $student->first_name);
        $this->assertSame('Clara', $student->middle_name);
        $this->assertSame('Santos', $student->last_name);
        $this->assertSame('2026-06-01', $student->date_enrolled?->format('Y-m-d'));
        $this->assertSame('Enrolled', $student->status);
        $this->assertSame('Online', $student->modality);
        $this->assertSame('UV101', $student->class_id);
        $this->assertSame('Digital Skills', $student->subject);
        $this->assertSame('A', $student->section);
        $this->assertSame('MWF 9:00', $student->schedule);
        $this->assertSame('maria.santos@uv.edu.ph', $student->o365_email);
        $this->assertSame('Maria Clara Santos', $student->display_name);
        $this->assertTrue($student->must_change_password);
        $this->assertNotNull($student->email_verified_at);

        $this->actingAs($admin)
            ->get(route('admin.users'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/users')
                ->where('users.0.email', 'maria.santos@uv.edu.ph')
                ->where('users.0.student_no', '2026001')
                ->where('users.0.last_name', 'Santos')
                ->where('users.0.first_name', 'Maria')
                ->where('users.0.middle_name', 'Clara')
                ->where('users.0.date_enrolled', '2026-06-01')
                ->where('users.0.status', 'Enrolled')
                ->where('users.0.modality', 'Online')
                ->where('users.0.class_id', 'UV101')
                ->where('users.0.subject', 'Digital Skills')
                ->where('users.0.section', 'A')
                ->where('users.0.schedule', 'MWF 9:00')
                ->where('users.0.o365_email', 'maria.santos@uv.edu.ph')
                ->where('users.0.display_name', 'Maria Clara Santos'));

        Http::assertSent(function ($request): bool {
            if ($request->url() !== 'https://graph.microsoft.com/v1.0/me/sendMail') {
                return false;
            }

            $content = $request->data()['message']['body']['content'];
            preg_match('/Temporary password:<\/strong>\s*([^<]+)/', $content, $matches);
            $password = html_entity_decode(trim($matches[1] ?? ''), ENT_QUOTES | ENT_HTML5);

            return $request->data()['message']['toRecipients'][0]['emailAddress']['address'] === 'maria.santos@uv.edu.ph'
                && strlen($password) === 8
                && preg_match('/[A-Z]/', $password) === 1
                && preg_match('/[a-z]/', $password) === 1
                && preg_match('/[0-9]/', $password) === 1
                && preg_match('/[^A-Za-z0-9]/', $password) === 1
                && str_contains($content, 'maria.santos@uv.edu.ph');
        });
    }

    public function test_import_skips_duplicate_email_and_reports_invalid_rows(): void
    {
        Http::fake([
            'https://graph.microsoft.com/v1.0/me/sendMail' => Http::response([], 202),
        ]);
        $admin = User::factory()->create(['role' => 'admin']);
        $file = $this->makeWorkbook([
            ['2026002', 'Lee', 'Alex', '', '', 'Enrolled', '', '', '', '', '', 'alex.lee@uv.edu.ph', 'Alex Lee'],
            ['2026003', 'Lee', 'Alex', '', '', 'Enrolled', '', '', '', '', '', 'alex.lee@uv.edu.ph', 'Alex Lee'],
            ['2026004', '', 'NoSurname', '', '', 'Enrolled', '', '', '', '', '', 'invalid-row@uv.edu.ph', 'No Surname'],
        ]);

        $this->actingAs($admin)
            ->post(route('admin.users.import'), ['file' => $file])
            ->assertRedirect();

        $this->assertDatabaseCount('users', 2);
        $this->assertDatabaseHas('users', ['email' => 'alex.lee@uv.edu.ph', 'role' => 'student']);
        $this->assertDatabaseMissing('users', ['email' => 'invalid-row@uv.edu.ph']);
        Http::assertSentCount(1);
    }

    public function test_import_skips_existing_student_numbers_with_a_different_email(): void
    {
        Http::fake([
            'https://graph.microsoft.com/v1.0/me/sendMail' => Http::response([], 202),
        ]);
        User::factory()->create([
            'student_no' => '2026005',
            'email' => 'existing.student@uv.edu.ph',
        ]);
        $admin = User::factory()->create(['role' => 'admin']);
        $file = $this->makeWorkbook([
            ['2026005', 'Garcia', 'Ana', '', '', 'Enrolled', '', '', '', '', '', 'ana.garcia@uv.edu.ph', 'Ana Garcia'],
        ]);

        $this->actingAs($admin)
            ->post(route('admin.users.import'), ['file' => $file])
            ->assertRedirect();

        $this->assertDatabaseMissing('users', ['email' => 'ana.garcia@uv.edu.ph']);
        Http::assertNothingSent();
    }

    public function test_import_requires_the_connected_mailbox_to_match_the_sender(): void
    {
        Http::fake();
        config(['mail.from.address' => 'accounts@example.com']);
        $admin = User::factory()->create(['role' => 'admin']);
        $file = $this->makeWorkbook([]);

        $this->actingAs($admin)
            ->from(route('admin.users'))
            ->post(route('admin.users.import'), ['file' => $file])
            ->assertSessionHasErrors('file');

        $this->assertDatabaseCount('users', 1);
        Http::assertNothingSent();
    }

    public function test_admin_can_connect_the_sender_mailbox_with_oauth_state_validation(): void
    {
        Http::fake([
            'https://login.microsoftonline.com/tenant-id/oauth2/v2.0/token' => Http::response([
                'access_token' => 'new-access-token',
                'refresh_token' => 'new-refresh-token',
                'expires_in' => 3600,
            ]),
            'https://graph.microsoft.com/v1.0/me*' => Http::response([
                'mail' => 'jack_torino@uv.edu.ph',
                'userPrincipalName' => 'jack_torino@uv.edu.ph',
            ]),
        ]);
        $admin = User::factory()->create(['role' => 'admin']);

        config(['app.url' => 'https://app-url-is-not-used.example']);
        $authorization = $this->actingAs($admin)
            ->get('https://uvlifelonglearning.uvbeams.com/admin/users/mail/connect')
            ->assertRedirect();

        parse_str(parse_url((string) $authorization->headers->get('Location'), PHP_URL_QUERY), $authorizationQuery);
        $redirectUri = 'https://uvlifelonglearning.uvbeams.com/admin/users/mail/callback';
        $this->assertSame($redirectUri, $authorizationQuery['redirect_uri']);
        $this->assertStringContainsString('offline_access', $authorizationQuery['scope']);
        $this->assertStringContainsString('User.Read', $authorizationQuery['scope']);
        $this->assertStringContainsString('Mail.Send', $authorizationQuery['scope']);

        $state = session('microsoft_graph_oauth_state');
        $this->assertIsString($state);

        $this->actingAs($admin)
            ->get($redirectUri.'?code=oauth-code&state='.urlencode($state))
            ->assertRedirect(route('admin.users'));

        $connection = OrganizationMailboxConnection::query()->findOrFail(1);
        $this->assertSame('jack_torino@uv.edu.ph', $connection->mailbox_email);
        $this->assertSame('new-access-token', $connection->access_token);
        $this->assertSame('new-refresh-token', $connection->refresh_token);
        $this->assertNotSame('new-access-token', DB::table('organization_mailbox_connections')->value('access_token'));
        Http::assertSent(fn ($request) => str_contains($request->url(), '/oauth2/v2.0/token')
            && ($request->data()['redirect_uri'] ?? null) === $redirectUri);
    }

    public function test_mailbox_connection_requires_an_explicit_environments_redirect_uri(): void
    {
        config(['services.microsoft_graph.redirect_uri' => null]);
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get(route('admin.users'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('mailbox.configured', false)
                ->where('mailbox.callback_url', ''));

        $this->actingAs($admin)
            ->get(route('admin.mail.connect'))
            ->assertRedirect(route('admin.users'))
            ->assertSessionHasErrors('mailbox');
    }

    public function test_mailbox_callback_rejects_an_invalid_state(): void
    {
        Http::fake();
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get(route('admin.mail.callback', [
                'code' => 'oauth-code',
                'state' => 'wrong-state',
            ]))
            ->assertRedirect(route('admin.users'))
            ->assertSessionHasErrors('mailbox');

        Http::assertNothingSent();
    }

    public function test_mailbox_callback_does_not_save_a_different_sender_account(): void
    {
        Http::fake([
            'https://login.microsoftonline.com/tenant-id/oauth2/v2.0/token' => Http::response([
                'access_token' => 'other-access-token',
                'refresh_token' => 'other-refresh-token',
                'expires_in' => 3600,
            ]),
            'https://graph.microsoft.com/v1.0/me*' => Http::response([
                'mail' => 'different.mailbox@uv.edu.ph',
                'userPrincipalName' => 'different.mailbox@uv.edu.ph',
            ]),
        ]);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->get(route('admin.mail.connect'))->assertRedirect();
        $state = session('microsoft_graph_oauth_state');

        $this->actingAs($admin)
            ->get(route('admin.mail.callback', [
                'code' => 'oauth-code',
                'state' => $state,
            ]))
            ->assertRedirect(route('admin.users'))
            ->assertSessionHasErrors('mailbox');

        $connection = OrganizationMailboxConnection::query()->findOrFail(1);
        $this->assertSame('jack_torino@uv.edu.ph', $connection->mailbox_email);
        $this->assertSame('test-access-token', $connection->access_token);
    }

    public function test_admin_can_send_a_test_message_to_the_connected_mailbox(): void
    {
        Http::fake([
            'https://graph.microsoft.com/v1.0/me/sendMail' => Http::response([], 202),
        ]);
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post(route('admin.mail.test'))
            ->assertRedirect();

        Http::assertSent(fn ($request) => $request->url() === 'https://graph.microsoft.com/v1.0/me/sendMail'
            && $request->data()['message']['toRecipients'][0]['emailAddress']['address'] === 'jack_torino@uv.edu.ph'
            && $request->data()['message']['subject'] === 'UV Lifelong Learning mail connection test');
    }

    public function test_expired_tokens_are_refreshed_and_unauthorized_send_is_retried(): void
    {
        $connection = OrganizationMailboxConnection::query()->findOrFail(1);
        $connection->expires_at = now()->subMinute();
        $connection->save();
        $sendAttempts = 0;
        Http::fake([
            'https://login.microsoftonline.com/tenant-id/oauth2/v2.0/token' => Http::response([
                'access_token' => 'refreshed-access-token',
                'refresh_token' => 'rotated-refresh-token',
                'expires_in' => 3600,
            ]),
            'https://graph.microsoft.com/v1.0/me/sendMail' => function () use (&$sendAttempts) {
                $sendAttempts++;

                return $sendAttempts === 1
                    ? Http::response(['error' => ['message' => 'Expired token']], 401)
                    : Http::response([], 202);
            },
        ]);
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post(route('admin.mail.test'))
            ->assertRedirect();

        $connection->refresh();
        $this->assertSame('refreshed-access-token', $connection->access_token);
        $this->assertSame('rotated-refresh-token', $connection->refresh_token);
        $this->assertSame(2, $sendAttempts);
        Http::assertSent(fn ($request) => str_contains($request->url(), '/oauth2/v2.0/token')
            && ($request->data()['refresh_token'] ?? null) === 'test-refresh-token');
    }

    public function test_first_login_requires_and_accepts_a_new_password(): void
    {
        $student = User::factory()->create([
            'must_change_password' => true,
            'email_verified_at' => now(),
        ]);

        $this->actingAs($student)
            ->get(route('learning.progress'))
            ->assertRedirect(route('first-login-password.edit'));

        $this->actingAs($student)
            ->get(route('first-login-password.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('auth/first-login-password'));

        $this->actingAs($student)
            ->put(route('first-login-password.update'), [
                'password' => 'A-new-secure-password-2026',
                'password_confirmation' => 'A-new-secure-password-2026',
            ])
            ->assertRedirect(route('home'));

        $student->refresh();
        $this->assertFalse($student->must_change_password);
        $this->assertTrue(Hash::check('A-new-secure-password-2026', $student->password));

        $this->actingAs($student)
            ->get(route('learning.progress'))
            ->assertOk();
    }

    /**
     * @param  list<list<string>>  $records
     */
    private function makeWorkbook(array $records): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'uv-roster-');
        $writer = new Writer;
        $writer->openToFile($path);
        $writer->addRow(Row::fromValues(self::HEADERS));
        foreach ($records as $record) {
            $writer->addRow(Row::fromValues($record));
        }
        $writer->close();

        $contents = file_get_contents($path);
        unlink($path);
        $this->assertIsString($contents);

        return UploadedFile::fake()->createWithContent('student-roster.xlsx', $contents);
    }
}
