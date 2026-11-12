<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseMaterial;
use App\Models\CourseSection;
use App\Models\LearningModule;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class LearningController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        if ($request->user()?->isAdmin()) {
            return to_route('admin.dashboard');
        }

        return Inertia::render('learning/index', [
            'modules' => $this->moduleData(),
            'courses' => $this->courseDataList($request->user()),
        ]);
    }

    public function modules(Request $request): Response
    {
        return Inertia::render('learning/catalog', [
            'mode' => 'modules',
            'modules' => $this->moduleData(),
            'courses' => $this->courseDataList($request->user()),
        ]);
    }

    public function courses(Request $request): Response
    {
        return Inertia::render('learning/catalog', [
            'mode' => 'courses',
            'modules' => $this->moduleData(),
            'courses' => $this->courseDataList($request->user()),
        ]);
    }

    public function showModule(Request $request, LearningModule $module): Response
    {
        $courses = $this->courseDataList($request->user(), $module->courses()->pluck('id'));

        return Inertia::render('learning/module', [
            'module' => [
                'id' => $module->id,
                'title' => $module->title,
                'slug' => $module->slug,
                'description' => $module->description,
                'color' => $module->color,
            ],
            'courses' => $courses,
        ]);
    }

    public function showCourse(Request $request, Course $course): Response
    {
        $course->load('module', 'lessons', 'materials', 'sections', 'teacher');
        $user = $request->user();
        $status = $course->effectiveStatus();
        $isStaff = in_array($user?->role, ['admin', 'teacher'], true);
        $isEnrolledStudent = $user?->role === 'student'
            && $status !== 'closed'
            && $course->enrollments()->where('user_id', $user->id)->exists();
        $canAccessContent = $isStaff || $isEnrolledStudent;
        $visibleLessons = $canAccessContent ? $course->lessons : collect();
        $completedLessonIds = $this->completedLessonIds($user, $visibleLessons->pluck('id'));
        $courseData = $this->courseData($course, $completedLessonIds);
        $courseData['can_access_content'] = $canAccessContent;
        $courseData['can_participate'] = $isStaff
            ? ! $course->isComplete()
            : ($isEnrolledStudent && $status === 'open');
        $courseData['effective_status'] = $status;
        $courseData['access_message'] = $status === 'closed'
            ? 'This course is currently closed.'
            : ($status === 'complete'
                ? 'This course is complete. You can review content, but participation is closed.'
                : 'Course content is available to enrolled students. Contact your administrator to enroll.');
        if (! $canAccessContent) {
            $courseData['materials'] = [];
            $courseData['sections'] = [];
        }

        return Inertia::render('learning/course', [
            'course' => $courseData,
            'lessons' => $canAccessContent
                ? $this->courseLessonsData($visibleLessons, $completedLessonIds, $user)
                : [],
        ]);
    }

    public function showLesson(Request $request, Course $course, Lesson $lesson): Response|RedirectResponse
    {
        abort_unless($lesson->course_id === $course->id, 404);
        $user = $request->user();
        if (! $user) {
            return to_route('login');
        }
        if ($user->role === 'student') {
            abort_unless($course->studentHasAccess($user), 403, 'Enroll in this course to access its lessons.');
        }

        $lessons = $course->lessons()->get();
        $completedLessonIds = $this->completedLessonIds($user, $lessons->pluck('id'));
        $lessonIndex = $lessons->search(fn (Lesson $item): bool => $item->is($lesson));
        abort_if($lessonIndex === false, 404);

        $previousLesson = $lessonIndex > 0 ? $lessons[$lessonIndex - 1] : null;
        if ($request->user()?->role === 'student' && $previousLesson?->requires_completion && ! in_array($previousLesson->id, $completedLessonIds)) {
            abort(403, 'Complete the previous lesson before continuing.');
        }

        $progress = ! ($course->isComplete() && $user->role === 'student')
            ? LessonProgress::query()->firstOrCreate(
                ['user_id' => $user->id, 'lesson_id' => $lesson->id],
                ['started_at' => now()],
            )
            : null;

        if ($progress && ! $progress->started_at) {
            $progress->started_at = now();
            $progress->save();
        }

        $remainingSeconds = $progress?->completed_at
            ? 0
            : ($progress?->started_at
                ? max(0, (int) ceil(now()->diffInSeconds($progress->started_at->copy()->addMinutes($lesson->duration_minutes), false)))
                : null);
        $nextLesson = $lessonIndex < $lessons->count() - 1 ? $lessons[$lessonIndex + 1] : null;

        return Inertia::render('learning/lesson', [
            'course' => [
                'title' => $course->title,
                'slug' => $course->slug,
                'effective_status' => $course->effectiveStatus(),
                'can_participate' => ($user->role === 'admin' || $user->role === 'teacher')
                    ? ! $course->isComplete()
                    : $course->effectiveStatus() === 'open',
            ],
            'lesson' => [
                ...$this->lessonData($lesson, $completedLessonIds, false),
                'content' => $lesson->content,
                'video_url' => $lesson->video_url,
                'started_at' => $progress?->started_at?->toIso8601String(),
                'remaining_seconds' => $remainingSeconds,
            ],
            'previousLesson' => $previousLesson ? $this->lessonData($previousLesson, $completedLessonIds) : null,
            'nextLesson' => $nextLesson
                ? $this->lessonData(
                    $nextLesson,
                    $completedLessonIds,
                    $request->user()?->role === 'student' && $lesson->requires_completion && ! in_array($lesson->id, $completedLessonIds),
                )
                : null,
            'lessons' => $this->courseLessonsData($lessons, $completedLessonIds, $user),
        ]);
    }

    public function completeLesson(Request $request, Lesson $lesson): RedirectResponse
    {
        $user = $request->user();
        $continue = $request->boolean('continue');
        if ($user->role === 'student') {
            abort_unless($lesson->course->studentHasAccess($user), 403, 'You are not enrolled in this course.');
        }
        abort_if($lesson->course->isComplete(), 403, 'Course participation is closed.');

        $previousLesson = $lesson->course->lessons()
            ->where('sequence', '<', $lesson->sequence)
            ->reorder('sequence', 'desc')
            ->first();

        if ($user->role === 'student' && $previousLesson?->requires_completion) {
            $previousCompleted = $user->lessonProgress()
                ->where('lesson_id', $previousLesson->id)
                ->whereNotNull('completed_at')
                ->exists();
            abort_unless($previousCompleted, 403, 'Complete the previous lesson before continuing.');
        }

        $progress = LessonProgress::query()
            ->where('user_id', $user->id)
            ->where('lesson_id', $lesson->id)
            ->first();

        if (! $progress) {
            return back()->withErrors([
                'lesson' => 'Open the lesson to start its completion timer.',
            ]);
        }

        if (! $progress->completed_at && $progress->started_at && now()->lt($progress->started_at->copy()->addMinutes($lesson->duration_minutes))) {
            return back()->withErrors([
                'lesson' => 'Finish the lesson duration before marking it complete.',
            ]);
        }

        if (! $progress->completed_at) {
            $progress->completed_at = now();
            $progress->save();
        }

        if ($continue) {
            $nextLesson = $lesson->course->lessons()
                ->where('sequence', '>', $lesson->sequence)
                ->reorder('sequence')
                ->first();

            if ($nextLesson) {
                return to_route('lessons.show', [$lesson->course, $nextLesson]);
            }
        }

        return back()->with('success', 'Lesson completed.');
    }

    public function updatePrerequisite(Request $request, Lesson $lesson): RedirectResponse
    {
        abort_if(
            $lesson->course->isComplete() && $request->user()->role !== 'admin',
            403,
            'Completed courses cannot be changed by instructors.',
        );

        $validated = $request->validate([
            'requires_completion' => ['required', 'boolean'],
        ]);

        $lesson->update($validated);

        return back()->with('success', 'Lesson prerequisite updated.');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function moduleData(): array
    {
        return LearningModule::query()
            ->withCount([
                'courses',
                'courses as lessons_count' => fn (Builder $query) => $query->join('lessons', 'courses.id', '=', 'lessons.course_id'),
            ])
            ->orderBy('sequence')
            ->get()
            ->map(fn (LearningModule $module): array => [
                'id' => $module->id,
                'title' => $module->title,
                'slug' => $module->slug,
                'description' => $module->description,
                'color' => $module->color,
                'course_count' => $module->courses_count,
                'lesson_count' => $module->lessons_count,
            ])
            ->all();
    }

    /**
     * @param  Collection<int, int>|null  $ids
     * @return array<int, array<string, mixed>>
     */
    private function courseDataList(?User $user, ?Collection $ids = null): array
    {
        $query = Course::query()
            ->with(['module', 'teacher'])
            ->withCount('lessons');

        if ($user) {
            $query->withCount([
                'lessons as completed_lessons_count' => fn (Builder $lessons) => $lessons->whereHas(
                    'progress',
                    fn (Builder $progress) => $progress->where('user_id', $user->id)->whereNotNull('completed_at'),
                ),
            ]);
        }

        if ($ids !== null) {
            $query->whereIn('id', $ids);
        }

        return $query->orderBy('sequence')->get()
            ->map(fn (Course $course): array => $this->courseData(
                $course,
                [],
                $course->lessons_count,
                $user ? $course->completed_lessons_count : 0,
            ))
            ->all();
    }

    /**
     * @param  Collection<int, int>  $lessonIds
     * @return array<int, int>
     */
    private function completedLessonIds(?User $user, Collection $lessonIds): array
    {
        if (! $user || $lessonIds->isEmpty()) {
            return [];
        }

        return $user->lessonProgress()
            ->whereIn('lesson_id', $lessonIds)
            ->whereNotNull('completed_at')
            ->pluck('lesson_id')
            ->all();
    }

    /**
     * @param  array<int, int>  $completedLessonIds
     * @return array<string, mixed>
     */
    private function courseData(Course $course, array $completedLessonIds, ?int $lessonCount = null, ?int $completedCount = null): array
    {
        $lessons = $course->relationLoaded('lessons') ? $course->lessons : null;
        $lessonCount ??= $lessons?->count() ?? $course->lessons()->count();
        $completedCount ??= count($completedLessonIds);

        return [
            'id' => $course->id,
            'title' => $course->title,
            'slug' => $course->slug,
            'summary' => $course->summary,
            'instructor' => $course->instructor,
            'level' => $course->level,
            'duration_minutes' => $course->duration_minutes,
            'lesson_count' => $lessonCount,
            'completed_count' => $course->track_progress ? $completedCount : 0,
            'progress' => $course->track_progress && $lessonCount > 0 ? (int) round($completedCount / $lessonCount * 100) : 0,
            'module' => $course->module ? [
                'title' => $course->module->title,
                'slug' => $course->module->slug,
                'color' => $course->module->color,
            ] : null,
            'materials' => $course->relationLoaded('materials')
                ? $course->materials->map(fn (CourseMaterial $material): array => [
                    'id' => $material->id,
                    'title' => $material->title,
                    'mime_type' => $material->mime_type,
                    'size' => $material->size,
                    'is_video' => str_starts_with($material->mime_type, 'video/'),
                    'download_url' => route('materials.download', $material),
                ])->all()
                : [],
            'teacher' => $course->teacher?->name,
            'banner_url' => $course->banner_path ? Storage::disk('public')->url($course->banner_path) : null,
            'sections' => $course->relationLoaded('sections')
                ? $course->sections->map(fn (CourseSection $section): array => [
                    'id' => $section->id,
                    'title' => $section->title,
                    'description' => $section->description,
                    'banner_url' => $section->banner_path ? Storage::disk('public')->url($section->banner_path) : null,
                    'lesson_count' => $lessons?->where('course_section_id', $section->id)->count() ?? 0,
                ])->all()
                : [],
            'effective_status' => $course->effectiveStatus(),
            'settings' => [
                'access_status' => $course->access_status,
                'duration_mode' => $course->duration_mode,
                'starts_at' => $course->starts_at?->format('Y-m-d\TH:i'),
                'ends_at' => $course->ends_at?->format('Y-m-d\TH:i'),
                'completed' => $course->isComplete(),
                'track_progress' => $course->track_progress,
                'participatory_auto_complete' => $course->participatory_auto_complete,
                'show_class_roster' => $course->show_class_roster,
                'allow_messages' => $course->allow_messages,
                'students_can_message_course_members' => $course->students_can_message_course_members,
                'allow_virtual_classroom' => $course->allow_virtual_classroom,
                'hide_inactive_students' => $course->hide_inactive_students,
                'mastery_instructors_visible' => $course->mastery_instructors_visible,
                'mastery_students_visible' => $course->mastery_students_visible,
            ],
        ];
    }

    /**
     * @param  array<int, int>  $completedLessonIds
     * @return array<string, mixed>
     */
    private function lessonData(Lesson $lesson, array $completedLessonIds, bool $locked = false): array
    {
        return [
            'id' => $lesson->id,
            'course_section_id' => $lesson->course_section_id,
            'title' => $lesson->title,
            'slug' => $lesson->slug,
            'summary' => $lesson->summary,
            'duration_minutes' => $lesson->duration_minutes,
            'completed' => in_array($lesson->id, $completedLessonIds),
            'requires_completion' => $lesson->requires_completion,
            'locked' => $locked,
        ];
    }

    /**
     * @param  Collection<int, Lesson>  $lessons
     * @param  array<int, int>  $completedLessonIds
     * @return array<int, array<string, mixed>>
     */
    private function courseLessonsData(Collection $lessons, array $completedLessonIds, ?User $user): array
    {
        $data = [];
        $previousLesson = null;

        foreach ($lessons as $lesson) {
            $locked = $user?->role === 'student'
                && $previousLesson instanceof Lesson
                && $previousLesson->requires_completion
                && ! in_array($previousLesson->id, $completedLessonIds);
            $data[] = $this->lessonData($lesson, $completedLessonIds, $locked);
            $previousLesson = $lesson;
        }

        return $data;
    }
}
