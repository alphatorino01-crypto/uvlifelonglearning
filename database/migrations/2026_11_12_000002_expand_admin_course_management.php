<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->foreignId('teacher_id')->nullable()->after('learning_module_id')->constrained('users')->nullOnDelete();
            $table->string('banner_path')->nullable();
        });

        Schema::create('course_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->string('banner_path')->nullable();
            $table->unsignedSmallInteger('sequence')->default(0);
            $table->timestamps();
            $table->unique(['course_id', 'slug']);
        });

        Schema::table('lessons', function (Blueprint $table) {
            $table->foreignId('course_section_id')->nullable()->after('course_id')->constrained('course_sections')->nullOnDelete();
        });

        Schema::create('course_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('enrolled_at')->useCurrent();
            $table->timestamps();
            $table->unique(['course_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_enrollments');

        Schema::table('lessons', function (Blueprint $table) {
            $table->dropConstrainedForeignId('course_section_id');
        });

        Schema::dropIfExists('course_sections');

        Schema::table('courses', function (Blueprint $table) {
            $table->dropConstrainedForeignId('teacher_id');
            $table->dropColumn('banner_path');
        });
    }
};
