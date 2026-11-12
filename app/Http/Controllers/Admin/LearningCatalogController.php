<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LearningCatalogController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/catalog', [
            'courses' => Course::query()
                ->with(['module:id,title', 'teacher:id,name'])
                ->withCount('lessons')
                ->withCount('enrollments')
                ->orderBy('title')
                ->get()
                ->map(fn (Course $course): array => [
                    'id' => $course->id,
                    'title' => $course->title,
                    'slug' => $course->slug,
                    'module' => $course->module?->title,
                    'lesson_count' => $course->lessons_count,
                    'teacher_id' => $course->teacher_id,
                    'teacher' => $course->teacher?->name,
                    'enrollment_count' => $course->enrollments_count,
                    'status' => $course->effectiveStatus(),
                    'url' => route('courses.show', $course),
                ])
                ->all(),
            'teachers' => User::query()->where('role', 'teacher')->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function storeCourse(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'summary' => ['required', 'string', 'max:2000'],
            'instructor' => ['nullable', 'string', 'max:150'],
            'level' => ['required', Rule::in(['Beginner', 'Intermediate', 'Advanced', 'All levels'])],
            'lesson_title' => ['required', 'string', 'max:150'],
            'lesson_summary' => ['required', 'string', 'max:1000'],
            'lesson_content' => ['required', 'string', 'max:50000'],
            'lesson_duration_minutes' => ['required', 'integer', 'between:1,600'],
            'teacher_id' => ['nullable', 'integer', Rule::exists('users', 'id')->where('role', 'teacher')],
            'banner' => ['nullable', 'image', 'max:5120'],
        ]);
        $bannerPath = $request->file('banner')?->store('course-banners', 'public');
        $lessonSlug = Str::slug($validated['lesson_title']);
        if ($lessonSlug === '') {
            $lessonSlug = Str::lower(Str::random(12));
        }
        $teacherName = isset($validated['teacher_id'])
            ? User::query()->whereKey($validated['teacher_id'])->firstOrFail()->name
            : 'Course instructor';

        try {
            $course = DB::transaction(function () use ($validated, $lessonSlug, $bannerPath, $teacherName): Course {
                $course = Course::query()->create([
                    'learning_module_id' => null,
                    'teacher_id' => $validated['teacher_id'] ?? null,
                    'title' => $validated['title'],
                    'slug' => $this->uniqueSlug(Course::class, $validated['title']),
                    'summary' => $validated['summary'],
                    'instructor' => $validated['instructor'] ?: $teacherName,
                    'level' => $validated['level'],
                    'duration_minutes' => $validated['lesson_duration_minutes'],
                    'banner_path' => $bannerPath,
                    'sequence' => (int) Course::query()->max('sequence') + 1,
                ]);

                $course->lessons()->create([
                    'title' => $validated['lesson_title'],
                    'slug' => $lessonSlug,
                    'summary' => $validated['lesson_summary'],
                    'content' => $validated['lesson_content'],
                    'duration_minutes' => $validated['lesson_duration_minutes'],
                    'sequence' => 0,
                ]);

                return $course;
            });
        } catch (\Throwable $exception) {
            if ($bannerPath) {
                Storage::disk('public')->delete($bannerPath);
            }

            throw $exception;
        }

        return to_route('courses.show', $course)->with('success', "{$course->title} course created with its first lesson.");
    }

    public function assignTeacher(Request $request, Course $course): RedirectResponse
    {
        abort_if(
            $course->isComplete() && $request->user()->role !== 'admin',
            403,
            'Completed courses cannot be changed by instructors.',
        );

        $validated = $request->validate([
            'teacher_id' => ['nullable', 'integer', Rule::exists('users', 'id')->where('role', 'teacher')],
        ]);
        $teacherId = $validated['teacher_id'] ?? null;
        $teacher = $teacherId === null
            ? null
            : User::query()->whereKey($teacherId)->firstOrFail();

        $course->update([
            'teacher_id' => $teacher?->id,
            'instructor' => $teacher ? $teacher->name : $course->instructor,
        ]);

        return back()->with('success', 'Course teacher assignment updated.');
    }

    public function storeSection(Request $request, Course $course): RedirectResponse
    {
        abort_if($course->isComplete() && $request->user()->role !== 'admin', 403, 'Completed courses cannot be changed by instructors.');

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'banner' => ['nullable', 'image', 'max:5120'],
        ]);
        $bannerPath = $request->file('banner')?->store('course-sections', 'public');
        $baseSlug = Str::slug($validated['title']) ?: Str::lower(Str::random(12));
        $slug = $baseSlug;
        $suffix = 2;
        while ($course->sections()->where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$suffix}";
            $suffix++;
        }

        try {
            $course->sections()->create([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'banner_path' => $bannerPath,
                'slug' => $slug,
                'sequence' => (int) $course->sections()->max('sequence') + 1,
            ]);
        } catch (\Throwable $exception) {
            if ($bannerPath) {
                Storage::disk('public')->delete($bannerPath);
            }

            throw $exception;
        }

        return back()->with('success', 'Course module created.');
    }

    public function storeLesson(Request $request, Course $course): RedirectResponse
    {
        abort_if($course->isComplete() && $request->user()->role !== 'admin', 403, 'Completed courses cannot be changed by instructors.');

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'summary' => ['required', 'string', 'max:1000'],
            'content' => ['required', 'string', 'max:50000'],
            'duration_minutes' => ['required', 'integer', 'between:1,600'],
            'course_section_id' => [
                'nullable',
                'integer',
                Rule::exists('course_sections', 'id')->where('course_id', $course->id),
            ],
        ]);

        $slug = Str::slug($validated['title']);
        if ($slug === '') {
            $slug = Str::lower(Str::random(12));
        }
        $slugBase = $slug;
        $suffix = 2;
        while ($course->lessons()->where('slug', $slug)->exists()) {
            $slug = "{$slugBase}-{$suffix}";
            $suffix++;
        }

        $course->lessons()->create([
            ...$validated,
            'course_section_id' => $validated['course_section_id'] ?? null,
            'slug' => $slug,
            'sequence' => (int) $course->lessons()->max('sequence') + 1,
        ]);
        $course->update([
            'duration_minutes' => $course->lessons()->sum('duration_minutes'),
        ]);

        return back()->with('success', 'Lesson added to the course.');
    }

    public function updateSettings(Request $request, Course $course): RedirectResponse
    {
        $validated = $request->validate([
            'access_status' => ['required', Rule::in(['open', 'closed'])],
            'duration_mode' => ['required', Rule::in(['ongoing', 'fixed'])],
            'starts_at' => ['nullable', 'date', 'required_if:duration_mode,fixed'],
            'ends_at' => ['nullable', 'date', 'required_if:duration_mode,fixed', 'after:starts_at'],
            'completed' => ['required', 'boolean'],
            'track_progress' => ['required', 'boolean'],
            'participatory_auto_complete' => ['required', 'boolean'],
            'show_class_roster' => ['required', 'boolean'],
            'allow_messages' => ['required', 'boolean'],
            'students_can_message_course_members' => ['required', 'boolean'],
            'allow_virtual_classroom' => ['required', 'boolean'],
            'hide_inactive_students' => ['required', 'boolean'],
            'mastery_instructors_visible' => ['required', 'boolean'],
            'mastery_students_visible' => ['required', 'boolean'],
        ]);

        $course->update([
            ...Arr::except($validated, ['completed']),
            'starts_at' => $validated['duration_mode'] === 'fixed' ? $validated['starts_at'] : null,
            'ends_at' => $validated['duration_mode'] === 'fixed' ? $validated['ends_at'] : null,
            'completed_at' => $validated['completed'] ? ($course->completed_at ?? now()) : null,
        ]);

        return back()->with('success', 'Course settings saved.');
    }

    /**
     * @param  class-string<Course>  $model
     */
    private function uniqueSlug(string $model, string $title): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $suffix = 2;

        while ($model::query()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
