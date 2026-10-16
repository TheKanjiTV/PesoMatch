<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Certification extends Model
{
    protected $table = 'jobseeker_certifications';

    protected $fillable = ['certification_name', 'issuing_organization', 'issued_at', 'credential_reference'];

    protected function casts(): array
    {
        return ['issued_at' => 'date:Y-m-d'];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(JobseekerProfile::class, 'jobseeker_profile_id');
    }
}
