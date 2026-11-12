<?php

namespace App\Http\Controllers\Admin;

use App\Exceptions\GraphMailException;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Admin\GraphMailService;
use App\Services\Admin\StudentRosterImporter;
use App\Services\Admin\TemporaryPasswordGenerator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserRoleController extends Controller
{
    public function index(GraphMailService $graphMail): Response
    {
        return Inertia::render('admin/users', [
            'mailbox' => OrganizationMailboxController::status($graphMail),
            'users' => User::query()
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                    'email',
                    'role',
                    'student_no',
                    'first_name',
                    'middle_name',
                    'last_name',
                    'date_enrolled',
                    'status',
                    'modality',
                    'class_id',
                    'subject',
                    'section',
                    'schedule',
                    'o365_email',
                    'display_name',
                    'created_at',
                ])
                ->map(fn (User $user): array => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'student_no' => $user->student_no,
                    'first_name' => $user->first_name,
                    'middle_name' => $user->middle_name,
                    'last_name' => $user->last_name,
                    'date_enrolled' => $user->date_enrolled?->toDateString(),
                    'status' => $user->status,
                    'modality' => $user->modality,
                    'class_id' => $user->class_id,
                    'subject' => $user->subject,
                    'section' => $user->section,
                    'schedule' => $user->schedule,
                    'o365_email' => $user->o365_email,
                    'display_name' => $user->display_name,
                    'created_at' => $user->created_at?->toDateString(),
                ])
                ->all(),
        ]);
    }

    public function store(Request $request, TemporaryPasswordGenerator $passwordGenerator): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::in(['admin', 'teacher', 'student'])],
        ]);
        $temporaryPassword = $passwordGenerator->generate();
        $user = new User;
        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->password = $temporaryPassword;
        $user->role = $validated['role'];
        $user->email_verified_at = Carbon::now();
        $user->must_change_password = true;
        $user->save();

        Inertia::flash('createdUserCredentials', [
            'action' => 'created',
            'name' => $user->name,
            'email' => $user->email,
            'password' => $temporaryPassword,
        ]);
        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "{$user->name} was added. Share the temporary password securely.",
        ]);

        return back();
    }

    public function resetPassword(Request $request, User $user, TemporaryPasswordGenerator $passwordGenerator): RedirectResponse
    {
        abort_if($request->user()->is($user), 422, 'You cannot reset your own password from user management.');

        $temporaryPassword = $passwordGenerator->generate();
        $user->password = $temporaryPassword;
        $user->must_change_password = true;
        $user->save();

        Inertia::flash('createdUserCredentials', [
            'action' => 'reset',
            'name' => $user->name,
            'email' => $user->email,
            'password' => $temporaryPassword,
        ]);
        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "A temporary password was generated for {$user->name}.",
        ]);

        return back();
    }

    public function importStudents(Request $request, StudentRosterImporter $importer, GraphMailService $graphMail): RedirectResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'extensions:xlsx', 'max:10240'],
        ]);

        try {
            $report = $importer->import($validated['file'], $graphMail);
        } catch (GraphMailException $exception) {
            return back()->withErrors(['file' => $exception->getMessage()]);
        }
        $summary = "Imported {$report['imported']} student account(s); {$report['emailed']} credential email(s) sent, {$report['duplicates']} duplicate(s) skipped, {$report['invalid']} invalid row(s), and {$report['email_failures']} email failure(s).";

        Inertia::flash('toast', [
            'type' => $report['email_failures'] > 0 || $report['invalid'] > 0 ? 'warning' : 'success',
            'message' => $summary,
        ]);
        Inertia::flash('bulkImport', $report);

        if ($report['issues'] !== []) {
            Log::info('Student roster import completed with row issues.', [
                'admin_id' => $request->user()->id,
                'issues' => $report['issues'],
            ]);
        }

        return back();
    }

    public function save(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user)],
            'role' => ['required', Rule::in(['admin', 'teacher', 'student'])],
        ]);
        abort_if($request->user()->is($user) && $validated['role'] !== 'admin', 422, 'You cannot remove your own administrator role.');
        $this->ensureAdminRemains($user, $validated['role']);

        $wasTeacher = $user->role === 'teacher';
        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->role = $validated['role'];
        $user->save();

        if ($wasTeacher && $user->role !== 'teacher') {
            $user->taughtCourses()->update(['teacher_id' => null]);
        }

        return back()->with('success', 'User details updated.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        abort_if($request->user()->is($user), 422, 'You cannot delete your own account.');
        $this->ensureAdminRemains($user, 'student');
        $user->delete();

        return back()->with('success', 'User deleted.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        abort_if($request->user()->is($user), 422, 'You cannot change your own role.');

        $validated = $request->validate([
            'role' => ['required', Rule::in(['admin', 'teacher', 'student'])],
        ]);

        $this->ensureAdminRemains($user, $validated['role']);

        $wasTeacher = $user->role === 'teacher';
        $user->role = $validated['role'];
        $user->save();
        if ($wasTeacher && $user->role !== 'teacher') {
            $user->taughtCourses()->update(['teacher_id' => null]);
        }

        return back()->with('success', 'User role updated.');
    }

    private function ensureAdminRemains(User $user, string $nextRole): void
    {
        if ($user->isAdmin() && $nextRole !== 'admin' && User::query()->where('role', 'admin')->count() <= 1) {
            abort(422, 'At least one administrator account must remain.');
        }
    }
}
