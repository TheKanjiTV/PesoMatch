<?php

namespace Tests\Feature;

use App\Models\TrainingProgram;
use App\Models\User;
use App\Models\Vacancy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SearchValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_search_rejects_invalid_shapes_controls_lengths_and_filters(): void
    {
        $this->actingAs(User::factory()->create());
        foreach (['vacancies', 'training', 'jobseekers'] as $catalog) {
            foreach ([['search' => ['bad']], ['search' => str_repeat('a', 201)], ['search' => "bad\x07query"], ['search' => "bad\nquery"], ['status' => 'invented']] as $query) {
                $this->getJson('/api/platform/'.$catalog.'?'.http_build_query($query))->assertUnprocessable();
            }
        }
        $this->getJson('/api/platform/vacancies?'.http_build_query(['search' => str_repeat('ñ', 200), 'status' => 'all']))->assertOk();
        $this->json('HEAD', '/api/platform/vacancies?search%5B%5D=bad')->assertUnprocessable();
    }

    public function test_wildcards_are_literal_and_ordinary_unicode_and_apostrophes_remain_searchable(): void
    {
        $this->actingAs(User::factory()->create());
        $base = ['organization' => 'Test employer', 'location' => 'Manila', 'industry' => 'Services', 'employment_type' => 'Full-time', 'description' => 'Test listing', 'skills' => ['Communication'], 'slots' => 1, 'deadline' => today()->addMonth(), 'status' => 'published'];
        Vacancy::create([...$base, 'title' => "O'Brien Peña 100% job_one!"]);
        Vacancy::create([...$base, 'title' => 'Unrelated job']);
        foreach (["O'Brien", 'Peña', '100%', 'job_one', '!', '  Test   employer  '] as $search) {
            $this->getJson('/api/platform/vacancies?'.http_build_query(['search' => $search]))->assertOk()->assertJsonCount($search === '  Test   employer  ' ? 2 : 1, 'data');
        }
        foreach (['%', '_'] as $search) {
            $this->getJson('/api/platform/vacancies?'.http_build_query(['search' => $search]))->assertOk()->assertJsonCount(1, 'data');
        }
        $this->getJson('/api/platform/vacancies?'.http_build_query(['search' => "' OR 1=1--"]))->assertOk()->assertJsonCount(0, 'data');
        TrainingProgram::create(['title' => '100%_course!', 'provider' => 'Test provider', 'location' => 'Online', 'mode' => 'Online', 'description' => 'Test', 'requirements' => 'None', 'skills' => ['Communication'], 'capacity' => 1, 'starts_on' => today()->addMonth(), 'ends_on' => today()->addMonths(2), 'schedule' => 'Test', 'fee' => 0, 'status' => 'published']);
        $this->getJson('/api/platform/training?search=%25')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_registry_search_runs_before_pagination_and_keeps_staff_authorization(): void
    {
        $target = User::factory()->create(['name' => 'Search Target Peña', 'created_at' => now()->subDay()]);
        $target->jobseekerProfile()->create(['municipality' => 'Quezon City']);
        User::factory()->count(101)->create();
        $seeker = User::factory()->create();
        $this->actingAs($seeker)->getJson('/api/platform/jobseekers?search=Target')->assertForbidden();
        $staff = User::factory()->create(['role' => 'peso_staff']);
        $firstPage = $this->actingAs($staff)->getJson('/api/platform/jobseekers')->assertOk();
        $this->assertNotContains($target->id, array_column($firstPage->json('data'), 'id'));
        $this->actingAs($staff)->getJson('/api/platform/jobseekers?search=Quezon')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $target->id);
        $this->getJson('/api/platform/jobseekers?search=Search%20Target')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/platform/jobseekers?'.http_build_query(['search' => $target->email]))->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_search_never_exposes_other_partner_records_or_unpublished_vacancies(): void
    {
        $owner = User::factory()->create(['role' => 'employer']);
        $other = User::factory()->create(['role' => 'employer']);
        $base = ['title' => 'Private searchable job', 'organization' => 'Test', 'location' => 'Manila', 'industry' => 'Services', 'employment_type' => 'Full-time', 'description' => 'Test listing', 'skills' => ['Communication'], 'slots' => 1, 'deadline' => today()->addMonth(), 'status' => 'draft'];
        Vacancy::create([...$base, 'owner_id' => $owner->id]);
        $this->actingAs($other)->getJson('/api/platform/vacancies?search=searchable')->assertOk()->assertJsonCount(0, 'data');
        $this->actingAs(User::factory()->create())->getJson('/api/platform/vacancies?search=searchable')->assertOk()->assertJsonCount(0, 'data');
        $this->actingAs($owner)->getJson('/api/platform/vacancies?search=searchable')->assertOk()->assertJsonCount(1, 'data');
    }
}
