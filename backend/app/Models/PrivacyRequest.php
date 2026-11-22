<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrivacyRequest extends Model
{
    protected $fillable = ['reference', 'user_id', 'kind', 'details', 'status', 'response'];

    protected $hidden = ['user_id'];

    public function user()
    {
        return $this->belongsTo(User::class)->withoutGlobalScope('active');
    }
}
