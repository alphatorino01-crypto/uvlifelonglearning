<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property-read int $courses_count
 * @property-read int $lessons_count
 */
#[Fillable(['title', 'slug', 'description', 'color', 'sequence'])]
class LearningModule extends Model
{
    /**
     * @return HasMany<Course, $this>
     */
    public function courses(): HasMany
    {
        return $this->hasMany(Course::class)->orderBy('sequence');
    }
}
