<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $attributes = ['role' => 'jobseeker'];

    protected $fillable = ['name', 'first_name', 'middle_name', 'last_name', 'email', 'password'];

    protected $hidden = ['password', 'remember_token'];

    protected static function booted(): void
    {
        static::addGlobalScope('active', fn ($query) => $query->whereNull('users.archived_at'));
    }

    protected function casts(): array
    {
        return ['email_verified_at' => 'datetime', 'dashboard_tour_completed_at' => 'datetime', 'archived_at' => 'datetime', 'password' => 'hashed'];
    }

    public function jobseekerProfile(): HasOne
    {
        return $this->hasOne(JobseekerProfile::class);
    }
}
