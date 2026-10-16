<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceEvent extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['is_sample' => 'boolean', 'starts_at' => 'datetime', 'event_date' => 'date:Y-m-d', 'source_checked_at' => 'datetime'];
    }
}
