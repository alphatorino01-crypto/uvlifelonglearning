<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $course_id
 * @property int $user_id
 * @property Carbon $enrolled_at
 * @property-read Course $course
 * @property-read User $user
 */
#[Fillable(['course_id', 'user_id', 'enrolled_at'])]
class CourseEnrollment extends Model
{
    protected function casts(): array
    {
        return ['enrolled_at' => 'datetime'];
    }

    /**
     * @return BelongsTo<Course, $this>
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
