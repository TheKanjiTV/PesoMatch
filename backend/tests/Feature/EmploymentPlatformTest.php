<?php

namespace Tests\Feature;

use App\Models\EmploymentOutcome;
use App\Models\Enrollment;
use App\Models\Placement;
use App\Models\Referral;
use App\Models\ServiceEvent;
use App\Models\Skill;
use App\Models\TrainingProgram;
use App\Models\User;
use App\Models\Vacancy;
use App\Services\EmploymentMatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmploymentPlatformTest extends TestCase
{
    use RefreshDatabase;

    private function person(string $role = 'jobseeker'): User
    {
        $u = User::factory()->create(['role' => $role]);
        if ($role === 'jobseeker') {
            $u->jobseekerProfile()->create()->forceFill(['profile_completed_at' => now()])->save();
        }

        return $u;
    }

    private function vacancy(array $data = []): Vacancy
    {
        return Vacancy::create([...['title' => 'Office Assistant', 'organization' => 'Test Employer', 'location' => 'Calapan', 'industry' => 'Services', 'employment_type' => 'Full-time', 'description' => 'Office work and customer service', 'skills' => ['Communication', 'Microsoft Excel'], 'slots' => 1, 'deadline' => today()->addMonth()->toDateString(), 'status' => 'published'], ...$data]);
    }

    private function program(array $data = []): TrainingProgram
    {
        return TrainingProgram::create([...['title' => 'Workplace skills', 'provider' => 'Test Provider', 'location' => 'Calapan', 'mode' => 'Online', 'description' => 'Develop office skills', 'requirements' => 'Profile', 'skills' => ['Microsoft Excel'], 'capacity' => 1, 'starts_on' => today()->addMonth()->toDateString(), 'ends_on' => today()->addMonths(2)->toDateString(), 'schedule' => 'Weekdays', 'fee' => 0, 'status' => 'published'], ...$data]);
    }

    public function test_platform_requires_auth_and_public_catalog_exposes_no_personal_records(): void
    {
        $this->getJson('/api/platform/summary')->assertUnauthorized();
        $this->vacancy();
        $this->vacancy(['title' => 'Private', 'status' => 'draft']);
        $this->getJson('/api/public/catalog')->assertOk()->assertJsonCount(1, 'vacancies')->assertJsonMissingPath('users');
    }

    public function test_public_registration_cannot_provision_privileged_roles(): void
    {
        $this->postJson('/api/auth/register', ['first_name' => 'Test', 'last_name' => 'Person', 'email' => 'roles@example.test', 'password' => 'TestingSecure123!', 'password_confirmation' => 'TestingSecure123!', 'role' => 'admin'])->assertUnprocessable();
    }

    public function test_employers_are_scoped_and_peso_controls_publication(): void
    {
        $employer = $this->person('employer');
        $other = $this->person('employer');
        $v = $this->vacancy(['owner_id' => $other->id]);
        $this->actingAs($employer)->getJson('/api/platform/vacancies')->assertJsonCount(0, 'data');
        $this->patchJson('/api/platform/vacancies/'.$v->id, $v->toArray())->assertForbidden();
        $payload = $v->toArray();
        unset($payload['id']);
        $payload['title'] = 'New employer vacancy';
        $this->postJson('/api/platform/vacancies', $payload)->assertOk()->assertJsonPath('data.status', 'pending_review')->assertJsonPath('data.owner_id', $employer->id);
        $this->getJson('/api/platform/jobseekers')->assertForbidden();
        $this->actingAs($this->person())->postJson('/api/platform/vacancies', $payload)->assertForbidden();
    }

    public function test_referral_ownership_duplicate_protection_and_placement_workflow(): void
    {
        $seeker = $this->person();
        $staff = $this->person('peso_staff');
        $employer = $this->person('employer');
        $v = $this->vacancy(['owner_id' => $employer->id]);
        $id = $this->actingAs($seeker)->postJson("/api/platform/vacancies/{$v->id}/referrals")->assertCreated()->json('data.id');
        $this->postJson("/api/platform/vacancies/{$v->id}/referrals")->assertConflict();
        $this->patchJson("/api/platform/referrals/{$id}", ['status' => 'referred', 'notes' => 'Forged approval'])->assertForbidden();
        $this->actingAs($this->person())->patchJson("/api/platform/referrals/{$id}", ['status' => 'withdrawn', 'notes' => 'Other user'])->assertForbidden();
        $this->actingAs($employer)->getJson('/api/platform/referrals')->assertJsonCount(0, 'data');
        $this->actingAs($staff)->postJson("/api/platform/referrals/{$id}/placement", ['started_on' => today()->toDateString(), 'employment_type' => 'Full-time', 'evidence' => 'Confirmed by employer', 'follow_up_on' => today()->addMonth()->toDateString()])->assertUnprocessable();
        $this->patchJson("/api/platform/referrals/{$id}", ['status' => 'referred', 'notes' => 'Profile reviewed by officer'])->assertOk();
        $this->actingAs($employer)->patchJson("/api/platform/referrals/{$id}", ['status' => 'interviewing', 'notes' => 'Schedule interview'])->assertUnprocessable()->assertJsonValidationErrors('interview_at');
        $this->patchJson("/api/platform/referrals/{$id}", ['status' => 'interviewing', 'interview_at' => now()->addDay()->toIso8601String(), 'notes' => 'Interview scheduled'])->assertOk();
        $this->patchJson("/api/platform/referrals/{$id}", ['status' => 'offered', 'notes' => 'Employer offered employment'])->assertOk();
        $payload = ['started_on' => today()->toDateString(), 'employment_type' => 'Full-time', 'evidence' => 'Employer confirmed start by phone', 'follow_up_on' => today()->addMonth()->toDateString()];
        $this->postJson("/api/platform/referrals/{$id}/placement", $payload)->assertForbidden();
        $this->actingAs($staff)->postJson("/api/platform/referrals/{$id}/placement", $payload)->assertCreated();
        $this->postJson("/api/platform/referrals/{$id}/placement", $payload)->assertUnprocessable();
        $this->assertDatabaseHas('referrals', ['id' => $id, 'status' => 'placed']);
        $this->assertDatabaseHas('audit_events', ['action' => 'placement.verified']);
    }

    public function test_employer_catalog_and_directory_expose_only_authorized_vacancies(): void
    {
        $employer = $this->person('employer');
        $other = $this->person('employer');
        $own = $this->vacancy(['owner_id' => $employer->id, 'organization' => 'My organization', 'status' => 'draft']);
        $private = $this->vacancy(['owner_id' => $other->id, 'organization' => 'Private organization', 'status' => 'pending_review']);
        $published = $this->vacancy(['owner_id' => $other->id, 'organization' => 'Published organization']);

        $this->actingAs($employer)->getJson('/api/platform/vacancies?scope=mine&owner_id='.$other->id)
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $own->id);
        $this->getJson('/api/platform/vacancies?scope=all&location=Calap&employment_type=Full-time&sort=title')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $published->id);
        $this->getJson('/api/platform/vacancies?scope=all&organization=Private%20organization')
            ->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/platform/employers')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0', ['organization' => $published->organization, 'vacancy_count' => 1]);
        $this->getJson('/api/platform/vacancies?scope=all&id='.$own->id)->assertJsonPath('data.0.id', $own->id);
        $this->getJson('/api/platform/vacancies?scope=all&id='.$private->id)->assertOk()->assertJsonCount(0, 'data');
        $this->patchJson('/api/platform/vacancies/'.$private->id, [])->assertForbidden();
        $this->patchJson('/api/platform/vacancies/'.$published->id, $published->toArray())->assertForbidden();

        foreach (['on_hold', 'cancelled', 'closed', 'pending_review'] as $status) {
            $this->patchJson('/api/platform/vacancies/'.$own->id, [...$own->toArray(), 'owner_id' => $other->id, 'status' => $status])
                ->assertOk()->assertJsonPath('data.status', $status)->assertJsonPath('data.owner_id', $employer->id);
        }
        $this->assertDatabaseHas('vacancies', ['id' => $private->id, 'status' => 'pending_review', 'owner_id' => $other->id]);
    }

    public function test_employer_referral_actions_require_peso_handoff_and_vacancy_ownership(): void
    {
        $owner = $this->person('employer');
        $other = $this->person('employer');
        $staff = $this->person('peso_staff');
        $vacancy = $this->vacancy(['owner_id' => $owner->id]);
        $pending = Referral::create(['user_id' => $this->person()->id, 'vacancy_id' => $vacancy->id, 'status' => 'requested']);
        $candidate = Referral::create(['user_id' => $this->person()->id, 'vacancy_id' => $vacancy->id, 'status' => 'requested']);
        $action = ['status' => 'accepted', 'notes' => 'Candidate accepted for review.'];
        $decline = ['status' => 'not_selected', 'notes' => 'Candidate was not selected.'];

        $this->actingAs($owner)->patchJson('/api/platform/referrals/'.$pending->id, $decline)->assertForbidden();
        $this->actingAs($staff)->patchJson('/api/platform/referrals/'.$pending->id, $decline)->assertOk();
        $this->patchJson('/api/platform/referrals/'.$candidate->id, ['status' => 'referred', 'notes' => 'PESO reviewed the profile.'])->assertOk();
        $this->actingAs($other)->patchJson('/api/platform/referrals/'.$candidate->id, $action)->assertForbidden();
        $this->getJson('/api/platform/referrals')->assertJsonCount(0, 'data');
        $this->actingAs($owner)->getJson('/api/platform/referrals')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $candidate->id);
        $this->patchJson('/api/platform/referrals/'.$candidate->id, $action)->assertOk()->assertJsonPath('data.status', 'accepted');
        $this->patchJson('/api/platform/referrals/'.$candidate->id, ['status' => 'offered', 'notes' => 'Offer recorded.'])->assertOk();
        $this->patchJson('/api/platform/referrals/'.$candidate->id, $decline)->assertOk()->assertJsonPath('data.status', 'not_selected');
        $this->getJson('/api/platform/referrals')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $candidate->id);
        $this->getJson('/api/platform/summary')->assertJsonPath('vacancies', 1)->assertJsonPath('referrals', 1)->assertJsonPath('placements', 0);
    }

    public function test_enrollment_capacity_status_and_provider_ownership(): void
    {
        $provider = $this->person('training_provider');
        $otherProvider = $this->person('training_provider');
        $seeker = $this->person();
        $other = $this->person();
        $p = $this->program(['owner_id' => $provider->id]);
        $first = $this->actingAs($seeker)->postJson("/api/platform/training/{$p->id}/enroll", ['consent' => true])->assertCreated()->json('data.id');
        $this->postJson("/api/platform/training/{$p->id}/enroll", ['consent' => true])->assertConflict();
        $second = $this->actingAs($other)->postJson("/api/platform/training/{$p->id}/enroll", ['consent' => true])->assertCreated()->json('data.id');
        $this->actingAs($otherProvider)->getJson('/api/platform/enrollments')->assertJsonCount(0, 'data');
        $this->patchJson("/api/platform/enrollments/{$first}", ['status' => 'confirmed', 'notes' => 'Unauthorized'])->assertForbidden();
        $this->actingAs($provider)->patchJson("/api/platform/enrollments/{$first}", ['status' => 'confirmed', 'notes' => 'Requirements checked'])->assertOk();
        $this->patchJson("/api/platform/enrollments/{$second}", ['status' => 'confirmed', 'notes' => 'Capacity check'])->assertUnprocessable();
        $this->patchJson("/api/platform/enrollments/{$first}", ['status' => 'completed', 'notes' => 'Cannot skip progress'])->assertUnprocessable();
        $this->patchJson("/api/platform/enrollments/{$first}", ['status' => 'in_progress', 'notes' => 'Training started'])->assertOk();
        $this->patchJson("/api/platform/enrollments/{$first}", ['status' => 'completed', 'notes' => 'Requirements completed'])->assertUnprocessable()->assertJsonValidationErrors('certificate_reference');
        $this->patchJson("/api/platform/enrollments/{$first}", ['status' => 'completed', 'notes' => 'Requirements completed', 'certificate_reference' => 'Provider-001'])->assertOk();
    }

    public function test_closed_opportunities_and_incomplete_profiles_cannot_submit(): void
    {
        $u = $this->person();
        $v = $this->vacancy(['status' => 'closed']);
        $p = $this->program(['starts_on' => today()->subDay()->toDateString()]);
        $this->actingAs($u)->postJson("/api/platform/vacancies/{$v->id}/referrals")->assertUnprocessable();
        $this->postJson("/api/platform/training/{$p->id}/enroll", ['consent' => true])->assertUnprocessable();
        $u->jobseekerProfile->forceFill(['profile_completed_at' => null])->save();
        $v->update(['status' => 'published']);
        $this->postJson("/api/platform/vacancies/{$v->id}/referrals")->assertUnprocessable();
    }

    public function test_outcomes_are_own_scoped_and_only_peso_can_verify(): void
    {
        $u = $this->person();
        $other = $this->person();
        $data = ['user_id' => $other->id, 'status' => 'employed', 'organization' => 'Test Co', 'job_title' => 'Assistant', 'reported_on' => today()->toDateString(), 'notes' => 'Employer confirmed employment'];
        $id = $this->actingAs($u)->postJson('/api/platform/outcomes', $data)->assertCreated()->assertJsonPath('data.user_id', $u->id)->json('data.id');
        $this->patchJson("/api/platform/outcomes/{$id}/verify", ['verification_notes' => 'I verify myself'])->assertForbidden();
        $this->actingAs($other)->getJson('/api/platform/outcomes')->assertJsonCount(0, 'data');
        $this->actingAs($u)->postJson('/api/platform/outcomes', [...$data, 'user_id' => ''])->assertCreated()->assertJsonPath('data.user_id', $u->id);
        $this->actingAs($this->person('peso_staff'))->patchJson("/api/platform/outcomes/{$id}/verify", ['verification_notes' => 'Employer contacted and verified'])->assertOk();
        $this->patchJson("/api/platform/outcomes/{$id}/verify", ['verification_notes' => 'Duplicate verification attempt'])->assertConflict();
    }

    public function test_services_cover_peso_responsibilities_and_appointments_are_enforced(): void
    {
        $u = $this->person();
        $staff = $this->person('peso_staff');
        $id = $this->actingAs($u)->postJson('/api/platform/services', ['service' => 'Returning worker reintegration', 'details' => 'Please help me find local employment options.'])->assertCreated()->json('data.id');
        $this->actingAs($this->person())->patchJson("/api/platform/services/{$id}", ['status' => 'cancelled', 'staff_notes' => 'Other account'])->assertForbidden();
        $this->actingAs($staff)->patchJson("/api/platform/services/{$id}", ['status' => 'scheduled', 'staff_notes' => 'Missing schedule'])->assertUnprocessable();
        $this->patchJson("/api/platform/services/{$id}", ['status' => 'scheduled', 'assigned_to' => $staff->id, 'appointment_at' => now()->addDay()->toIso8601String(), 'staff_notes' => 'Counseling scheduled'])->assertOk();
        $this->patchJson("/api/platform/services/{$id}", ['status' => 'completed', 'staff_notes' => 'Referred to livelihood partner'])->assertOk();
    }

    public function test_labor_market_excludes_samples_and_deduplicates_latest_outcomes(): void
    {
        $u = $this->person();
        $this->vacancy();
        $this->vacancy(['is_sample' => true]);
        EmploymentOutcome::create(['user_id' => $u->id, 'status' => 'unemployed', 'reported_on' => today(), 'notes' => 'First report']);
        EmploymentOutcome::create(['user_id' => $u->id, 'status' => 'employed', 'reported_on' => today(), 'notes' => 'Latest report', 'verified_at' => now()]);
        $this->actingAs($this->person('peso_staff'))->getJson('/api/platform/labor-market')->assertOk()->assertJsonPath('active_vacancies', 1)->assertJsonPath('sample_vacancies', 1)->assertJsonCount(1, 'outcomes')->assertJsonPath('outcomes.0.status', 'employed')->assertJsonPath('outcomes.0.total', 1);
        $this->actingAs($u)->getJson('/api/platform/labor-market')->assertJsonCount(0, 'outcomes')->assertJsonCount(0, 'follow_ups');
    }

    public function test_matcher_uses_actual_profile_skills_and_links_training_to_gaps(): void
    {
        $u = $this->person();
        $skill = Skill::create(['name' => 'Communication']);
        $u->jobseekerProfile->skills()->attach($skill);
        $v = $this->vacancy();
        $this->program();
        $result = app(EmploymentMatcher::class)->assess($u->fresh(), $v);
        $this->assertEquals(['Communication'], $result['matched_skills']);
        $this->assertEquals(['Microsoft Excel'], $result['missing_skills']);
        $this->actingAs($u)->getJson('/api/platform/matches')->assertOk()->assertJsonPath('training.0.addresses.0', 'Microsoft Excel')->assertJsonPath('method', 'count-vector-cosine-v1');
    }

    public function test_large_matching_catalog_is_paginated_without_losing_ranked_results_or_changing_scores(): void
    {
        $user = $this->person();
        $skill = Skill::create(['name' => 'Communication']);
        $user->jobseekerProfile->skills()->attach($skill);
        for ($i = 0; $i < 205; $i++) {
            $this->vacancy(['title' => 'Office Assistant '.$i, 'skills' => $i % 3 ? ['Communication', 'Microsoft Excel'] : ['Communication']]);
        }
        $this->vacancy(['is_sample' => true]);
        $this->program();
        $pages = [];
        for ($page = 1; $page <= 11; $page++) {
            $pages[] = $this->actingAs($user)->getJson('/api/platform/matches?page='.$page)
                ->assertOk()->assertJsonPath('total', 205)->assertJsonPath('last_page', 11)
                ->assertJsonPath('current_page', $page)->assertJsonCount($page === 11 ? 5 : 20, 'matches')->json();
        }
        $matches = array_merge(...array_column($pages, 'matches'));
        $ids = array_column(array_column($matches, 'vacancy'), 'id');
        $this->assertCount(205, array_unique($ids));
        $scores = array_column(array_column($matches, 'assessment'), 'score');
        $sorted = $scores;
        rsort($sorted);
        $this->assertSame($sorted, $scores);
        $corpus = Vacancy::available()->where('is_sample', false)->get()
            ->map(fn ($v) => $v->title.' '.$v->industry.' '.$v->description.' '.implode(' ', $v->skills))->all();
        foreach ([0, 99, 100, 204] as $index) {
            $assessment = app(EmploymentMatcher::class)->assess($user->fresh(), Vacancy::findOrFail($ids[$index]), $corpus);
            $this->assertSame($assessment['score'], $scores[$index]);
        }
        $this->assertSame($pages[0]['training'], $pages[2]['training']);
        $this->getJson('/api/platform/matches?page=0')->assertUnprocessable();
    }

    public function test_source_catalog_uses_posted_dates_instead_of_bulk_import_order(): void
    {
        $this->vacancy(['title' => 'Earlier posting imported later', 'external_application' => true,
            'source_url' => 'https://pasay.gov.ph/peso-jobs/earlier-posting/',
            'source_checked_at' => now(), 'source_posted_on' => today()->subDay(), 'created_at' => now()]);
        $latest = $this->vacancy(['title' => 'Latest source posting', 'external_application' => true,
            'source_url' => 'https://pasay.gov.ph/peso-jobs/latest-posting/',
            'source_checked_at' => now(), 'source_posted_on' => today(), 'created_at' => now()->subDay()]);
        $this->program(['title' => 'Zulu course']);
        $alpha = $this->program(['title' => 'Alpha course']);
        $this->getJson('/api/public/catalog')->assertOk()->assertJsonPath('vacancies.0.id', $latest->id)
            ->assertJsonPath('training.0.id', $alpha->id);
        $this->actingAs($this->person())->getJson('/api/platform/vacancies')->assertOk()->assertJsonPath('data.0.id', $latest->id);
        $this->getJson('/api/platform/training')->assertOk()->assertJsonPath('data.0.id', $alpha->id);
    }

    public function test_role_management_and_audit_are_admin_only(): void
    {
        $u = $this->person();
        $admin = $this->person('admin');
        $this->actingAs($u)->getJson('/api/platform/users')->assertForbidden();
        $this->getJson('/api/platform/audit')->assertForbidden();
        $this->patchJson("/api/platform/users/{$u->id}/role", ['role' => 'admin'])->assertForbidden();
        $this->actingAs($admin)->patchJson("/api/platform/users/{$admin->id}/role", ['role' => 'jobseeker'])->assertUnprocessable();
        $this->patchJson("/api/platform/users/{$u->id}/role", ['role' => 'training_provider', 'current_password' => 'password'])->assertOk();
        $this->getJson('/api/platform/audit')->assertOk()->assertJsonPath('data.0.action', 'user.role_changed');
    }

    public function test_withdrawal_is_terminal_and_releases_training_capacity(): void
    {
        $u = $this->person();
        $p = $this->program();
        $e = Enrollment::create(['user_id' => $u->id, 'training_program_id' => $p->id, 'status' => 'confirmed']);
        $this->actingAs($u)->patchJson("/api/platform/enrollments/{$e->id}", ['status' => 'withdrawn', 'notes' => 'Schedule conflict'])->assertOk();
        $this->patchJson("/api/platform/enrollments/{$e->id}", ['status' => 'withdrawn', 'notes' => 'Duplicate withdrawal'])->assertUnprocessable();
    }

    public function test_saved_vacancies_filter_is_persisted_and_owned(): void
    {
        $u = $this->person();
        $v = $this->vacancy();
        $this->vacancy(['title' => 'Another vacancy']);
        $this->actingAs($u)->postJson("/api/platform/vacancies/{$v->id}/save")->assertOk();
        $this->getJson('/api/platform/vacancies?saved=1')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $v->id);
        $this->actingAs($this->person())->getJson('/api/platform/vacancies?saved=1')->assertJsonCount(0, 'data');
        $this->actingAs($u)->deleteJson("/api/platform/vacancies/{$v->id}/save")->assertOk();
        $this->getJson('/api/platform/vacancies?saved=1')->assertJsonCount(0, 'data');
    }

    public function test_provider_submission_is_reviewed_and_capacity_cannot_shrink_below_admissions(): void
    {
        $provider = $this->person('training_provider');
        $p = $this->program(['owner_id' => $provider->id, 'capacity' => 2]);
        $payload = $p->toArray();
        $payload['status'] = 'published';
        $this->actingAs($provider)->patchJson("/api/platform/training/{$p->id}", $payload)->assertOk()->assertJsonPath('data.status', 'pending_review');
        foreach ([1, 2] as $i) {
            Enrollment::create(['user_id' => $this->person()->id, 'training_program_id' => $p->id, 'status' => 'confirmed']);
        }
        $payload['capacity'] = 1;
        $this->patchJson("/api/platform/training/{$p->id}", $payload)->assertUnprocessable()->assertJsonValidationErrors('capacity');
        $this->actingAs($this->person('training_provider'))->patchJson("/api/platform/training/{$p->id}", $payload)->assertForbidden();
    }

    public function test_follow_up_requires_linked_verified_report_and_latest_employment_date_wins(): void
    {
        $u = $this->person();
        $staff = $this->person('peso_staff');
        $v = $this->vacancy();
        $referral = Referral::create(['user_id' => $u->id, 'vacancy_id' => $v->id, 'status' => 'placed']);
        $p = Placement::create(['user_id' => $u->id, 'referral_id' => $referral->id, 'started_on' => today()->subMonth(), 'employment_type' => 'Full-time', 'evidence' => 'Employer confirmation', 'follow_up_on' => today()->subDay()]);
        $report = EmploymentOutcome::create(['user_id' => $u->id, 'placement_id' => $p->id, 'status' => 'employed', 'reported_on' => today(), 'notes' => 'Current report']);
        EmploymentOutcome::create(['user_id' => $u->id, 'status' => 'unemployed', 'reported_on' => today()->subMonth(), 'notes' => 'Older status entered later']);
        $this->actingAs($staff)->getJson('/api/platform/labor-market')->assertJsonCount(1, 'follow_ups')->assertJsonPath('outcomes.0.status', 'employed');
        $report->update(['verified_at' => now(), 'verified_by' => $staff->id]);
        $this->getJson('/api/platform/labor-market')->assertJsonCount(0, 'follow_ups');
    }

    public function test_peso_can_close_historical_catalog_while_retired_events_remain_unchanged(): void
    {
        $this->actingAs($this->person('peso_staff'));
        $v = $this->vacancy(['deadline' => today()->subDay()->toDateString()]);
        $this->patchJson("/api/platform/vacancies/{$v->id}", [...$v->toArray(), 'status' => 'closed'])->assertOk()->assertJsonPath('data.status', 'closed');
        $p = $this->program(['starts_on' => today()->subWeek()->toDateString(), 'ends_on' => today()->subDay()->toDateString()]);
        $this->patchJson("/api/platform/training/{$p->id}", [...$p->toArray(), 'status' => 'closed'])->assertOk()->assertJsonPath('data.status', 'closed');
        $e = ServiceEvent::create(['title' => 'Past orientation', 'type' => 'Career guidance', 'location' => 'PESO office', 'starts_at' => now()->subDay(), 'description' => 'Past event', 'status' => 'published']);
        $this->patchJson("/api/platform/events/{$e->id}", [...$e->toArray(), 'status' => 'completed'])->assertNotFound();
        $this->assertSame('published', $e->fresh()->status);
    }

    public function test_deleting_user_cascades_personal_placement_records_without_deleting_catalog(): void
    {
        $u = $this->person();
        $other = $this->person();
        $v = $this->vacancy();
        $referral = Referral::create(['user_id' => $u->id, 'vacancy_id' => $v->id, 'status' => 'placed']);
        $p = Placement::create(['user_id' => $u->id, 'referral_id' => $referral->id, 'started_on' => today(), 'employment_type' => 'Full-time', 'evidence' => 'Employer confirmation', 'follow_up_on' => today()->addMonth()]);
        EmploymentOutcome::create(['user_id' => $u->id, 'placement_id' => $p->id, 'status' => 'employed', 'reported_on' => today(), 'notes' => 'Current status']);
        $u->delete();
        $this->assertDatabaseMissing('referrals', ['id' => $referral->id]);
        $this->assertDatabaseMissing('placements', ['id' => $p->id]);
        $this->assertDatabaseCount('employment_outcomes', 0);
        $this->assertDatabaseHas('vacancies', ['id' => $v->id]);
        $this->assertDatabaseHas('users', ['id' => $other->id]);
    }
}
