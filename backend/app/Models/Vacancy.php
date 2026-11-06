<?php

namespace App\Models;

use App\Services\VacancySources;
use Illuminate\Database\Eloquent\Model;

class Vacancy extends Model
{
    protected $guarded = ['id'];

    protected $appends = ['availability_status'];

    public function getAvailabilityStatusAttribute(): string
    {
        if (! $this->external_application) {
            return 'partner_vacancy';
        }
        if ($this->deadline && $this->deadline < today()->toDateString()) {
            return 'deadline_passed';
        }
        if (! $this->source_checked_at || $this->source_checked_at->lt(now()->subDays(30))) {
            return 'review_expired';
        }

        return (str_starts_with($this->source_url ?? '', VacancySources::NEGROS_PREFIX) || str_starts_with($this->source_url ?? '', VacancySources::ORIENTAL))
            && $this->deadline && $this->deadline >= today()->toDateString()
            && $this->source_checked_at?->gte(now()->subDays(7))
                ? 'source_lists_open' : 'confirm_availability';
    }

    protected function casts(): array
    {
        return ['skills' => 'array', 'is_sample' => 'boolean', 'external_application' => 'boolean', 'source_checked_at' => 'datetime'];
    }

    public function scopeAvailable($query)
    {
        return $query->currentSource()->where('status', 'published')->where(function ($q) {
            $q->where(fn ($local) => $local->where('external_application', false)->whereDate('deadline', '>=', today()))
                ->orWhere(fn ($external) => $external->where('external_application', true)->where('source_checked_at', '>=', now()->subDays(30))->where(fn ($date) => $date->whereNull('deadline')->orWhereDate('deadline', '>=', today())));
        });
    }

    public function scopeCurrentSource($query)
    {
        // Retire the removed provider from every catalog role and matching.
        // Keep its rows and foreign keys intact for saved/referral history.
        return $query->where(function ($q) {
            $q->where('external_application', false);
            foreach (VacancySources::PREFIXES as $prefix) {
                $q->orWhere('source_url', 'like', $prefix.'%');
            }
        });
    }
}
