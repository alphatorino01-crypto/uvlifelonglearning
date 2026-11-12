<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseSection;
use App\Models\LearningModule;
use App\Models\User;
use Database\Seeders\LearningContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admins_land_on_the_admin_dashboard_instead_of_my_learning(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);

        $this->actingAs($admin)
            ->get(route('home'))
            ->assertRedirect(route('admin.dashboard'));

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/dashboard')
                ->where('stats.users', 1)
                ->where('stats.courses', 0));
    }

    public function test_admin_can_create_course_banners_sections_and_section_lessons(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
        $teacher = User::factory()->create(['role' => 'teacher', 'email_verified_at' => now()]);
        $module = LearningModule::query()->create([
            'title' => 'Digital confidence',
            'slug' => 'digital-confidence',
            'description' => 'Everyday digital skills.',
            'color' => 'green',
            'sequence' => 1,
        ]);

        $this->actingAs($admin)
            ->post(route('admin.courses.store'), [
                'learning_module_id' => $module->id,
                'title' => 'Online basics',
                'summary' => 'Learn practical online skills.',
                'instructor' => $teacher->name,
                'teacher_id' => $teacher->id,
                'level' => 'Beginner',
                'lesson_title' => 'Welcome',
                'lesson_summary' => 'Introduction.',
                'lesson_content' => 'Welcome to the course.',
                'lesson_duration_minutes' => 5,
                'banner' => UploadedFile::fake()->create('course.jpg', 10, 'image/jpeg'),
            ])
            ->assertRedirect();

        $course = Course::query()->where('slug', 'online-basics')->firstOrFail();
        $this->assertSame($teacher->id, $course->teacher_id);
        Storage::disk('public')->assertExists($course->banner_path);

        $this->actingAs($admin)
            ->post(route('courses.sections.store', $course), [
                'title' => 'Getting started',
                'description' => 'Course introduction module.',
                'banner' => UploadedFile::fake()->create('section.jpg', 10, 'image/jpeg'),
            ])
            ->assertRedirect();

        $section = CourseSection::query()->where('course_id', $course->id)->firstOrFail();
        Storage::disk('public')->assertExists($section->banner_path);

        $this->actingAs($admin)
            ->post(route('lessons.store', $course), [
                'course_section_id' => $section->id,
                'title' => 'First steps',
                'summary' => 'Set up your learning.',
                'content' => 'Start with the basics.',
                'duration_minutes' => 8,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('lessons', [
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'slug' => 'first-steps',
        ]);
        $this->actingAs($admin)
            ->get(route('courses.show', $course))
            ->assertInertia(fn (Assert $page) => $page
                ->where('course.sections.0.title', 'Getting started')
                ->where('course.sections.0.lesson_count', 1)
                ->where('lessons.1.course_section_id', $section->id));
    }

    public function test_admin_can_manage_enrollments_and_teacher_assignments(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
        $teacher = User::factory()->create(['role' => 'teacher', 'email_verified_at' => now()]);
        $student = User::factory()->create(['role' => 'student', 'email_verified_at' => now()]);
        $module = LearningModule::query()->create([
            'title' => 'Creative practice',
            'slug' => 'creative-practice',
            'description' => 'Creative skills.',
            'color' => 'green',
            'sequence' => 1,
        ]);
        $course = Course::query()->create([
            'learning_module_id' => $module->id,
            'title' => 'Visual stories',
            'slug' => 'visual-stories',
            'summary' => 'Tell a story through images.',
            'instructor' => 'Instructor',
            'level' => 'Beginner',
            'duration_minutes' => 10,
            'sequence' => 1,
        ]);

        $this->actingAs($admin)
            ->patch(route('admin.courses.teacher', $course), ['teacher_id' => $teacher->id])
            ->assertRedirect();
        $this->assertSame($teacher->name, $course->fresh()->instructor);

        $this->actingAs($admin)
            ->post(route('admin.enrollments.store'), ['user_id' => $student->id, 'course_id' => $course->id])
            ->assertRedirect();
        $this->actingAs($admin)
            ->post(route('admin.enrollments.store'), ['user_id' => $student->id, 'course_id' => $course->id])
            ->assertRedirect();
        $this->assertDatabaseCount('course_enrollments', 1);
        $this->actingAs($admin)
            ->get(route('admin.enrollments'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/enrollments')
                ->has('enrollments', 1));

        $this->actingAs($admin)
            ->delete(route('admin.enrollments.destroy', CourseEnrollment::query()->firstOrFail()))
            ->assertRedirect();
        $this->assertDatabaseCount('course_enrollments', 0);
    }

    public function test_admin_can_create_update_and_delete_users_without_removing_last_admin(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
        $this->actingAs($admin)
            ->post(route('admin.users.store'), [
                'name' => 'Taylor Teacher',
                'email' => 'taylor@example.test',
                'role' => 'teacher',
                'password' => 'strong-password-123',
                'password_confirmation' => 'strong-password-123',
            ])
            ->assertRedirect();
        $created = User::query()->where('email', 'taylor@example.test')->firstOrFail();
        $this->assertSame('teacher', $created->role);
        $this->assertNotNull($created->email_verified_at);

        $this->actingAs($admin)
            ->put(route('admin.users.save', $created), [
                'name' => 'Taylor Updated',
                'email' => 'taylor.updated@example.test',
                'role' => 'student',
                'password' => null,
                'password_confirmation' => null,
            ])
            ->assertRedirect();
        $this->assertDatabaseHas('users', ['id' => $created->id, 'name' => 'Taylor Updated', 'role' => 'student']);

        $this->actingAs($admin)
            ->delete(route('admin.users.destroy', $created))
            ->assertRedirect();
        $this->assertDatabaseMissing('users', ['id' => $created->id]);
        $this->actingAs($admin)
            ->delete(route('admin.users.destroy', $admin))
            ->assertUnprocessable();
        $this->actingAs($admin)
            ->patch(route('admin.users.role', $admin), ['role' => 'student'])
            ->assertUnprocessable();
    }

    public function test_course_settings_control_enrollment_access_and_completed_course_review(): void
    {
        $this->seed(LearningContentSeeder::class);
        $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
        $student = User::factory()->create(['role' => 'student', 'email_verified_at' => now()]);
        $course = Course::query()->where('slug', 'everyday-digital-essentials')->firstOrFail();
        $lesson = $course->lessons()->firstOrFail();
        CourseEnrollment::query()->create(['course_id' => $course->id, 'user_id' => $student->id]);

        $settings = [
            'access_status' => 'open',
            'duration_mode' => 'fixed',
            'starts_at' => now()->subDay()->format('Y-m-d H:i:s'),
            'ends_at' => now()->addDay()->format('Y-m-d H:i:s'),
            'completed' => false,
            'track_progress' => true,
            'participatory_auto_complete' => false,
            'show_class_roster' => true,
            'allow_messages' => false,
            'students_can_message_course_members' => false,
            'allow_virtual_classroom' => true,
            'hide_inactive_students' => false,
            'mastery_instructors_visible' => true,
            'mastery_students_visible' => false,
        ];

        $this->actingAs($admin)
            ->patch(route('admin.courses.settings', $course), $settings)
            ->assertRedirect();

        $course->refresh();
        $this->assertSame('open', $course->effectiveStatus());
        $this->assertFalse($course->allow_messages);
        $this->assertFalse($course->mastery_students_visible);

        $this->actingAs($admin)
            ->patch(route('admin.courses.settings', $course), [
                ...$settings,
                'access_status' => 'closed',
            ])
            ->assertRedirect();

        $this->actingAs($student)
            ->get(route('courses.show', $course))
            ->assertInertia(fn (Assert $page) => $page
                ->where('course.effective_status', 'closed')
                ->where('course.can_access_content', false)
                ->has('lessons', 0));

        $this->actingAs($admin)
            ->patch(route('admin.courses.settings', $course), [
                ...$settings,
                'completed' => true,
            ])
            ->assertRedirect();

        $this->assertSame('complete', $course->fresh()->effectiveStatus());
        $this->actingAs($student)
            ->get(route('courses.show', $course))
            ->assertInertia(fn (Assert $page) => $page
                ->where('course.effective_status', 'complete')
                ->where('course.can_access_content', true)
                ->where('course.can_participate', false)
                ->has('lessons', 3));

        $this->actingAs($student)
            ->get(route('lessons.show', [$course, $lesson]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('course.can_participate', false)
                ->where('lesson.remaining_seconds', null));

        $this->actingAs($student)
            ->post(route('lessons.complete', $lesson))
            ->assertForbidden();

        $teacher = User::factory()->create(['role' => 'teacher', 'email_verified_at' => now()]);
        $this->actingAs($teacher)
            ->post(route('courses.sections.store', $course), ['title' => 'Locked module'])
            ->assertForbidden();
    }
}
