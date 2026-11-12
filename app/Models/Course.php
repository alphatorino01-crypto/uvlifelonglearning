<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int|null $learning_module_id
 * @property string $access_status
 * @property string $duration_mode
 * @property Carbon|null $starts_at
 * @property Carbon|null $ends_at
 * @property Carbon|null $completed_at
 * @property-read int $lessons_count
 * @property-read int $completed_lessons_count
 */
#[Fillable([
    'learning_module_id',
    'teacher_id',
    'title',
    'slug',
    'summary',
    'instructor',
    'level',
    'duration_minutes',
    'sequence',
    'banner_path',
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
])]
class Course extends Model
{
    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'completed_at' => 'datetime',
            'track_progress' => 'boolean',
            'participatory_auto_complete' => 'boolean',
            'show_class_roster' => 'boolean',
            'allow_messages' => 'boolean',
            'students_can_message_course_members' => 'boolean',
            'allow_virtual_classroom' => 'boolean',
            'hide_inactive_students' => 'boolean',
            'mastery_instructors_visible' => 'boolean',
            'mastery_students_visible' => 'boolean',
        ];
    }

    public function effectiveStatus(): string
    {
        if ($this->completed_at !== null) {
            return 'complete';
        }

        if ($this->access_status === 'closed') {
            return 'closed';
        }

        if ($this->duration_mode === 'fixed' && (
            ($this->starts_at !== null && now()->lt($this->starts_at))
            || ($this->ends_at !== null && now()->gt($this->ends_at))
        )) {
            return 'closed';
        }

        return 'open';
    }

    public function isComplete(): bool
    {
        return $this->completed_at !== null;
    }

    public function studentHasAccess(User $user): bool
    {
        return $this->effectiveStatus() !== 'closed'
            && $this->enrollments()->where('user_id', $user->id)->exists();
    }

    /**
     * @return BelongsTo<LearningModule, $this>
     */
    public function module(): BelongsTo
    {
        return $this->belongsTo(LearningModule::class, 'learning_module_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    /**
     * @return HasMany<Lesson, $this>
     */
    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class)->orderBy('sequence');
    }

    /**
     * @return HasMany<CourseMaterial, $this>
     */
    public function materials(): HasMany
    {
        return $this->hasMany(CourseMaterial::class);
    }

    /**
     * @return HasMany<CourseSection, $this>
     */
    public function sections(): HasMany
    {
        return $this->hasMany(CourseSection::class)->orderBy('sequence');
    }

    /**
     * @return HasMany<CourseEnrollment, $this>
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(CourseEnrollment::class);
    }
}
