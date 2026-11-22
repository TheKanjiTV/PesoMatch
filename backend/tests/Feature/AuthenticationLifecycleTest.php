<?php

namespace Tests\Feature;

use App\Models\LoginPolicy;
use App\Models\User;
use App\Services\AuthenticationSessions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AuthenticationLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeader('Origin', 'http://127.0.0.1:8443');
    }

    public function test_lockout_trigger_and_blocked_attempt_are_distinct_and_unknown_identity_stays_private(): void
    {
        LoginPolicy::create(['id' => 1, 'stages' => array_fill(0, 3, ['attempts' => 1, 'lockout_minutes' => 5])]);
        $user = User::factory()->create();
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'wrong-secret'])->assertStatus(429);
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'password'])->assertStatus(429);
        $this->assertSame(['auth.login_failed', 'auth.lockout', 'auth.login_blocked'], DB::table('audit_events')->orderBy('id')->pluck('action')->all());
        $this->postJson('/api/v1/auth/login', ['email' => 'unknown-target@example.test', 'password' => 'wrong-secret'])->assertStatus(429);
        $unknown = DB::table('audit_events')->whereNull('actor_id')->get();
        $this->assertCount(2, $unknown);
        foreach ($unknown as $event) {
            $details = json_decode($event->changes, true);
            $this->assertSame(64, strlen($details['identity_fingerprint']));
            $this->assertStringNotContainsString('unknown-target@example.test', $event->changes);
            $this->assertStringNotContainsString('wrong-secret', $event->changes);
        }
        $this->actingAs($user)->getJson('/api/v1/auth/history')->assertJsonPath('total', 3);
    }

    public function test_ip_throttle_rejection_is_recorded_without_credentials(): void
    {
        for ($i = 0; $i < 31; $i++) {
            $this->postJson('/api/v1/auth/login', ['email' => 'rate@example.test', 'password' => 'wrong-secret']);
        }
        $this->assertDatabaseHas('audit_events', ['action' => 'auth.login_throttled', 'actor_id' => null]);
        $changes = DB::table('audit_events')->where('action', 'auth.login_throttled')->value('changes');
        $this->assertStringNotContainsString('rate@example.test', $changes);
        $this->assertStringNotContainsString('wrong-secret', $changes);
    }

    public function test_password_change_rotates_tracking_revokes_other_sessions_and_keeps_current_session(): void
    {
        $user = User::factory()->create();
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'password'])->assertOk();
        $current = DB::table('authentication_sessions')->sole();
        $this->assertNotSame($this->app['session']->getId(), $current->session_hash);
        $this->assertSame(64, strlen($current->session_hash));
        DB::table('sessions')->insert(['id' => 'other-raw-session-secret', 'user_id' => $user->id, 'payload' => '', 'last_activity' => now()->timestamp]);
        DB::table('authentication_sessions')->insert(['user_id' => $user->id, 'session_hash' => app(AuthenticationSessions::class)->hash('other-raw-session-secret'), 'started_at' => now(), 'last_seen_at' => now(), 'expires_at' => now()->addHour()]);
        $this->patchJson('/api/v1/auth/password', ['current_password' => 'password', 'password' => 'ChangedPassword123!', 'password_confirmation' => 'ChangedPassword123!'])->assertOk();
        $this->assertDatabaseHas('audit_events', ['action' => 'auth.password_changed', 'actor_id' => $user->id]);
        $this->assertDatabaseHas('audit_events', ['action' => 'auth.sessions_revoked', 'actor_id' => $user->id]);
        $this->assertDatabaseMissing('sessions', ['id' => 'other-raw-session-secret']);
        $this->assertSame(1, DB::table('authentication_sessions')->whereNull('ended_at')->count());
        $this->assertNotSame($current->session_hash, DB::table('authentication_sessions')->whereNull('ended_at')->value('session_hash'));
        $this->getJson('/api/v1/auth/user')->assertOk();
        foreach (DB::table('audit_events')->pluck('changes') as $changes) {
            $this->assertStringNotContainsString('ChangedPassword123!', $changes);
            $this->assertStringNotContainsString('other-raw-session-secret', $changes);
        }
    }

    public function test_inactivity_expiry_is_recorded_once_at_expiry_time_without_fake_logout(): void
    {
        config(['session.lifetime' => 2]);
        $this->travelTo(now()->startOfSecond());
        $user = User::factory()->create();
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'password'])->assertOk();
        $expiresAt = now()->addMinutes(2)->toDateTimeString();
        $this->travel(3)->minutes();
        $this->artisan('peso:expire-auth-sessions')->assertSuccessful();
        $this->artisan('peso:expire-auth-sessions')->assertSuccessful();
        $this->assertSame(1, DB::table('audit_events')->where('action', 'auth.session_expired')->count());
        $this->assertSame($expiresAt, DB::table('audit_events')->where('action', 'auth.session_expired')->value('created_at'));
        $this->assertDatabaseMissing('audit_events', ['action' => 'auth.logout']);
        $this->assertDatabaseHas('authentication_sessions', ['user_id' => $user->id, 'end_reason' => 'inactivity']);
    }

    public function test_logout_closes_tracking_and_cannot_later_be_reported_as_expired(): void
    {
        $user = User::factory()->create();
        $login = $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'password'])->assertOk();
        $cookie = $login->getCookie(config('session.cookie'));
        $this->withCredentials()->withCookie($cookie->getName(), $cookie->getValue());
        $this->postJson('/api/v1/auth/logout')->assertOk();
        $this->assertDatabaseHas('authentication_sessions', ['user_id' => $user->id, 'end_reason' => 'logout']);
        $this->travel(2)->days();
        $this->assertSame(0, app(AuthenticationSessions::class)->expire());
        $this->assertDatabaseMissing('audit_events', ['action' => 'auth.session_expired']);
    }

    public function test_admin_can_filter_authentication_and_business_logs_while_history_is_account_scoped(): void
    {
        $user = User::factory()->create();
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'password'])->assertOk();
        DB::table('audit_events')->insert(['actor_id' => $user->id, 'action' => 'vacancy.archived', 'entity' => 'vacancies', 'entity_id' => 1, 'changes' => '{}', 'created_at' => now()]);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->getJson('/api/v1/platform/audit?category=authentication')->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.action', 'auth.login');
        $this->getJson('/api/v1/platform/audit?category=business')->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.action', 'vacancy.archived');
        $this->getJson('/api/v1/platform/audit?category=invalid')->assertUnprocessable();
        $this->getJson('/api/v1/auth/history')->assertJsonPath('total', 0);
    }
}
