<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EnrollmentController;
use App\Http\Controllers\Admin\LearningCatalogController;
use App\Http\Controllers\Admin\UserRoleController;
use App\Http\Controllers\CourseMaterialController;
use App\Http\Controllers\LearningController;
use Illuminate\Support\Facades\Route;

Route::get('/', [LearningController::class, 'index'])->name('home');
Route::get('modules', [LearningController::class, 'modules'])->name('modules.index');
Route::get('modules/{module:slug}', [LearningController::class, 'showModule'])->name('modules.show');
Route::get('courses', [LearningController::class, 'courses'])->name('courses.index');
Route::get('courses/{course:slug}', [LearningController::class, 'showCourse'])->name('courses.show');
Route::get('courses/{course:slug}/lessons/{lesson:slug}', [LearningController::class, 'showLesson'])->name('lessons.show');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [LearningController::class, 'index'])->name('dashboard');
    Route::post('lessons/{lesson}/complete', [LearningController::class, 'completeLesson'])->name('lessons.complete');
    Route::get('materials/{material}/download', [CourseMaterialController::class, 'download'])->name('materials.download');

    Route::middleware('role:admin,teacher')->group(function () {
        Route::patch('lessons/{lesson}/prerequisite', [LearningController::class, 'updatePrerequisite'])->name('lessons.prerequisite');
        Route::post('courses/{course:slug}/lessons', [LearningCatalogController::class, 'storeLesson'])->name('lessons.store');
        Route::post('courses/{course}/sections', [LearningCatalogController::class, 'storeSection'])->name('courses.sections.store');
        Route::post('courses/{course:slug}/materials', [CourseMaterialController::class, 'store'])->name('materials.store');
        Route::delete('materials/{material}', [CourseMaterialController::class, 'destroy'])->name('materials.destroy');
    });

    Route::middleware('role:admin')->group(function () {
        Route::get('admin/dashboard', [DashboardController::class, 'index'])->name('admin.dashboard');
        Route::get('admin/catalog', [LearningCatalogController::class, 'index'])->name('admin.catalog');
        Route::post('admin/courses', [LearningCatalogController::class, 'storeCourse'])->name('admin.courses.store');
        Route::patch('admin/courses/{course}/settings', [LearningCatalogController::class, 'updateSettings'])->name('admin.courses.settings');
        Route::patch('admin/courses/{course}/teacher', [LearningCatalogController::class, 'assignTeacher'])->name('admin.courses.teacher');
        Route::get('admin/enrollments', [EnrollmentController::class, 'index'])->name('admin.enrollments');
        Route::post('admin/enrollments', [EnrollmentController::class, 'store'])->name('admin.enrollments.store');
        Route::delete('admin/enrollments/{enrollment}', [EnrollmentController::class, 'destroy'])->name('admin.enrollments.destroy');
        Route::get('admin/users', [UserRoleController::class, 'index'])->name('admin.users');
        Route::post('admin/users', [UserRoleController::class, 'store'])->name('admin.users.store');
        Route::put('admin/users/{user}', [UserRoleController::class, 'save'])->name('admin.users.save');
        Route::delete('admin/users/{user}', [UserRoleController::class, 'destroy'])->name('admin.users.destroy');
        Route::patch('admin/users/{user}/role', [UserRoleController::class, 'update'])->name('admin.users.role');
    });
});

require __DIR__.'/settings.php';
