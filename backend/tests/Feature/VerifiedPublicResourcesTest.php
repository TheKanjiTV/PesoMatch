<?php

namespace Tests\Feature;

use App\Models\PublicResource;
use App\Models\ServiceEvent;
use App\Models\TrainingProgram;
use App\Models\User;
use App\Models\Vacancy;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VerifiedPublicResourcesTest extends TestCase
{
    use RefreshDatabase;

    public function test_import_is_idempotent_preserves_unknown_times_and_exposes_survey_provenance(): void
    {
        $this->artisan('peso:import-verified-public-resources')->assertSuccessful();
        $this->artisan('peso:import-verified-public-resources')->assertSuccessful();
        $this->assertDatabaseCount('service_events', count(json_decode(file_get_contents(database_path('data/verified-events.json')), true)));
        $this->assertDatabaseCount('public_resources', 1);
        $sourceEvents = collect(json_decode(file_get_contents(database_path('data/verified-events.json')), true))->keyBy('source_key');
        foreach (ServiceEvent::all() as $event) {
            $this->assertSame(CarbonImmutable::parse($sourceEvents[$event->source_key]['checked_at'])->timestamp, $event->source_checked_at->timestamp);
            $this->assertNull($event->starts_at);
            $this->assertNotNull($event->event_date);
            $this->assertFalse($event->is_sample);
            $this->assertContains($event->source_url, [
                'https://ro11.dole.gov.ph/job-fair-schedules/',
                'https://docs.google.com/spreadsheets/d/1PlMXkd0LkWnWD640JrIprx7DGjleu5U4-9wD_UNIQys/edit',
            ]);
        }
        $officer = User::factory()->create(['role' => 'peso_staff']);
        $response = $this->actingAs($officer)->getJson('/api/platform/labor-market')->assertOk();
        $response->assertJsonPath('official_reports.0.reference_period', 'August 2026');
        $response->assertJsonPath('official_reports.0.indicators.1.value', 94.731);
        $this->assertStringContainsString('Preliminary', PublicResource::first()->notes);
        $sourceReport = json_decode(file_get_contents(database_path('data/verified-public-resources.json')), true)[0];
        $this->assertSame(CarbonImmutable::parse($sourceReport['checked_at'])->timestamp, PublicResource::first()->source_checked_at->timestamp);
        $event = ServiceEvent::first();
        $this->patchJson('/api/platform/events/'.$event->id, ['title' => 'Unsupported change'])->assertNotFound();
        $this->assertNotSame('Unsupported change', $event->fresh()->title);
    }

    public function test_default_catalogs_and_matching_exclude_evaluation_samples_without_deleting_them(): void
    {
        $this->artisan('db:seed', ['--class' => 'EmploymentSampleSeeder'])->assertSuccessful();
        $this->artisan('peso:import-verified-vacancies')->assertSuccessful();
        $this->artisan('peso:import-verified-training', ['--catalog' => 'online'])->assertSuccessful();
        $public = $this->getJson('/api/public/catalog')->assertOk()->json();
        $this->assertArrayNotHasKey('events', $public);
        foreach (array_merge($public['vacancies'], $public['training']) as $record) {
            $this->assertFalse($record['is_sample']);
        }
        $user = User::factory()->create(['role' => 'jobseeker']);
        $user->jobseekerProfile()->create()->forceFill(['profile_completed_at' => now()])->save();
        foreach (['vacancies', 'training'] as $resource) {
            foreach ($this->actingAs($user)->getJson('/api/platform/'.$resource)->assertOk()->json('data') as $record) {
                $this->assertFalse($record['is_sample']);
            }
            $page = $this->getJson('/api/platform/'.$resource.'?include_samples=1')->assertOk()->json();
            $optIn = $page['data'];
            for ($number = 2; $number <= $page['last_page']; $number++) {
                $optIn = array_merge($optIn, $this->getJson('/api/platform/'.$resource.'?include_samples=1&page='.$number)->assertOk()->json('data'));
            }
            $this->assertNotEmpty(array_filter($optIn, fn ($row) => $row['is_sample']));
        }
        foreach ($this->getJson('/api/platform/matches')->assertOk()->json('matches') as $match) {
            $this->assertFalse($match['vacancy']['is_sample']);
        }
        $this->assertSame(4, Vacancy::where('is_sample', true)->count());
        $this->assertSame(3, TrainingProgram::where('is_sample', true)->count());
    }
}
