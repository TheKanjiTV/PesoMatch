<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Education extends Model
{
    protected $table = 'jobseeker_educations';

    protected $fillable = ['highest_attainment', 'school_name', 'course_program', 'year_graduated', 'year_level', 'educational_status'];

    protected function casts(): array
    {
        return ['year_graduated' => 'integer'];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(JobseekerProfile::class, 'jobseeker_profile_id');
    }
}
