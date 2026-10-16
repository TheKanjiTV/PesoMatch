<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Referral extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['match_snapshot' => 'array', 'interview_at' => 'datetime'];
    }

    public function vacancy()
    {
        return $this->belongsTo(Vacancy::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function placement()
    {
        return $this->hasOne(Placement::class);
    }
}
