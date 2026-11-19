<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiPractice extends Model
{
    protected $guarded = ['id'];

    protected $hidden = ['user_id'];

    protected function casts(): array
    {
        return ['transcript' => 'encrypted:array', 'completed_at' => 'datetime', 'expires_at' => 'datetime'];
    }
}
