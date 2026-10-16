<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResumeDocument extends Model
{
    protected $guarded = ['id'];

    protected $hidden = ['path', 'user_id'];

    protected function casts(): array
    {
        return ['detected' => 'array', 'applied_at' => 'datetime'];
    }
}
