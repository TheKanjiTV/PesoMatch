<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class License extends Model
{
    protected $table = 'jobseeker_licenses';

    protected $fillable = ['license_name', 'license_number', 'expiry_date'];

    protected function casts(): array
    {
        return ['expiry_date' => 'date:Y-m-d'];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(JobseekerProfile::class, 'jobseeker_profile_id');
    }
}
