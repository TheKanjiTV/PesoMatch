<?php

namespace App\Listeners;

use App\Models\User;
use App\Services\AuthenticationSessions;
use Carbon\CarbonInterface;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AuthenticationActivity
{
    public const ACTIONS = ['auth.registered', 'auth.login', 'auth.logout', 'auth.login_failed', 'auth.lockout', 'auth.login_blocked', 'auth.login_throttled', 'auth.login_busy', 'auth.password_changed', 'auth.email_changed', 'auth.sessions_revoked', 'auth.session_expired', 'auth.account_archived', 'auth.account_restored', 'auth.account_deleted'];

    public function login(Login $event): void
    {
        if ($event->guard === 'web' && $event->user instanceof User) {
            $this->record($event->user, 'auth.login', ['remember' => $event->remember, 'method' => Auth::guard('web')->viaRemember() ? 'remember_cookie' : 'credentials']);
        }
    }

    public function logout(Logout $event): void
    {
        if ($event->guard === 'web' && $event->user instanceof User) {
            $this->record($event->user, 'auth.logout');
            if (request()->hasSession()) {
                app(AuthenticationSessions::class)->endHash(app(AuthenticationSessions::class)->hash(request()->session()->getId()), 'logout');
            }
        }
    }

    public function failed(Failed $event): void
    {
        // Unknown identities use a keyed fingerprint. Never persist credentials.
        if ($event->guard === 'web') {
            $this->attempt('auth.login_failed', $event->credentials['email'] ?? null);
        }
    }

    public function attempt(string $action, mixed $email, array $details = []): void
    {
        $email = is_string($email) ? mb_strtolower(trim($email)) : '';
        $user = $email !== '' ? User::withoutGlobalScope('active')->where('email', $email)->first() : null;
        $this->record($user, $action, $details + ($user ? [] : ['identity_fingerprint' => hash_hmac('sha256', $email, config('app.key'))]));
    }

    public function record(?User $user, string $action, array $details = []): void
    {
        $this->recordFor($user?->id, $action, [
            'ip_address' => request()->ip(),
            'user_agent' => mb_substr(request()->userAgent() ?? '', 0, 512),
            ...$details,
        ]);
    }

    public function recordFor(?int $userId, string $action, array $details = [], ?CarbonInterface $occurredAt = null): void
    {
        DB::table('audit_events')->insert([
            'actor_id' => $userId,
            'action' => $action,
            'entity' => $userId ? 'users' : 'authentication',
            'entity_id' => $userId ?? 0,
            'changes' => json_encode($details, JSON_THROW_ON_ERROR | JSON_INVALID_UTF8_SUBSTITUTE),
            'created_at' => $occurredAt ?? now(),
        ]);
    }
}
