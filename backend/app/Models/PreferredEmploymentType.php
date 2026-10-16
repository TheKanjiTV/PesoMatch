<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PreferredEmploymentType extends Model
{
    public $timestamps = false;

    protected $table = 'jobseeker_preferred_employment_types';

    protected $fillable = ['value'];
}
