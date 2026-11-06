<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_validates_credentials_and_switches_accounts_with_an_existing_session(): void
    {
        foreach (['jobseeker', 'employer', 'admin'] as $role) {
            $user = User::factory()->create(['email' => $role.'@example.test']);
            $user->forceFill(['role' => $role])->save();

            $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password'])
                ->assertOk()
                ->assertJsonPath('user.id', $user->id)
                ->assertJsonPath('user.role', $role);

            $this->app['auth']->forgetGuards();
            $this->getJson('/api/auth/user')->assertOk()->assertJsonPath('user.id', $user->id);
        }
    }

    public function test_an_existing_session_does_not_bypass_login_credential_checks(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'incorrect'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->assertAuthenticatedAs($user, 'web');
    }
}
