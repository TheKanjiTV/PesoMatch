<?php

namespace Tests\Feature;

use App\Models\Enrollment;
use App\Models\TableSetting;
use App\Models\TrainingProgram;
use App\Models\User;
use App\Models\Vacancy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ArchiveAndApiVersionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeader('Origin', 'http://127.0.0.1:8443');
    }

    private function program(): TrainingProgram
    {
        return TrainingProgram::create(['title' => 'Synthetic archived training', 'provider' => 'Fixture', 'location' => 'Mansalay', 'mode' => 'Online', 'description' => 'Test only', 'requirements' => 'Consent', 'skills' => [], 'capacity' => 1, 'starts_on' => today()->addWeek(), 'ends_on' => today()->addMonth(), 'schedule' => 'Weekdays', 'fee' => 0, 'status' => 'published']);
    }

    public function test_every_legacy_api_route_has_an_identical_v1_handler_and_middleware(): void
    {
        $routes = collect(Route::getRoutes()->getRoutes());
        $legacy = $routes->filter(fn ($route) => str_starts_with($route->uri(), 'api/') && ! str_starts_with($route->uri(), 'api/v1/'));
        $this->assertGreaterThan(60, $legacy->count());
        foreach ($legacy as $route) {
            $canonical = $routes->first(fn ($candidate) => $candidate->uri() === preg_replace('#^api/#', 'api/v1/', $route->uri()) && $candidate->methods() === $route->methods());
            $this->assertNotNull($canonical, $route->uri());
            $this->assertSame($route->getActionName(), $canonical->getActionName());
            $this->assertSame($route->gatherMiddleware(), $canonical->gatherMiddleware());
        }
        $this->getJson('/api/v1/public/health')->assertOk()->assertHeader('X-API-Version', '1')->assertJsonPath('application', 'pesomatch');
        $this->getJson('/api/public/health')->assertOk();
        $this->getJson('/api/v2/public/health')->assertNotFound();
        $this->getJson('/api/v1/auth/history')->assertUnauthorized();
    }

    public function test_v1_registration_login_and_legacy_session_interoperate(): void
    {
        $this->postJson('/api/v1/auth/register', ['first_name' => 'Synthetic', 'last_name' => 'API Test', 'email' => 'version@example.test', 'password' => 'SecurePassword123!', 'password_confirmation' => 'SecurePassword123!', 'terms_accepted' => true])->assertCreated();
        $this->postJson('/api/v1/auth/login', ['email' => 'version@example.test', 'password' => 'SecurePassword123!'])->assertOk();
        $this->getJson('/api/auth/user')->assertOk()->assertJsonPath('user.email', 'version@example.test');
        $this->getJson('/api/v1/auth/history')->assertOk()->assertJsonPath('data.0.action', 'auth.login')->assertJsonPath('data.1.action', 'auth.registered');
        $this->postJson('/api/auth/logout')->assertOk();
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/auth/user')->assertUnauthorized();
    }

    public function test_archive_and_restore_require_admin_on_both_route_versions(): void
    {
        foreach (['/api/platform', '/api/v1/platform'] as $prefix) {
            $this->getJson($prefix.'/archive')->assertUnauthorized();
            foreach (['jobseeker', 'peso_staff', 'employer', 'training_provider'] as $role) {
                $this->actingAs(User::factory()->create(['role' => $role]));
                $this->getJson($prefix.'/archive')->assertForbidden();
                $this->postJson($prefix.'/archive/vacancy/1/restore')->assertForbidden();
            }
            $this->app['auth']->forgetGuards();
            $this->flushSession();
        }
    }

    public function test_unified_archive_search_pagination_and_safe_restoration(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $target = User::factory()->create(['archived_at' => now()]);
        $program = $this->program();
        $enrollment = Enrollment::create(['user_id' => $target->id, 'training_program_id' => $program->id, 'status' => 'withdrawn']);
        $enrollment->delete();
        $program->delete();
        $vacancy = Vacancy::create(['title' => 'Synthetic 100% archived vacancy', 'organization' => 'Fixture', 'location' => 'Mansalay', 'industry' => 'Services', 'employment_type' => 'Full-time', 'description' => 'Test', 'skills' => [], 'slots' => 1, 'deadline' => today()->addWeek(), 'status' => 'published']);
        $vacancy->delete();
        TableSetting::create(['id' => 1, 'rows_per_page' => 2]);
        $this->actingAs($admin);
        $this->getJson('/api/v1/platform/archive')->assertOk()->assertJsonPath('total', 4)->assertJsonCount(2, 'data');
        $this->getJson('/api/v1/platform/archive?page=2')->assertOk()->assertJsonCount(2, 'data');
        $this->getJson('/api/v1/platform/archive?kind=vacancy&search=100%25')->assertOk()->assertJsonPath('total', 1);
        $this->getJson('/api/v1/platform/archive?kind=invalid')->assertUnprocessable();
        $this->postJson('/api/v1/platform/archive/enrollment/'.$enrollment->id.'/restore')->assertUnprocessable();
        $this->postJson('/api/v1/platform/archive/account/'.$target->id.'/restore', ['current_password' => 'wrong'])->assertUnprocessable();
        $this->postJson('/api/v1/platform/archive/account/'.$target->id.'/restore', ['current_password' => 'password'])->assertOk();
        $this->postJson('/api/v1/platform/archive/training/'.$program->id.'/restore')->assertOk();
        $this->assertSame('draft', $program->fresh()->status);
        $this->postJson('/api/v1/platform/archive/enrollment/'.$enrollment->id.'/restore')->assertOk();
        $this->assertSame('withdrawn', $enrollment->fresh()->status);
        $this->postJson('/api/v1/platform/archive/vacancy/'.$vacancy->id.'/restore')->assertOk();
        $this->assertSame('draft', $vacancy->fresh()->status);
        $this->postJson('/api/v1/platform/archive/vacancy/'.$vacancy->id.'/restore')->assertNotFound();
        $this->getJson('/api/v1/platform/archive')->assertJsonPath('total', 0);
        foreach (['account', 'training', 'enrollment', 'vacancy'] as $type) {
            $this->assertDatabaseHas('audit_events', ['action' => $type.'.restored', 'actor_id' => $admin->id]);
        }
    }

    public function test_account_archive_preserves_profile_revokes_access_and_restores_without_old_sessions(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $target = User::factory()->create(['remember_token' => 'old-remember-token']);
        $profile = $target->jobseekerProfile()->create();
        DB::table('sessions')->insert(['id' => 'target-browser-session', 'user_id' => $target->id, 'payload' => '', 'last_activity' => now()->timestamp]);
        $this->actingAs($admin, 'web');
        $token = $this->postJson('/api/v1/platform/delete-intents', ['type' => 'account', 'id' => $target->id])->assertOk()->json('token');
        $this->travel(6)->seconds();
        $this->deleteJson('/api/v1/platform/remove/account/'.$target->id, ['confirmation_token' => $token, 'current_password' => 'password'])->assertOk();
        $this->assertNull(User::find($target->id));
        $this->assertDatabaseHas('jobseeker_profiles', ['id' => $profile->id]);
        $this->assertDatabaseMissing('sessions', ['id' => 'target-browser-session']);
        $this->assertDatabaseHas('users', ['id' => $target->id, 'remember_token' => null]);
        $this->postJson('/api/v1/auth/login', ['email' => $target->email, 'password' => 'password'])->assertUnprocessable();
        $this->postJson('/api/v1/platform/archive/account/'.$target->id.'/restore', ['current_password' => 'password'])->assertOk();
        $this->postJson('/api/v1/auth/login', ['email' => $target->email, 'password' => 'password'])->assertOk()->assertJsonPath('user.id', $target->id);
        $this->assertDatabaseMissing('sessions', ['id' => 'target-browser-session']);
        $this->assertDatabaseHas('audit_events', ['action' => 'auth.account_archived', 'actor_id' => $target->id]);
        $this->assertDatabaseHas('audit_events', ['action' => 'auth.account_restored', 'actor_id' => $target->id]);
    }

    public function test_walk_in_enrollment_restores_without_an_account_but_completed_records_do_not(): void
    {
        $program = $this->program();
        $walkIn = Enrollment::create(['user_id' => null, 'walk_in_name' => 'Synthetic Walk-in', 'training_program_id' => $program->id, 'status' => 'withdrawn']);
        $walkIn->delete();
        $this->actingAs(User::factory()->create(['role' => 'admin']))->postJson('/api/v1/platform/archive/enrollment/'.$walkIn->id.'/restore')->assertOk();
        $walkIn->update(['status' => 'completed']);
        $walkIn->delete();
        $this->postJson('/api/v1/platform/archive/enrollment/'.$walkIn->id.'/restore')->assertUnprocessable();
    }
}
