<?php

namespace Tests\Feature;

use App\Models\LoginPolicy;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginAttemptsTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_locks_escalate_across_clients_and_success_resets_the_stage(): void
    {
        $this->freezeTime();
        $user = User::factory()->create(['role' => 'admin']);
        $wrong = ['email' => $user->email, 'password' => 'incorrect'];
        $correct = ['email' => strtoupper($user->email), 'password' => 'password'];

        foreach ([[3, 300], [3, 600], [5, 3600], [5, 3600]] as [$attempts, $duration]) {
            for ($remaining = $attempts - 1; $remaining > 0; $remaining--) {
                $this->postJson('/api/auth/login', $wrong)
                    ->assertUnprocessable()
                    ->assertJsonValidationErrors('email')
                    ->assertJsonPath('attempts_remaining', $remaining);
            }

            $this->postJson('/api/auth/login', $wrong)
                ->assertTooManyRequests()
                ->assertHeader('Retry-After', $duration)
                ->assertJsonPath('retry_after', $duration);

            $this->travel($duration - 1)->seconds();
            $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.20'])
                ->postJson('/api/auth/login', $correct)
                ->assertTooManyRequests()
                ->assertJsonPath('retry_after', 1);
            $this->assertGuest();
            $this->travel(1)->seconds();
        }

        $this->postJson('/api/auth/login', $correct)->assertOk()->assertJsonPath('user.id', $user->id);
        $this->postJson('/api/auth/login', $wrong)->assertUnprocessable()->assertJsonPath('attempts_remaining', 2);
    }

    public function test_only_admins_can_edit_the_policy_and_updates_apply_to_future_lockouts(): void
    {
        $this->freezeTime();
        $path = '/api/platform/login-policy';
        $stages = [
            ['attempts' => 1, 'lockout_minutes' => 3],
            ['attempts' => 2, 'lockout_minutes' => 12],
            ['attempts' => 6, 'lockout_minutes' => 90],
        ];
        $this->getJson($path)->assertUnauthorized();
        $this->actingAs(User::factory()->create(['role' => 'peso_staff']));
        $this->getJson($path)->assertForbidden();
        $this->patchJson($path, ['stages' => $stages])->assertForbidden();

        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->getJson($path)->assertOk()->assertJsonPath('stages', LoginPolicy::DEFAULT_STAGES);
        $this->patchJson($path, ['stages' => array_slice($stages, 1)])->assertUnprocessable()->assertJsonValidationErrors('stages');
        $this->patchJson($path, ['stages' => [['attempts' => 0, 'lockout_minutes' => 1441], $stages[1], $stages[2]]])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['stages.0.attempts', 'stages.0.lockout_minutes']);

        $this->patchJson($path, ['stages' => $stages])->assertOk();
        $this->getJson($path)->assertOk()->assertJsonPath('stages', $stages);
        $this->assertDatabaseHas('audit_events', ['actor_id' => $admin->id, 'action' => 'login_policy.updated']);

        $wrong = ['email' => 'unknown@example.test', 'password' => 'incorrect'];
        $this->postJson('/api/auth/login', $wrong)->assertTooManyRequests()->assertJsonPath('retry_after', 180);
        $this->patchJson($path, ['stages' => LoginPolicy::DEFAULT_STAGES])->assertOk();
        $this->postJson('/api/auth/login', $wrong)->assertTooManyRequests()->assertJsonPath('retry_after', 180);

        $this->travel(3)->minutes();
        $this->postJson('/api/auth/login', $wrong)->assertUnprocessable()->assertJsonPath('attempts_remaining', 2);
    }
}
