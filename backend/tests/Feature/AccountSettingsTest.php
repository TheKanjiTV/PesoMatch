<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AccountSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Referer' => 'http://localhost:8443/']);
    }

    public function test_account_endpoints_require_authentication(): void
    {
        $this->patchJson('/api/auth/account', [])->assertUnauthorized();
        $this->patchJson('/api/auth/password', [])->assertUnauthorized();
        $this->deleteJson('/api/auth/account', [])->assertUnauthorized();
    }

    public function test_only_current_account_can_be_changed_and_email_becomes_unverified(): void
    {
        $owner = User::factory()->create(['password' => 'OldPass123!', 'email_verified_at' => now()]);
        $other = User::factory()->create();
        $owner->jobseekerProfile()->create(['mobile_number' => '+639171234567']);
        $this->actingAs($owner);
        $data = ['first_name' => 'Ana', 'last_name' => 'Cruz', 'email' => 'NEW@example.test', 'mobile_number' => '0917 123 4567', 'current_password' => 'OldPass123!'];
        $this->patchJson('/api/auth/account', [...$data, 'user_id' => $other->id])->assertUnprocessable();
        $this->patchJson('/api/auth/account', [...$data, 'current_password' => 'wrong'])->assertUnprocessable();
        $this->patchJson('/api/auth/account', $data)->assertOk()->assertJsonPath('user.email', 'new@example.test')->assertJsonPath('user.email_verified_at', null)->assertJsonMissingPath('user.password');
        $this->assertDatabaseHas('users', ['id' => $owner->id, 'name' => 'Ana Cruz']);
        $this->assertDatabaseHas('audit_events', ['actor_id' => $owner->id, 'action' => 'auth.email_changed']);
        $this->assertDatabaseHas('users', ['id' => $other->id, 'email' => $other->email]);
        $this->assertDatabaseHas('jobseeker_profiles', ['user_id' => $owner->id, 'mobile_number' => '+639171234567']);
    }

    public function test_password_requires_current_password_and_confirmation_then_changes_hash(): void
    {
        $user = User::factory()->create(['password' => 'OldPass123!']);
        $this->actingAs($user);
        $this->patchJson('/api/auth/password', ['current_password' => 'wrong', 'password' => 'NewPass123!', 'password_confirmation' => 'NewPass123!'])->assertUnprocessable();
        $this->patchJson('/api/auth/password', ['current_password' => 'OldPass123!', 'password' => 'NewPass123!', 'password_confirmation' => 'mismatch'])->assertUnprocessable();
        $this->patchJson('/api/auth/password', ['current_password' => 'OldPass123!', 'password' => 'NewPass123!', 'password_confirmation' => 'NewPass123!'])->assertOk();
        $this->assertTrue(Hash::check('NewPass123!', $user->fresh()->password));
        $this->assertFalse(Hash::check('OldPass123!', $user->fresh()->password));
    }

    public function test_delete_requires_current_password_and_cascades_only_own_profile(): void
    {
        $owner = User::factory()->create(['password' => 'OldPass123!']);
        $other = User::factory()->create();
        $profile = $owner->jobseekerProfile()->create(['mobile_number' => '+639171234567']);
        $profile->languages()->create(['language' => 'Filipino', 'proficiency' => 'Native']);
        $this->actingAs($owner);
        $this->deleteJson('/api/auth/account', ['current_password' => 'wrong'])->assertUnprocessable();
        $this->assertDatabaseHas('users', ['id' => $owner->id]);
        $this->deleteJson('/api/auth/account', ['current_password' => 'OldPass123!'])->assertOk();
        $this->assertGuest('web');
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/auth/user')->assertUnauthorized();
        $this->assertDatabaseMissing('users', ['id' => $owner->id]);
        $this->assertDatabaseMissing('jobseeker_profiles', ['id' => $profile->id]);
        $this->assertDatabaseCount('jobseeker_languages', 0);
        $this->assertDatabaseHas('users', ['id' => $other->id]);
    }
}
