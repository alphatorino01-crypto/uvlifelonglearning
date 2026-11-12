<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class UserRoleController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/users', [
            'users' => User::query()
                ->orderBy('name')
                ->withCount(['courseEnrollments', 'taughtCourses'])
                ->get(['id', 'name', 'email', 'role', 'created_at'])
                ->map(fn (User $user): array => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'enrollment_count' => $user->course_enrollments_count,
                    'course_count' => $user->taught_courses_count,
                    'created_at' => $user->created_at?->toDateString(),
                ])
                ->all(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::in(['admin', 'teacher', 'student'])],
            'password' => ['required', 'confirmed', Password::min(12)],
        ]);
        $user = new User;
        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->password = $validated['password'];
        $user->role = $validated['role'];
        $user->email_verified_at = Carbon::now();
        $user->save();

        return back()->with('success', "{$user->name} was added.");
    }

    public function save(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user)],
            'role' => ['required', Rule::in(['admin', 'teacher', 'student'])],
            'password' => ['nullable', 'confirmed', Password::min(12)],
        ]);
        abort_if($request->user()->is($user) && $validated['role'] !== 'admin', 422, 'You cannot remove your own administrator role.');
        $this->ensureAdminRemains($user, $validated['role']);

        $wasTeacher = $user->role === 'teacher';
        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->role = $validated['role'];
        if ($validated['password'] ?? null) {
            $user->password = $validated['password'];
        }
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
