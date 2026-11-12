<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\LearningModule;
use App\Models\Lesson;
use App\Models\User;
use Database\Seeders\LearningContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LearningExperienceTest extends TestCase
{
    use RefreshDatabase;

    public function test_learning_home_shows_modules_and_courses(): void
    {
        $this->seed(LearningContentSeeder::class);

        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('learning/index')
                ->has('modules', 3)
                ->has('courses', 6)
                ->where('courses.0.title', 'Everyday digital essentials'));
    }

    public function test_module_and_course_pages_show_their_learning_content(): void
    {
        $this->seed(LearningContentSeeder::class);

        $module = LearningModule::query()->where('slug', 'digital-confidence')->firstOrFail();
        $course = Course::query()->where('slug', 'everyday-digital-essentials')->firstOrFail();

        $this->get(route('modules.show', $module))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('learning/module')
                ->where('module.title', 'Digital confidence')
                ->has('courses', 2));

        $student = User::factory()->create(['email_verified_at' => now()]);
        CourseEnrollment::query()->create(['course_id' => $course->id, 'user_id' => $student->id]);
        $this->assertSame('student', $student->fresh()->role);
        $this->assertDatabaseHas('course_enrollments', ['course_id' => $course->id, 'user_id' => $student->id]);

        $this->actingAs($student)->get(route('courses.show', $course))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('learning/course')
                ->where('auth.user.name', $student->name)
                ->where('auth.user.role', 'student')
                ->where('course.title', 'Everyday digital essentials')
                ->where('course.effective_status', 'open')
                ->where('course.can_access_content', true)
                ->has('lessons', 3));
    }

    public function test_lesson_content_and_adjacent_lessons_are_available(): void
    {
        $this->seed(LearningContentSeeder::class);

        $course = Course::query()->where('slug', 'everyday-digital-essentials')->firstOrFail();
        $lesson = $course->lessons()->orderBy('sequence')->firstOrFail();
        $student = User::factory()->create(['email_verified_at' => now()]);
        CourseEnrollment::query()->create(['course_id' => $course->id, 'user_id' => $student->id]);

        $this->actingAs($student)->get(route('lessons.show', [$course, $lesson]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('learning/lesson')
                ->where('lesson.title', 'Getting started online')
                ->where('previousLesson', null)
                ->where('nextLesson.title', 'Organize your digital workspace')
                ->where('lesson.content', fn (string $content) => str_contains($content, 'The internet')));
    }

    public function test_students_must_be_enrolled_to_access_open_course_content(): void
    {
        $this->seed(LearningContentSeeder::class);
        $course = Course::query()->where('slug', 'everyday-digital-essentials')->firstOrFail();
        $lesson = $course->lessons()->firstOrFail();
        $student = User::factory()->create(['email_verified_at' => now()]);

        $this->actingAs($student)
            ->get(route('courses.show', $course))
            ->assertInertia(fn (Assert $page) => $page
                ->where('course.effective_status', 'open')
                ->where('course.can_access_content', false)
                ->has('lessons', 0));

        $this->actingAs($student)
            ->get(route('lessons.show', [$course, $lesson]))
            ->assertForbidden();
    }

    public function test_a_lesson_cannot_be_opened_through_an_unrelated_course(): void
    {
        $this->seed(LearningContentSeeder::class);

        $course = Course::query()->where('slug', 'everyday-digital-essentials')->firstOrFail();
        $otherCourse = Course::query()->where('slug', 'stay-safe-online')->firstOrFail();
        $lesson = $course->lessons()->firstOrFail();

        $this->get(route('lessons.show', [$otherCourse, $lesson]))->assertNotFound();
    }

    public function test_only_verified_learners_can_save_lesson_progress(): void
    {
        $this->seed(LearningContentSeeder::class);
        $lesson = Lesson::query()->firstOrFail();

        $this->post(route('lessons.complete', $lesson))->assertRedirect(route('login'));

        $learner = User::factory()->create(['email_verified_at' => now()]);
        CourseEnrollment::query()->create(['course_id' => $lesson->course_id, 'user_id' => $learner->id]);

        $this->actingAs($learner)
            ->post(route('lessons.complete', $lesson))
            ->assertSessionHasErrors('lesson');
        $this->assertDatabaseCount('lesson_progress', 0);

        $this->actingAs($learner)
            ->get(route('lessons.show', [$lesson->course, $lesson]))
            ->assertOk();

        $this->actingAs($learner)
            ->post(route('lessons.complete', $lesson))
            ->assertSessionHasErrors('lesson');

        $this->travel($lesson->duration_minutes)->minutes();

        $this->actingAs($learner)
            ->post(route('lessons.complete', $lesson), ['continue' => true])
            ->assertRedirect(route(
                'lessons.show',
                [$lesson->course, $lesson->course->lessons()->orderBy('sequence')->skip(1)->firstOrFail()],
            ));

        $this->assertDatabaseHas('lesson_progress', [
            'user_id' => $learner->id,
            'lesson_id' => $lesson->id,
            'completed_at' => now()->toDateTimeString(),
        ]);
        $this->assertDatabaseCount('lesson_progress', 1);

        $this->get(route('courses.show', $lesson->course))
            ->assertInertia(fn (Assert $page) => $page
                ->where('course.settings.track_progress', true)
                ->where('course.completed_count', 1)
                ->where('course.progress', 33)
                ->where('course.completed_count', 1)
                ->where('lessons.0.completed', true));
    }

    public function test_teacher_can_set_a_prerequisite_and_students_cannot_skip_it(): void
    {
        $this->seed(LearningContentSeeder::class);
        $course = Course::query()->where('slug', 'everyday-digital-essentials')->firstOrFail();
        $lessons = $course->lessons()->get();
        $teacher = User::factory()->create(['role' => 'teacher', 'email_verified_at' => now()]);
        $student = User::factory()->create(['role' => 'student', 'email_verified_at' => now()]);
        CourseEnrollment::query()->create(['course_id' => $course->id, 'user_id' => $student->id]);

        $this->actingAs($teacher)
            ->patch(route('lessons.prerequisite', $lessons[0]), ['requires_completion' => true])
            ->assertRedirect();

        $this->assertDatabaseHas('lessons', ['id' => $lessons[0]->id, 'requires_completion' => true]);

        $this->actingAs($student)
            ->get(route('courses.show', $course))
            ->assertInertia(fn (Assert $page) => $page->where('lessons.1.locked', true));

        $this->actingAs($student)
            ->get(route('lessons.show', [$course, $lessons[1]]))
            ->assertForbidden();

        $this->actingAs($student)
            ->post(route('lessons.complete', $lessons[1]))
            ->assertForbidden();
        $this->assertDatabaseMissing('lesson_progress', [
            'user_id' => $student->id,
            'lesson_id' => $lessons[1]->id,
        ]);

        $this->actingAs($student)
            ->patch(route('lessons.prerequisite', $lessons[0]), ['requires_completion' => false])
            ->assertForbidden();
    }

    public function test_the_lesson_timer_resumes_and_a_learner_can_stay_after_completion(): void
    {
        $this->seed(LearningContentSeeder::class);
        $lesson = Lesson::query()->firstOrFail();
        $learner = User::factory()->create(['email_verified_at' => now()]);
        CourseEnrollment::query()->create(['course_id' => $lesson->course_id, 'user_id' => $learner->id]);
        $lessonUrl = route('lessons.show', [$lesson->course, $lesson]);

        $this->actingAs($learner)
            ->get($lessonUrl)
            ->assertInertia(fn (Assert $page) => $page->where('lesson.remaining_seconds', $lesson->duration_minutes * 60));

        $this->travel(2)->minutes();

        $this->actingAs($learner)
            ->get($lessonUrl)
            ->assertInertia(fn (Assert $page) => $page->where('lesson.remaining_seconds', $lesson->duration_minutes * 60 - 120));

        $this->travel($lesson->duration_minutes - 2)->minutes();

        $this->actingAs($learner)
            ->post(route('lessons.complete', $lesson), ['continue' => false])
            ->assertRedirect($lessonUrl);

        $this->assertDatabaseHas('lesson_progress', [
            'user_id' => $learner->id,
            'lesson_id' => $lesson->id,
        ]);
    }

    public function test_teacher_can_upload_course_material_and_students_can_download_it(): void
    {
        Storage::fake('local');
        $this->seed(LearningContentSeeder::class);
        $course = Course::query()->where('slug', 'everyday-digital-essentials')->firstOrFail();
        $teacher = User::factory()->create(['role' => 'teacher', 'email_verified_at' => now()]);
        $student = User::factory()->create(['role' => 'student', 'email_verified_at' => now()]);
        CourseEnrollment::query()->create(['course_id' => $course->id, 'user_id' => $student->id]);
        $file = UploadedFile::fake()->createWithContent('course-notes.txt', 'Lesson notes');

        $this->actingAs($teacher)
            ->post(route('materials.store', $course), ['file' => $file])
            ->assertRedirect();

        $material = $course->materials()->firstOrFail();
        Storage::disk('local')->assertExists($material->path);

        $this->actingAs($student)
            ->get(route('materials.download', $material))
            ->assertOk();

        $this->actingAs($student)
            ->get(route('courses.show', $course))
            ->assertInertia(fn (Assert $page) => $page
                ->where('course.materials.0.title', 'course-notes.txt')
                ->where('course.materials.0.is_video', false));
    }

    public function test_only_an_administrator_can_manage_roles_and_cannot_remove_the_last_admin(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
        $student = User::factory()->create(['role' => 'student', 'email_verified_at' => now()]);

        $this->actingAs($student)->get(route('admin.users'))->assertForbidden();

        $this->actingAs($admin)
            ->get(route('admin.users'))
            ->assertInertia(fn (Assert $page) => $page->component('admin/users')->has('users', 2));

        $this->actingAs($admin)
            ->patch(route('admin.users.role', $student), ['role' => 'teacher'])
            ->assertRedirect();
        $this->assertDatabaseHas('users', ['id' => $student->id, 'role' => 'teacher']);

        $this->actingAs($admin)
            ->patch(route('admin.users.role', $admin), ['role' => 'student'])
            ->assertUnprocessable();
    }

    public function test_an_administrator_can_create_a_course_and_first_lesson_without_a_learning_path(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);

        $this->actingAs($admin)
            ->post(route('admin.courses.store'), [
                'title' => 'Better presentations',
                'summary' => 'Create clear, useful presentations.',
                'instructor' => 'Casey Lee',
                'level' => 'Beginner',
                'lesson_title' => 'Start with your audience',
                'lesson_summary' => 'Understand what your audience needs to know.',
                'lesson_content' => 'Define your audience before you begin.',
                'lesson_duration_minutes' => '12',
            ])
            ->assertRedirect(route('courses.show', 'better-presentations'));

        $course = Course::query()->where('slug', 'better-presentations')->firstOrFail();
        $this->assertNull($course->learning_module_id);
        $this->assertDatabaseHas('lessons', [
            'course_id' => $course->id,
            'slug' => 'start-with-your-audience',
            'duration_minutes' => 12,
        ]);
    }

    public function test_an_authorized_teacher_can_add_a_lesson_to_a_course(): void
    {
        $this->seed(LearningContentSeeder::class);
        $course = Course::query()->where('slug', 'everyday-digital-essentials')->firstOrFail();
        $teacher = User::factory()->create(['role' => 'teacher', 'email_verified_at' => now()]);

        $this->actingAs($teacher)
            ->post(route('lessons.store', $course), [
                'title' => 'A clearer digital routine',
                'summary' => 'Build a habit for managing your day online.',
                'content' => 'Start with one small action.',
                'duration_minutes' => '15',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('lessons', [
            'course_id' => $course->id,
            'slug' => 'a-clearer-digital-routine',
            'sequence' => 3,
        ]);
        $this->assertSame(
            (int) $course->lessons()->sum('duration_minutes'),
            $course->fresh()->duration_minutes,
        );
    }
}
