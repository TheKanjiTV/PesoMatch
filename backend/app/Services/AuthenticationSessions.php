<?php

namespace App\Services;

use App\Listeners\AuthenticationActivity;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AuthenticationSessions
{
    public function hash(string $id): string
    {
        return hash_hmac('sha256', $id, config('app.key'));
    }

    public function touch(Request $request, string $previousHash): void
    {
        $guard = Auth::guard('web');
        $user = $guard->user();
        // Sanctum can retain its resolved user after web logout. Track only an
        // identity still present in the actual browser session payload.
        if (! $request->hasSession() || ! $user || (string) $request->session()->get($guard->getName()) !== (string) $user->id) {
            return;
        }
        $hash = $this->hash($request->session()->getId());
        DB::transaction(function () use ($request, $previousHash, $hash, $user) {
            if (! User::whereKey($user->id)->lockForUpdate()->first()) {
                return;
            }
            // Rotation continues the tracked session without inventing another login.
            $previous = DB::table('authentication_sessions')->where('session_hash', $previousHash)->where('user_id', $user->id)->whereNull('ended_at')->lockForUpdate()->first();
            if ($previous && $previousHash !== $hash) {
                DB::table('authentication_sessions')->where('id', $previous->id)->update(['session_hash' => $hash]);
            }
            $existing = DB::table('authentication_sessions')->where('session_hash', $hash)->lockForUpdate()->first();
            if ($existing?->ended_at) {
                return;
            }
            $values = ['last_seen_at' => now(), 'expires_at' => now()->addMinutes(config('session.lifetime')), 'ip_address' => $request->ip(), 'user_agent' => mb_substr(mb_convert_encoding($request->userAgent() ?? '', 'UTF-8', 'UTF-8'), 0, 512)];
            if ($existing) {
                DB::table('authentication_sessions')->where('id', $existing->id)->update($values);
            } else {
                DB::table('authentication_sessions')->insert($values + ['user_id' => $user->id, 'session_hash' => $hash, 'started_at' => now()]);
            }
        }, 3);
    }

    public function endHash(string $hash, string $reason): void
    {
        DB::table('authentication_sessions')->where('session_hash', $hash)->whereNull('ended_at')->update(['ended_at' => now(), 'end_reason' => $reason]);
    }

    public function revoke(User $user, string $reason, ?string $exceptSession = null): void
    {
        DB::transaction(function () use ($user, $reason, $exceptSession) {
            $sessions = DB::table('sessions')->where('user_id', $user->id);
            $tracked = DB::table('authentication_sessions')->where('user_id', $user->id)->whereNull('ended_at');
            if ($exceptSession !== null) {
                $sessions->where('id', '!=', $exceptSession);
                $tracked->where('session_hash', '!=', $this->hash($exceptSession));
            }
            $count = $sessions->count();
            $sessions->delete();
            $trackedCount = $tracked->update(['ended_at' => now(), 'end_reason' => $reason]);
            $user->forceFill(['remember_token' => null])->save();
            app(AuthenticationActivity::class)->record($user, 'auth.sessions_revoked', ['reason' => $reason, 'session_count' => $count, 'tracked_sessions' => $trackedCount, 'remember_tokens_revoked' => true, 'performed_by' => request()->user()?->id]);
        });
    }

    public function expire(): int
    {
        $count = 0;
        DB::table('authentication_sessions')->whereNull('ended_at')->where('expires_at', '<=', now())->orderBy('id')->chunkById(100, function ($rows) use (&$count) {
            foreach ($rows as $candidate) {
                DB::transaction(function () use ($candidate, &$count) {
                    $row = DB::table('authentication_sessions')->where('id', $candidate->id)->whereNull('ended_at')->where('expires_at', '<=', now())->lockForUpdate()->first();
                    if (! $row) {
                        return;
                    }
                    DB::table('authentication_sessions')->where('id', $row->id)->update(['ended_at' => $row->expires_at, 'end_reason' => 'inactivity']);
                    app(AuthenticationActivity::class)->recordFor($row->user_id, 'auth.session_expired', ['reason' => 'inactivity', 'ip_address' => $row->ip_address, 'user_agent' => $row->user_agent], Carbon::parse($row->expires_at));
                    $count++;
                });
            }
        });

        return $count;
    }
}
