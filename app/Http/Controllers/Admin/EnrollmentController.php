<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EnrollmentController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/enrollments', [
            'students' => User::query()->where('role', 'student')->orderBy('name')->get(['id', 'name', 'email']),
            'courses' => Course::query()->orderBy('title')->get(['id', 'title', 'slug']),
            'enrollments' => CourseEnrollment::query()
                ->with(['user:id,name,email', 'course:id,title,slug'])
                ->latest('enrolled_at')
                ->get()
                ->map(fn (CourseEnrollment $enrollment): array => [
                    'id' => $enrollment->id,
                    'student_id' => $enrollment->user_id,
                    'student' => $enrollment->user->name,
                    'email' => $enrollment->user->email,
                    'course_id' => $enrollment->course_id,
                    'course' => $enrollment->course->title,
                    'enrolled_at' => $enrollment->enrolled_at->toDateString(),
                ])
                ->all(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', Rule::exists('users', 'id')->where('role', 'student')],
            'course_id' => ['required', 'integer', 'exists:courses,id'],
        ]);

        CourseEnrollment::query()->firstOrCreate($validated);

        return back()->with('success', 'Student enrolled in the course.');
    }

    public function destroy(CourseEnrollment $enrollment): RedirectResponse
    {
        $enrollment->delete();

        return back()->with('success', 'Enrollment removed.');
    }
}
