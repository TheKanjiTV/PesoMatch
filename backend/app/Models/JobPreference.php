<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobPreference extends Model
{
    protected $table = 'jobseeker_preferences';

    protected $fillable = ['preferred_industry', 'preferred_location', 'willing_to_relocate'];

    protected function casts(): array
    {
        return ['willing_to_relocate' => 'boolean'];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(JobseekerProfile::class, 'jobseeker_profile_id');
    }

    public function occupations(): HasMany
    {
        return $this->hasMany(PreferredOccupation::class, 'jobseeker_preference_id');
    }

    public function employmentTypes(): HasMany
    {
        return $this->hasMany(PreferredEmploymentType::class, 'jobseeker_preference_id');
    }

    public function workArrangements(): HasMany
    {
        return $this->hasMany(PreferredWorkArrangement::class, 'jobseeker_preference_id');
    }
}
