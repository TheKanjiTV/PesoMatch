<?php

namespace Tests\Feature;

use App\Models\TableSetting;
use App\Models\User;
use Illuminate\Auth\Events\Login;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class AuthenticationHistoryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeaders(['Origin' => 'http://localhost:8443', 'Referer' => 'http://localhost:8443/']);
    }

    public function test_real_login_failed_login_and_logout_share_the_audit_records_without_secrets(): void
    {
        $this->travelTo(now()->setDate(2026, 11, 23)->setTime(14, 15, 16));
        $user = User::factory()->create();
        $this->withHeaders(['User-Agent' => 'Synthetic browser', 'X-Private-Token' => 'never-store-this']);
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'incorrect-secret'])->assertUnprocessable();
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password', 'remember' => true])->assertOk();
        $this->getJson('/api/auth/user')->assertOk();
        $this->postJson('/api/auth/logout')->assertOk();
        $this->assertGuest('web');
        $this->assertDatabaseCount('audit_events', 3);
        $events = DB::table('audit_events')->orderBy('id')->get();
        $this->assertSame(['auth.login_failed', 'auth.login', 'auth.logout'], $events->pluck('action')->all());
        foreach ($events as $event) {
            $this->assertEquals($user->id, $event->actor_id);
            $this->assertEquals($user->id, $event->entity_id);
            $this->assertSame('users', $event->entity);
            $details = json_decode($event->changes, true);
            $this->assertSame('Synthetic browser', $details['user_agent']);
            $this->assertSame('127.0.0.1', $details['ip_address']);
            foreach (['password', 'incorrect-secret', 'never-store-this', $user->email, 'token', 'cookie'] as $secret) {
                $this->assertStringNotContainsString($secret, $event->changes);
            }
        }
        $this->actingAs($user)->getJson('/api/auth/history')->assertOk()
            ->assertJsonPath('total', 3)->assertJsonPath('data.0.action', 'auth.logout')
            ->assertJsonPath('data.0.created_at', '2026-11-23T14:15:16+08:00');
    }

    public function test_unknown_credentials_are_audited_without_creating_or_exposing_an_account(): void
    {
        $this->getJson('/api/auth/history')->assertUnauthorized();
        $this->postJson('/api/auth/logout')->assertUnauthorized();
        $this->postJson('/api/auth/login', ['email' => 'unknown@example.test', 'password' => 'password'])->assertUnprocessable();
        $this->assertDatabaseCount('audit_events', 1);
        $event = DB::table('audit_events')->first();
        $this->assertNull($event->actor_id);
        $this->assertSame('authentication', $event->entity);
        $this->assertSame('auth.login_failed', $event->action);
        $this->assertStringNotContainsString('unknown@example.test', $event->changes);
        $this->assertStringNotContainsString('password', $event->changes);
    }

    public function test_every_role_can_only_read_its_own_history_with_global_pagination(): void
    {
        TableSetting::create(['id' => 1, 'rows_per_page' => 2]);
        $other = User::factory()->create();
        Event::dispatch(new Login('web', $other, false));
        foreach (['jobseeker', 'peso_staff', 'admin', 'employer', 'training_provider'] as $role) {
            $user = User::factory()->create(['role' => $role]);
            for ($i = 0; $i < 5; $i++) {
                Event::dispatch(new Login('web', $user, false));
            }
            DB::table('audit_events')->insert(['actor_id' => $user->id, 'action' => 'user.role_changed', 'entity' => 'users', 'entity_id' => $other->id, 'changes' => '{}', 'created_at' => now()]);
            $this->actingAs($user);
            $ids = [];
            for ($page = 1; $page <= 3; $page++) {
                $response = $this->getJson('/api/auth/history?user_id='.$other->id.'&per_page=1000&page='.$page)->assertOk()
                    ->assertJsonPath('total', 5)->assertJsonPath('per_page', 2)->assertJsonPath('last_page', 3);
                foreach ($response->json('data') as $row) {
                    $this->assertSame('auth.login', $row['action']);
                    $this->assertEquals($user->id, DB::table('audit_events')->find($row['id'])->actor_id);
                    $ids[] = $row['id'];
                }
            }
            $this->assertCount(5, array_unique($ids));
            $sorted = $ids;
            rsort($sorted);
            $this->assertSame($sorted, $ids);
            $this->getJson('/api/auth/history?page=-1')->assertUnprocessable();
            if ($role === 'admin') {
                $this->getJson('/api/platform/audit')->assertOk()->assertJsonPath('data.1.action', 'auth.login');
            } else {
                $this->getJson('/api/platform/audit')->assertForbidden();
            }
        }
    }

    public function test_remember_cookie_login_is_recorded_once_and_other_guards_are_ignored(): void
    {
        $user = User::factory()->create();
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password', 'remember' => true])->assertOk();
        $cookie = collect($this->app['cookie']->getQueuedCookies())->first(fn ($cookie) => str_starts_with($cookie->getName(), 'remember_web_'));
        $this->assertNotNull($cookie);
        $this->flushSession();
        $this->app['auth']->forgetGuards();
        $this->withCredentials()->withCookie($cookie->getName(), $cookie->getValue())->getJson('/api/auth/user')->assertOk();
        $this->getJson('/api/auth/user')->assertOk();
        $this->assertDatabaseCount('audit_events', 2);
        Event::dispatch(new Login('other', $user, false));
        $this->assertDatabaseCount('audit_events', 2);
    }

    public function test_successful_account_switch_records_previous_logout_but_failed_switch_does_not(): void
    {
        $previous = User::factory()->create();
        $next = User::factory()->create();
        $this->actingAs($previous, 'web');
        $this->postJson('/api/auth/login', ['email' => $next->email, 'password' => 'wrong'])->assertUnprocessable();
        $this->assertDatabaseMissing('audit_events', ['actor_id' => $previous->id, 'action' => 'auth.logout']);
        $this->postJson('/api/auth/login', ['email' => $next->email, 'password' => 'password'])->assertOk();
        $this->assertDatabaseHas('audit_events', ['actor_id' => $previous->id, 'action' => 'auth.logout']);
        $this->assertDatabaseHas('audit_events', ['actor_id' => $next->id, 'action' => 'auth.login']);
        $this->actingAs($previous)->getJson('/api/auth/history')->assertOk()->assertJsonPath('data.0.reason', 'account_switched');
    }

    public function test_stale_tab_cannot_read_history_or_log_out_the_new_identity(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->withHeader('X-Peso-User', (string) ($user->id + 1));
        $this->getJson('/api/auth/history')->assertStatus(409);
        $this->postJson('/api/auth/logout')->assertStatus(409);
        $this->assertDatabaseCount('audit_events', 0);
    }

    public function test_deleting_account_preserves_logout_evidence_without_the_actor_link(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'web')->deleteJson('/api/auth/account', ['current_password' => 'password'])->assertOk();
        $this->assertDatabaseHas('audit_events', ['actor_id' => null, 'entity_id' => $user->id, 'action' => 'auth.logout']);
    }
}
