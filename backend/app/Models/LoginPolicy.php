<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoginPolicy extends Model
{
    public const ID = 1;

    public const DEFAULT_STAGES = [
        ['attempts' => 3, 'lockout_minutes' => 5],
        ['attempts' => 3, 'lockout_minutes' => 10],
        ['attempts' => 5, 'lockout_minutes' => 60],
    ];

    protected $fillable = ['id', 'stages'];

    protected $casts = ['stages' => 'array'];

    public static function stages(): array
    {
        return static::find(self::ID)?->stages ?? self::DEFAULT_STAGES;
    }
}
