<?php

namespace App\Services;

use App\Models\LoginPolicy;
use App\Models\User;
use Closure;
use Illuminate\Support\Facades\Cache;

class LoginAttempts
{
    public function attempt(string $email, Closure $authenticate): ?array
    {
        // Use the stored spelling when the database treats multiple spellings as equal.
        $email = User::where('email', $email)->value('email') ?? $email;
        $key = 'login-attempts:'.hash_hmac('sha256', strtolower($email), config('app.key'));

        return Cache::lock($key.':lock', 30)->block(3, function () use ($key, $authenticate) {
            $state = Cache::get($key, ['stage' => 0, 'failures' => 0, 'locked_until' => 0]);
            $retryAfter = $state['locked_until'] - now()->timestamp;

            if ($retryAfter > 0) {
                return ['retry_after' => $retryAfter];
            }

            if ($authenticate()) {
                Cache::forget($key);

                return null;
            }

            $stages = LoginPolicy::stages();
            $stage = $stages[$state['stage']];
            $remaining = $stage['attempts'] - ++$state['failures'];
            $retryAfter = 0;

            if ($remaining <= 0) {
                $retryAfter = $stage['lockout_minutes'] * 60;
                $state = [
                    'stage' => min($state['stage'] + 1, count($stages) - 1),
                    'failures' => 0,
                    'locked_until' => now()->timestamp + $retryAfter,
                ];
            }

            Cache::put($key, $state, now()->addSeconds($retryAfter)->addDay());

            return $retryAfter > 0
                ? ['retry_after' => $retryAfter]
                : ['attempts_remaining' => $remaining];
        });
    }
}
