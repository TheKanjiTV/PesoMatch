<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PublicResource extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['indicators' => 'array', 'source_checked_at' => 'datetime'];
    }
}
