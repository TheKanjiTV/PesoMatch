<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TableSetting extends Model
{
    public const ID = 1;

    public const DEFAULT_PER_PAGE = 20;

    protected $fillable = ['id', 'rows_per_page'];

    protected $casts = ['rows_per_page' => 'integer'];

    public static function perPage(): int
    {
        return max(1, min(20, static::find(self::ID)?->rows_per_page ?? self::DEFAULT_PER_PAGE));
    }
}
