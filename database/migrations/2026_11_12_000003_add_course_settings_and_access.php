<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->foreignId('learning_module_id')->nullable()->change();
            $table->string('access_status', 16)->default('open');
            $table->string('duration_mode', 16)->default('ongoing');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->boolean('track_progress')->default(true);
            $table->boolean('participatory_auto_complete')->default(true);
            $table->boolean('show_class_roster')->default(true);
            $table->boolean('allow_messages')->default(true);
            $table->boolean('students_can_message_course_members')->default(true);
            $table->boolean('allow_virtual_classroom')->default(true);
            $table->boolean('hide_inactive_students')->default(false);
            $table->boolean('mastery_instructors_visible')->default(true);
            $table->boolean('mastery_students_visible')->default(true);
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn([
                'access_status',
                'duration_mode',
                'starts_at',
                'ends_at',
                'completed_at',
                'track_progress',
                'participatory_auto_complete',
                'show_class_roster',
                'allow_messages',
                'students_can_message_course_members',
                'allow_virtual_classroom',
                'hide_inactive_students',
                'mastery_instructors_visible',
                'mastery_students_visible',
            ]);
            $table->foreignId('learning_module_id')->nullable(false)->change();
        });
    }
};
