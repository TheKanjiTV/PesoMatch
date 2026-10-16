<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingProgram extends Model
{
    protected $guarded = ['id'];

    public function scopeAvailable($q)
    {
        return $q->where('status', 'published')->where(fn ($q) => $q->where('external_enrollment', true)->orWhereDate('starts_on', '>=', today()));
    }

    protected function casts(): array
    {
        return ['skills' => 'array', 'is_sample' => 'boolean', 'external_enrollment' => 'boolean', 'source_checked_at' => 'datetime'];
    }
}
