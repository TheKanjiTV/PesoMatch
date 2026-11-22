<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Referral extends Model
{
    public const EMPLOYER_OPEN_STATES = ['referred', 'accepted', 'interviewing', 'offered'];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['match_snapshot' => 'array', 'interview_at' => 'datetime'];
    }

    public function scopeForEmployer($query, int $ownerId)
    {
        return $query->whereHas('vacancy', fn ($vacancy) => $vacancy->where('owner_id', $ownerId))
            ->where(function ($visible) {
                $visible->whereIn('status', [...self::EMPLOYER_OPEN_STATES, 'placed'])
                    ->orWhere(function ($declined) {
                        // Staff can decline a request before sharing it with an employer.
                        $declined->where('status', 'not_selected')->whereExists(fn ($audit) => $audit
                            ->selectRaw('1')->from('audit_events')
                            ->whereColumn('audit_events.entity_id', 'referrals.id')
                            ->where('entity', 'referrals')->where('action', 'referral.referred'));
                    });
            });
    }

    public function vacancy()
    {
        return $this->belongsTo(Vacancy::class)->withTrashed();
    }

    public function user()
    {
        return $this->belongsTo(User::class)->withoutGlobalScope('active');
    }

    public function placement()
    {
        return $this->hasOne(Placement::class);
    }
}
