<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vacancy extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['skills' => 'array', 'is_sample' => 'boolean', 'external_application' => 'boolean', 'source_checked_at' => 'datetime'];
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', 'published')->where(function ($q) {
            $q->where(fn ($local) => $local->where('external_application', false)->whereDate('deadline', '>=', today()))
                ->orWhere(fn ($external) => $external->where('external_application', true)->where('source_checked_at', '>=', now()->subDays(30))->where(fn ($date) => $date->whereNull('deadline')->orWhereDate('deadline', '>=', today())));
        });
    }
}
