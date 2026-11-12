<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_materials', function (Blueprint $table) {
            $table->foreignId('course_section_id')
                ->nullable()
                ->after('course_id')
                ->constrained('course_sections')
                ->nullOnDelete();
        });

        Schema::table('lesson_progress', function (Blueprint $table) {
            $table->unsignedInteger('elapsed_seconds')->default(0);
            $table->boolean('timer_active')->default(false);
            $table->timestamp('timer_last_active_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('lesson_progress', function (Blueprint $table) {
            $table->dropColumn(['elapsed_seconds', 'timer_active', 'timer_last_active_at']);
        });

        Schema::table('course_materials', function (Blueprint $table) {
            $table->dropConstrainedForeignId('course_section_id');
        });
    }
};
