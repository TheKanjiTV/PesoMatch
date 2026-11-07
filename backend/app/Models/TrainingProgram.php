<?php

namespace App\Models;

use App\Services\TrainingSources;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TrainingProgram extends Model
{
    use SoftDeletes;

    protected $guarded = ['id'];

    protected $hidden = ['intake_verification'];

    protected $appends = ['catalog_type', 'availability_status'];

    public function scopeAvailable($q)
    {
        return $q->where('status', 'published')->where(fn ($q) => $q->where(fn ($external) => $external->where('external_enrollment', true)->where('source_checked_at', '>=', now()->subDays(30))->where(fn ($end) => $end->whereNull('ends_on')->orWhereDate('ends_on', '>=', today())))->orWhere(fn ($local) => $local->where('external_enrollment', false)->whereDate('starts_on', '>=', today())));
    }

    public function getCatalogTypeAttribute(): string
    {
        return match ($this->source_name) {
            TrainingSources::REGISTERED => 'registered_program',
            TrainingSources::OVERSEAS => 'overseas_training',
            'TESDA Online Program' => 'online_course',
            default => 'partner_program',
        };
    }

    public function getAvailabilityStatusAttribute(): string
    {
        return match ($this->catalog_type) {
            'registered_program' => 'intake_unconfirmed',
            'overseas_training' => 'official_announcement',
            'online_course' => 'online_catalog',
            default => 'partner_program',
        };
    }

    public function getFeeAttribute($value)
    {
        // A registered-program listing publishes no fee. Zero in the legacy
        // storage schema must never be exposed as a claim that training is free.
        return $this->catalog_type === 'registered_program' ? null : $value;
    }

    protected function casts(): array
    {
        return ['skills' => 'array', 'is_sample' => 'boolean', 'external_enrollment' => 'boolean', 'source_checked_at' => 'datetime'];
    }
}
