<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RequestBudgetIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeader('Origin', 'http://127.0.0.1:8443');
        Cache::flush();
        Http::preventStrayRequests();
    }

    private function seeker(): User
    {
        $user = User::factory()->create();
        $user->jobseekerProfile()->create()->forceFill(['profile_completed_at' => now()])->save();
        $this->actingAs($user, 'web')->withSession(['password_hash_web' => $user->getAuthPassword()]);

        return $user;
    }

    public function test_browsing_ai_status_does_not_consume_generation_or_unrelated_write_budgets(): void
    {
        $this->seeker();
        for ($i = 0; $i < 25; $i++) {
            $this->getJson('/api/v1/platform/ai/status')->assertOk();
        }
        // Invalid consent avoids any model call while exercising the actual middleware.
        $this->postJson('/api/v1/platform/ai/adviser', [])->assertUnprocessable();
        $this->postJson('/api/v1/platform/training-demands', ['topic' => 'Computer literacy'])->assertCreated();
        $this->patchJson('/api/v1/auth/password', [])->assertUnprocessable();
        Http::assertNothingSent();
    }

    public function test_generation_limits_are_shared_by_api_aliases_but_isolated_from_matching_and_training(): void
    {
        $this->seeker();
        for ($i = 0; $i < 15; $i++) {
            $prefix = $i % 2 ? '/api' : '/api/v1';
            $this->postJson($prefix.'/platform/ai/adviser', [])->assertUnprocessable();
        }
        $this->postJson('/api/v1/platform/ai/resume-review', [])->assertStatus(429)->assertHeader('Retry-After');
        $this->getJson('/api/v1/platform/ai/status')->assertOk();
        $this->postJson('/api/v1/platform/ai/vacancy-matches', [])->assertUnprocessable();
        $this->postJson('/api/v1/platform/training-demands', ['topic' => 'Bookkeeping'])->assertCreated();
        $this->actingAs(User::factory()->create())->postJson('/api/v1/platform/ai/adviser', [])->assertUnprocessable();
        Http::assertNothingSent();
    }

    public function test_training_writes_do_not_exhaust_password_change_limit(): void
    {
        $this->seeker();
        for ($i = 0; $i < 8; $i++) {
            $this->postJson('/api/v1/platform/training-demands', ['topic' => 'Same unique topic'])->assertCreated();
        }
        $this->patchJson('/api/v1/auth/password', [])->assertUnprocessable();
        $this->assertDatabaseCount('training_demands', 1);
    }
}
