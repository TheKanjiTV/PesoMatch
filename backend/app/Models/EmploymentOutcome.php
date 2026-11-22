<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmploymentOutcome extends Model
{
    protected $guarded = ['id'];

    public function user()
    {
        return $this->belongsTo(User::class)->withoutGlobalScope('active');
    }

    public function placement()
    {
        return $this->belongsTo(Placement::class);
    }
}
