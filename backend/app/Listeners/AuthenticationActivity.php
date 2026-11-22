<?php

namespace App\Listeners;

use App\Models\User;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Support\Facades\DB;

class AuthenticationActivity
{
    public const ACTIONS = ['auth.login', 'auth.logout', 'auth.login_failed'];

    public function login(Login $event): void
    {
        if ($event->guard === 'web' && $event->user instanceof User) {
            $this->record($event->user, 'auth.login', ['remember' => $event->remember]);
        }
    }

    public function logout(Logout $event): void
    {
        if ($event->guard === 'web' && $event->user instanceof User) {
            $this->record($event->user, 'auth.logout');
        }
    }

    public function failed(Failed $event): void
    {
        // Unknown emails have no account history. Never persist credentials.
        if ($event->guard === 'web' && $event->user instanceof User) {
            $this->record($event->user, 'auth.login_failed');
        }
    }

    public function record(User $user, string $action, array $details = []): void
    {
        DB::table('audit_events')->insert([
            'actor_id' => $user->id,
            'action' => $action,
            'entity' => 'users',
            'entity_id' => $user->id,
            'changes' => json_encode([
                'ip_address' => request()->ip(),
                'user_agent' => mb_substr(request()->userAgent() ?? '', 0, 512),
                ...$details,
            ], JSON_THROW_ON_ERROR),
            'created_at' => now(),
        ]);
    }
}
