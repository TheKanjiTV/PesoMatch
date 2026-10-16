<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['consent_accepted_at' => 'datetime'];
    }

    public function program()
    {
        return $this->belongsTo(TrainingProgram::class, 'training_program_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
