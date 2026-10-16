<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PreferredOccupation extends Model
{
    public $timestamps = false;

    protected $table = 'jobseeker_preferred_occupations';

    protected $fillable = ['value'];
}
