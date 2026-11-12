<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseSection;
use App\Models\Lesson;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/dashboard', [
            'stats' => [
                'users' => User::query()->count(),
                'students' => User::query()->where('role', 'student')->count(),
                'teachers' => User::query()->where('role', 'teacher')->count(),
                'courses' => Course::query()->count(),
                'modules' => CourseSection::query()->count(),
                'lessons' => Lesson::query()->count(),
                'enrollments' => CourseEnrollment::query()->count(),
            ],
            'recentEnrollments' => CourseEnrollment::query()
                ->with(['user:id,name,email', 'course:id,title,slug'])
                ->latest('enrolled_at')
                ->limit(6)
                ->get()
                ->map(fn (CourseEnrollment $enrollment): array => [
                    'id' => $enrollment->id,
                    'student' => $enrollment->user->name,
                    'email' => $enrollment->user->email,
                    'course' => $enrollment->course->title,
                    'course_url' => route('courses.show', $enrollment->course),
                    'enrolled_at' => $enrollment->enrolled_at->toDateString(),
                ])
                ->all(),
        ]);
    }
}
