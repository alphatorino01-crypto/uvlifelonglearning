<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default('student')->index();
        });

        Schema::table('lessons', function (Blueprint $table) {
            $table->boolean('requires_completion')->default(false);
        });

        Schema::table('lesson_progress', function (Blueprint $table) {
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable()->change();
        });

        Schema::create('course_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('uploaded_by')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->string('path');
            $table->string('mime_type', 127);
            $table->unsignedBigInteger('size');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_materials');

        Schema::table('lesson_progress', function (Blueprint $table) {
            $table->dropColumn('started_at');
            $table->timestamp('completed_at')->nullable(false)->change();
        });

        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn('requires_completion');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropColumn('role');
        });
    }
};
