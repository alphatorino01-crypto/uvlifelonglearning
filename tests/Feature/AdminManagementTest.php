<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseDocument;
use App\Models\CourseEnrollment;
use App\Models\CourseSection;
use App\Models\LearningModule;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;
use Database\Seeders\LearningContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
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

    public function test_course_modules_can_be_reordered_and_order_is_persisted(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
        $module = LearningModule::query()->create([
            'title' => 'Digital confidence',
            'slug' => 'digital-confidence',
            'description' => 'Everyday digital skills.',
            'color' => 'green',
            'sequence' => 1,
        ]);
        $course = Course::query()->create([
            'learning_module_id' => $module->id,
            'title' => 'Online basics',
            'slug' => 'online-basics',
            'summary' => 'Learn practical online skills.',
            'instructor' => $admin->name,
            'level' => 'Beginner',
            'sequence' => 1,
        ]);
        $sections = collect(['First module', 'Second module', 'Third module'])
            ->map(fn (string $title, int $index) => CourseSection::query()->create([
                'course_id' => $course->id,
                'title' => $title,
                'slug' => 'module-'.($index + 1),
                'sequence' => $index + 1,
            ]));

        $this->actingAs($admin)
            ->patch(route('courses.sections.reorder', $course), [
                'sections' => [
                    $sections[2]->id,
                    $sections[0]->id,
                    $sections[1]->id,
                ],
            ])
            ->assertRedirect();

        $this->assertSame(
            [$sections[2]->id, $sections[0]->id, $sections[1]->id],
            $course->sections()->orderBy('sequence')->pluck('id')->all(),
        );
    }

    public function test_course_lesson_can_be_deleted_with_its_progress_and_course_duration_updated(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
        $student = User::factory()->create(['role' => 'student', 'email_verified_at' => now()]);
        $module = LearningModule::query()->create([
            'title' => 'Digital confidence',
            'slug' => 'digital-confidence',
            'description' => 'Everyday digital skills.',
            'color' => 'green',
            'sequence' => 1,
        ]);
        $course = Course::query()->create([
            'learning_module_id' => $module->id,
            'title' => 'Online basics',
            'slug' => 'online-basics',
            'summary' => 'Learn practical online skills.',
            'instructor' => $admin->name,
            'level' => 'Beginner',
            'duration_minutes' => 18,
            'sequence' => 1,
        ]);
        $section = CourseSection::query()->create([
            'course_id' => $course->id,
            'title' => 'Getting started',
            'slug' => 'getting-started',
            'sequence' => 1,
        ]);
        $lesson = Lesson::query()->create([
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'title' => 'First steps',
            'slug' => 'first-steps',
            'summary' => 'Set up your learning.',
            'content' => 'Start with the basics.',
            'duration_minutes' => 8,
            'sequence' => 1,
        ]);
        $remainingLesson = Lesson::query()->create([
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'title' => 'Next steps',
            'slug' => 'next-steps',
            'summary' => 'Continue learning.',
            'content' => 'Keep going.',
            'duration_minutes' => 10,
            'sequence' => 2,
        ]);
        LessonProgress::query()->create([
            'user_id' => $student->id,
            'lesson_id' => $lesson->id,
            'completed_at' => now(),
        ]);

        $this->actingAs($admin)
            ->delete(route('lessons.destroy', [$course, $lesson]))
            ->assertRedirect();

        $this->assertDatabaseMissing('lessons', ['id' => $lesson->id]);
        $this->assertDatabaseMissing('lesson_progress', ['lesson_id' => $lesson->id]);
        $this->assertDatabaseHas('lessons', ['id' => $remainingLesson->id]);
        $this->assertSame(10, $course->fresh()->duration_minutes);
    }

    public function test_course_document_editor_saves_blocks_and_respects_student_visibility(): void
    {
        Storage::fake('public');
        Storage::fake('local');
        $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
        $student = User::factory()->create(['role' => 'student', 'email_verified_at' => now()]);
        $module = LearningModule::query()->create([
            'title' => 'Digital confidence',
            'slug' => 'digital-confidence',
            'description' => 'Everyday digital skills.',
            'color' => 'green',
            'sequence' => 1,
        ]);
        $course = Course::query()->create([
            'learning_module_id' => $module->id,
            'title' => 'Online basics',
            'slug' => 'online-basics',
            'summary' => 'Learn practical online skills.',
            'instructor' => $admin->name,
            'level' => 'Beginner',
            'sequence' => 1,
        ]);
        $section = CourseSection::query()->create([
            'course_id' => $course->id,
            'title' => 'Getting started',
            'slug' => 'getting-started',
            'description' => 'Course introduction.',
            'sequence' => 1,
        ]);
        CourseEnrollment::query()->create([
            'course_id' => $course->id,
            'user_id' => $student->id,
        ]);

        $this->actingAs($admin)
            ->post(route('documents.store', $course), [
                'course_section_id' => $section->id,
                'title' => 'Welcome document',
                'hidden_from_students' => false,
                'blocks' => [
                    ['type' => 'content', 'content' => '<p><strong>Welcome to the course.</strong><script>alert(1)</script><a href="javascript:alert(1)">Unsafe link</a></p>'],
                    ['type' => 'divider'],
                    ['type' => 'image', 'file' => UploadedFile::fake()->createWithContent(
                        'welcome.png',
                        base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/rZsAAAAASUVORK5CYII='),
                    )],
                    ['type' => 'file', 'file' => UploadedFile::fake()->createWithContent('guide.txt', 'Read this guide.')],
                ],
            ])
            ->assertRedirect();

        $document = CourseDocument::query()->firstOrFail();
        $this->assertSame('Welcome document', $document->title);
        $this->assertCount(4, $document->blocks);
        Storage::disk('public')->assertExists($document->blocks[2]['path']);
        Storage::disk('local')->assertExists($document->blocks[3]['path']);

        $this->actingAs($student)
            ->get(route('documents.show', [$course, $document]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('learning/document')
                ->where('document.title', 'Welcome document')
                ->where('document.blocks.0.content', '<p><strong>Welcome to the course.</strong><a>Unsafe link</a></p>')
                ->where('document.blocks.2.type', 'image')
                ->where('document.blocks.3.title', 'guide.txt')
                ->where('course.slug', 'online-basics'));

        $this->actingAs($student)
            ->get(route('documents.files.download', [$course, $document, 3]))
            ->assertOk();

        $this->actingAs($student)
            ->get(route('courses.show', $course))
            ->assertInertia(fn (Assert $page) => $page
                ->where('course.sections.0.documents.0.title', 'Welcome document'));

        $document->update(['hidden_from_students' => true]);
        $this->actingAs($student)
            ->get(route('courses.show', $course))
            ->assertInertia(fn (Assert $page) => $page
                ->has('course.sections.0.documents', 0));
        $this->actingAs($student)
            ->get(route('documents.show', [$course, $document]))
            ->assertNotFound();
        $this->actingAs($student)
            ->get(route('documents.files.download', [$course, $document, 3]))
            ->assertNotFound();
    }

    public function test_admin_can_create_course_banners_sections_and_section_lessons(): void
    {
        Storage::fake('public');
        Storage::fake('local');
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
        $initialCourseBanner = $course->banner_path;

        $this->actingAs($admin)
            ->patch(route('courses.banner.update', $course), [
                'banner' => UploadedFile::fake()->create('replacement-banner.jpg', 10, 'image/jpeg'),
            ])
            ->assertRedirect();

        $course->refresh();
        $this->assertNotSame($initialCourseBanner, $course->banner_path);
        Storage::disk('public')->assertMissing($initialCourseBanner);
        Storage::disk('public')->assertExists($course->banner_path);
        $this->actingAs($admin)
            ->get(route('courses.show', $course))
            ->assertInertia(fn (Assert $page) => $page
                ->where('course.banner_url', Storage::disk('public')->url($course->banner_path)));

        $replacementCourseBanner = $course->banner_path;
        $this->actingAs($admin)
            ->patch(route('courses.banner.update', $course), [
                'remove_banner' => true,
            ])
            ->assertRedirect();

        $course->refresh();
        $this->assertNull($course->banner_path);
        Storage::disk('public')->assertMissing($replacementCourseBanner);

        $this->actingAs($admin)
            ->post(route('courses.sections.store', $course), [
                'title' => 'Getting started',
                'description' => 'Course introduction module.',
                'banner' => UploadedFile::fake()->create('section.jpg', 10, 'image/jpeg'),
            ])
            ->assertRedirect();

        $section = CourseSection::query()->where('course_id', $course->id)->firstOrFail();
        Storage::disk('public')->assertExists($section->banner_path);
        $oldBannerPath = $section->banner_path;

        $this->actingAs($admin)
            ->patch(route('courses.sections.update', [$course, $section]), [
                'title' => 'Getting started updated',
                'description' => 'Updated module introduction.',
                'banner' => UploadedFile::fake()->create('updated-section.jpg', 10, 'image/jpeg'),
            ])
            ->assertRedirect();

        $section->refresh();
        $this->assertSame('Getting started updated', $section->title);
        $this->assertSame('Updated module introduction.', $section->description);
        $this->assertNotSame($oldBannerPath, $section->banner_path);
        Storage::disk('public')->assertMissing($oldBannerPath);
        Storage::disk('public')->assertExists($section->banner_path);

        $this->actingAs($admin)
            ->post(route('materials.store', $course), [
                'course_section_id' => $section->id,
                'file' => UploadedFile::fake()->createWithContent('module-notes.txt', 'Module notes'),
            ])
            ->assertRedirect();

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
                ->where('course.sections.0.title', 'Getting started updated')
                ->where('course.sections.0.lesson_count', 1)
                ->where('course.sections.0.materials.0.title', 'module-notes.txt')
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
            ])
            ->assertRedirect()
            ->assertInertiaFlash('createdUserCredentials');
        $created = User::query()->where('email', 'taylor@example.test')->firstOrFail();
        $this->assertSame('teacher', $created->role);
        $this->assertNotNull($created->email_verified_at);
        $this->assertTrue($created->must_change_password);
        $credentials = session()->get('inertia.flash_data')['createdUserCredentials'];
        $this->assertSame('Taylor Teacher', $credentials['name']);
        $this->assertSame('taylor@example.test', $credentials['email']);
        $this->assertSame(8, strlen($credentials['password']));
        $this->assertMatchesRegularExpression('/[A-Z]/', $credentials['password']);
        $this->assertMatchesRegularExpression('/[a-z]/', $credentials['password']);
        $this->assertMatchesRegularExpression('/[0-9]/', $credentials['password']);
        $this->assertMatchesRegularExpression('/[^A-Za-z0-9]/', $credentials['password']);
        $this->assertTrue(Hash::check($credentials['password'], $created->password));

        $this->actingAs($admin)
            ->put(route('admin.users.save', $created), [
                'name' => 'Taylor Updated',
                'email' => 'taylor.updated@example.test',
                'role' => 'student',
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

    public function test_admin_can_reset_another_users_password_to_a_temporary_password(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
        $user = User::factory()->create([
            'role' => 'student',
            'password' => 'existing-password',
            'must_change_password' => false,
        ]);

        $response = $this->actingAs($admin)
            ->post(route('admin.users.reset-password', $user))
            ->assertRedirect()
            ->assertInertiaFlash('createdUserCredentials');

        $credentials = $response->getSession()->get('inertia.flash_data')['createdUserCredentials'];
        $user->refresh();

        $this->assertSame('reset', $credentials['action']);
        $this->assertSame($user->name, $credentials['name']);
        $this->assertSame($user->email, $credentials['email']);
        $this->assertSame(8, strlen($credentials['password']));
        $this->assertMatchesRegularExpression('/[A-Z]/', $credentials['password']);
        $this->assertMatchesRegularExpression('/[a-z]/', $credentials['password']);
        $this->assertMatchesRegularExpression('/[0-9]/', $credentials['password']);
        $this->assertMatchesRegularExpression('/[^A-Za-z0-9]/', $credentials['password']);
        $this->assertTrue(Hash::check($credentials['password'], $user->password));
        $this->assertTrue($user->must_change_password);
    }

    public function test_admin_cannot_reset_their_own_password_from_user_management(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);

        $this->actingAs($admin)
            ->post(route('admin.users.reset-password', $admin))
            ->assertUnprocessable();

        $this->assertFalse($admin->fresh()->must_change_password);
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
