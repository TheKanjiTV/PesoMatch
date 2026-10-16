<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PreferredWorkArrangement extends Model
{
    public $timestamps = false;

    protected $table = 'jobseeker_preferred_work_arrangements';

    protected $fillable = ['value'];
}
