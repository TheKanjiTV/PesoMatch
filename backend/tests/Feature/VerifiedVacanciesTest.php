<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Vacancy;
use App\Services\VacancySources;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VerifiedVacanciesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // The checked-in source snapshot is dated evidence, not a moving feed.
        $rows = json_decode(file_get_contents(database_path('data/verified-vacancies.json')), true);
        $checked = collect($rows)->max(fn ($row) => CarbonImmutable::parse($row['checked_at'])->timestamp);
        $this->travelTo(CarbonImmutable::createFromTimestamp($checked, config('app.timezone')));
    }

    public function test_source_import_is_idempotent_and_does_not_invent_partner_or_salary_metadata(): void
    {
        $this->artisan('peso:import-verified-vacancies')->assertSuccessful();
        $this->artisan('peso:import-verified-vacancies')->assertSuccessful();
        $this->assertDatabaseCount('vacancies', count(json_decode(file_get_contents(database_path('data/verified-vacancies.json')), true)));
        $sourceRows = collect(json_decode(file_get_contents(database_path('data/verified-vacancies.json')), true))->keyBy('source_url');
        foreach (Vacancy::all() as $v) {
            $this->assertSame(CarbonImmutable::parse($sourceRows[$v->source_url]['checked_at'])->timestamp, $v->source_checked_at->timestamp);
            $this->assertTrue(VacancySources::allows($v->source_url));
            $this->assertFalse($v->is_sample);
            $this->assertTrue($v->external_application);
            $this->assertNull($v->owner_id);
            $this->assertSame($sourceRows[$v->source_url]['slots'] ?? null, $v->slots);
            $this->assertSame($sourceRows[$v->source_url]['deadline'] ?? null, $v->deadline);
            $this->assertNull($v->salary_min);
            $this->assertNull($v->salary_max);
        }
        $u = User::factory()->create(['role' => 'jobseeker']);
        $u->jobseekerProfile()->create()->forceFill(['profile_completed_at' => now()])->save();
        $v = Vacancy::firstOrFail();
        $this->actingAs($u)->postJson("/api/platform/vacancies/{$v->id}/save")->assertOk();
        $this->assertDatabaseHas('saved_vacancies', ['user_id' => $u->id, 'vacancy_id' => $v->id]);
        $this->postJson("/api/platform/vacancies/{$v->id}/referrals")->assertUnprocessable();
        $this->assertDatabaseCount('referrals', 0);
        $this->getJson('/api/platform/labor-market')->assertOk()->assertJsonPath('active_vacancies', 0)->assertJsonPath('source_listed_vacancies', Vacancy::count());
    }

    public function test_stale_closed_and_unpublished_sources_are_excluded_from_browse_and_matches(): void
    {
        $this->artisan('peso:import-verified-vacancies')->assertSuccessful();
        $rows = Vacancy::all();
        $rows[0]->update(['source_checked_at' => now()->subDays(31)]);
        $rows[1]->update(['deadline' => today()->subDay()]);
        $rows[2]->update(['status' => 'draft']);
        $u = User::factory()->create(['role' => 'jobseeker']);
        $u->jobseekerProfile()->create()->forceFill(['profile_completed_at' => now()])->save();
        $response = $this->actingAs($u)->getJson('/api/platform/vacancies')->assertOk();
        $response->assertJsonPath('total', Vacancy::count() - 3);
        $browse = $response->json('data');
        $this->assertCount(min(100, Vacancy::count() - 3), $browse);
        $excluded = $rows->take(3)->modelKeys();
        $this->assertSame([], array_values(array_intersect($excluded, array_column($browse, 'id'))));
        $matches = $this->getJson('/api/platform/matches')->assertOk()->json('matches');
        $this->assertNotEmpty($matches);
        $this->assertSame([], array_values(array_intersect($excluded, array_column(array_column($matches, 'vacancy'), 'id'))));
    }

    public function test_source_open_filter_requires_both_current_evidence_and_a_future_deadline(): void
    {
        $this->artisan('peso:import-verified-vacancies')->assertSuccessful();
        $open = Vacancy::where('source_url', 'like', VacancySources::NEGROS_PREFIX.'%')->get();
        $expected = Vacancy::all()->filter(fn ($v) => $v->availability_status === 'source_lists_open')->count();
        $open[0]->update(['source_checked_at' => now()->subDays(8)]);
        $open[1]->update(['deadline' => today()->subDay()]);
        $user = User::factory()->create(['role' => 'jobseeker']);
        $this->actingAs($user)->getJson('/api/platform/vacancies?availability=source_lists_open')
            ->assertOk()->assertJsonPath('total', $expected - 2);
        $this->assertSame('confirm_availability', $open[0]->fresh()->availability_status);
        $this->assertSame('deadline_passed', $open[1]->fresh()->availability_status);
        $this->getJson('/api/platform/vacancies?availability=guaranteed')->assertUnprocessable();
    }
}
