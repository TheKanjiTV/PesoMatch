<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Vacancy;
use App\Services\VacancySources;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PesoVacancySourcesTest extends TestCase
{
    use RefreshDatabase;

    private function source(string $url): Vacancy
    {
        return Vacancy::create(['title' => 'Source test vacancy', 'organization' => 'Source test employer',
            'location' => 'Not stated', 'industry' => 'Not stated', 'employment_type' => 'Not stated',
            'description' => 'A test-only source record.', 'skills' => [], 'slots' => null,
            'deadline' => null, 'status' => 'published', 'source_url' => $url,
            'source_checked_at' => now(), 'external_application' => true, 'is_sample' => false]);
    }

    public function test_retired_provider_is_hidden_for_all_catalog_roles_but_history_is_preserved(): void
    {
        $retired = $this->source('https://philjobnet.gov.ph/job-vacancies/job/test-123');
        $www = $this->source('https://www.philjobnet.gov.ph/job-vacancies/job/test-456');
        $current = $this->source('https://pasay.gov.ph/peso-jobs/utility-helper/');
        $seeker = User::factory()->create(['role' => 'jobseeker']);
        $seeker->jobseekerProfile()->create()->forceFill(['profile_completed_at' => now()])->save();
        DB::table('saved_vacancies')->insert(['user_id' => $seeker->id, 'vacancy_id' => $retired->id, 'created_at' => now(), 'updated_at' => now()]);

        $this->getJson('/api/public/catalog')->assertOk()->assertJsonCount(1, 'vacancies')->assertJsonPath('vacancies.0.id', $current->id);
        foreach ([$seeker, User::factory()->create(['role' => 'peso_staff']), User::factory()->create(['role' => 'admin'])] as $user) {
            $this->actingAs($user)->getJson('/api/platform/vacancies')->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.id', $current->id);
            $this->getJson('/api/platform/vacancies?id='.$retired->id)->assertOk()->assertJsonCount(0, 'data');
        }
        $this->actingAs($seeker)->getJson('/api/platform/matches')->assertOk()->assertJsonPath('total', 1)->assertJsonPath('matches.0.vacancy.id', $current->id);
        $this->getJson('/api/platform/vacancies?saved=1')->assertOk()->assertJsonPath('total', 0);
        $this->getJson('/api/platform/summary')->assertOk()->assertJsonCount(0, 'saved');
        $this->postJson('/api/platform/vacancies/'.$retired->id.'/save')->assertNotFound();
        $this->assertDatabaseCount('vacancies', 3);
        $this->assertSame('published', $retired->fresh()->status);
        $this->assertSame('published', $www->fresh()->status);
        $this->assertDatabaseHas('saved_vacancies', ['user_id' => $seeker->id, 'vacancy_id' => $retired->id]);
        $this->deleteJson('/api/platform/vacancies/'.$retired->id.'/save')->assertOk();
    }

    public function test_import_destinations_are_official_detail_pages_without_credentials_or_redirect_parameters(): void
    {
        $this->assertTrue(VacancySources::allows('https://pasay.gov.ph/peso-jobs/utility-helper/'));
        foreach (['https://philjobnet.gov.ph/job-vacancies/job/old', 'http://pasay.gov.ph/peso-jobs/test/',
            'https://pasay.gov.ph.evil.example/peso-jobs/test/', 'https://pasay.gov.ph@evil.example/peso-jobs/test/',
            'https://user:password@pasay.gov.ph/peso-jobs/test/', 'https://pasay.gov.ph:443/peso-jobs/test/',
            'https://pasay.gov.ph/job-openings/', 'https://pasay.gov.ph/peso-jobs/test/?redirect=evil',
            'https://pasay.gov.ph/peso-jobs/test/#fake'] as $url) {
            $this->assertFalse(VacancySources::allows($url), $url);
        }
    }
}
