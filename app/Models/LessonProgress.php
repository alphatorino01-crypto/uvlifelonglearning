<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property Carbon|CarbonImmutable|null $started_at
 * @property Carbon|CarbonImmutable|null $completed_at
 * @property int $elapsed_seconds
 * @property bool $timer_active
 * @property Carbon|CarbonImmutable|null $timer_last_active_at
 */
#[Fillable(['user_id', 'lesson_id', 'started_at', 'completed_at', 'elapsed_seconds', 'timer_active', 'timer_last_active_at'])]
class LessonProgress extends Model
{
    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'elapsed_seconds' => 'integer',
            'timer_active' => 'boolean',
            'timer_last_active_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Lesson, $this>
     */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
