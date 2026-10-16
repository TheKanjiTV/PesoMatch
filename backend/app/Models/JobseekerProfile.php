<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class JobseekerProfile extends Model
{
    public const STEPS = ['personal', 'education', 'skills', 'work_experience', 'preferences'];

    protected $fillable = ['birth_date', 'sex', 'mobile_number', 'address_line', 'province', 'municipality', 'barangay', 'has_work_experience'];

    protected function casts(): array
    {
        return ['birth_date' => 'date:Y-m-d', 'has_work_experience' => 'boolean', 'profile_completed_at' => 'datetime', 'personal_completed_at' => 'datetime', 'education_completed_at' => 'datetime', 'skills_completed_at' => 'datetime', 'work_experience_completed_at' => 'datetime', 'preferences_completed_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function education(): HasOne
    {
        return $this->hasOne(Education::class);
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'jobseeker_skill')->withTimestamps();
    }

    public function certifications(): HasMany
    {
        return $this->hasMany(Certification::class);
    }

    public function languages(): HasMany
    {
        return $this->hasMany(Language::class);
    }

    public function licenses(): HasMany
    {
        return $this->hasMany(License::class);
    }

    public function workExperiences(): HasMany
    {
        return $this->hasMany(WorkExperience::class);
    }

    public function preferences(): HasOne
    {
        return $this->hasOne(JobPreference::class);
    }

    public function onboarding(): array
    {
        $completed = array_values(array_filter(self::STEPS, fn ($step) => $this->{$step.'_completed_at'} !== null));
        $first = collect(self::STEPS)->search(fn ($step) => ! in_array($step, $completed, true));

        return ['current_step' => $first === false ? 5 : $first + 1, 'completed' => $this->profile_completed_at !== null, 'completion_percentage' => count($completed) * 20, 'completed_steps' => $completed];
    }
}
