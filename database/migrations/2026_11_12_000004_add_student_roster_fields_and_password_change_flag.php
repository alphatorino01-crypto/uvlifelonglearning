<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('must_change_password')->default(false);
            $table->string('student_no')->nullable()->unique();
            $table->string('first_name')->nullable();
            $table->string('middle_name')->nullable();
            $table->string('last_name')->nullable();
            $table->date('date_enrolled')->nullable();
            $table->string('status')->nullable();
            $table->string('modality')->nullable();
            $table->string('class_id')->nullable();
            $table->string('subject')->nullable();
            $table->string('section')->nullable();
            $table->string('schedule')->nullable();
            $table->string('o365_email')->nullable()->index();
            $table->string('display_name')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['student_no']);
            $table->dropIndex(['o365_email']);
            $table->dropColumn([
                'must_change_password',
                'student_no',
                'first_name',
                'middle_name',
                'last_name',
                'date_enrolled',
                'status',
                'modality',
                'class_id',
                'subject',
                'section',
                'schedule',
                'o365_email',
                'display_name',
            ]);
        });
    }
};
