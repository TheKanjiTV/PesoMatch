<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Enrollment extends Model
{
    use SoftDeletes;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['consent_accepted_at' => 'datetime'];
    }

    public function program()
    {
        return $this->belongsTo(TrainingProgram::class, 'training_program_id')->withTrashed();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
