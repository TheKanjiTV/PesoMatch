<?php

namespace Tests\Feature;

use App\Models\Enrollment;
use App\Models\Referral;
use App\Models\TrainingProgram;
use App\Models\User;
use App\Models\Vacancy;
use App\Services\ReviewedTrainingImporter;
use App\Services\TrainingSources;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class FacilitationWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeader('Origin', 'http://127.0.0.1:8443');
    }

    private function asUser(User $user): static
    {
        $this->app['auth']->forgetGuards();
        parent::actingAs($user, 'web');
        $this->withSession(['password_hash_web' => $user->getAuthPassword()]);

        return $this;
    }

    private function person(string $role = 'jobseeker'): User
    {
        $u = User::factory()->create(['role' => $role, 'password' => 'SecureTest123!']);
        if ($role === 'jobseeker') {
            $u->jobseekerProfile()->create()->forceFill(['profile_completed_at' => now()])->save();
        }

        return $u;
    }

    private function program(): TrainingProgram
    {
        app(ReviewedTrainingImporter::class)->import([['title' => 'Isolated registry program', 'provider' => 'Fixture institution', 'location' => 'Mindoro', 'mode' => 'Confirm delivery mode', 'description' => 'Isolated evidence', 'requirements' => 'Confirm intake', 'schedule' => 'Not announced', 'skills' => [], 'fee' => null, 'source_name' => TrainingSources::REGISTERED, 'source_url' => 'https://www.tesda.gov.ph/Tvi/Result?SearchCourse=A&SearchIns=B&SearchLoc=C', 'checked_at' => now()->toIso8601String()]]);

        return TrainingProgram::firstOrFail();
    }

    private function vacancy(): Vacancy
    {
        return Vacancy::create(['title' => 'Isolated source vacancy', 'organization' => 'Fixture organization', 'location' => 'Mindoro', 'industry' => 'Services', 'employment_type' => 'Full-time', 'description' => 'Public source', 'skills' => [], 'slots' => null, 'deadline' => null, 'status' => 'published', 'external_application' => true, 'source_url' => 'https://pasay.gov.ph/peso-jobs/fixture/', 'source_checked_at' => now()]);
    }

    public function test_employer_delete_confirmation_is_bound_to_own_vacancy_id(): void
    {
        $owner = $this->person('employer');
        $other = $this->person('employer');
        $own = $this->vacancy();
        $own->update(['owner_id' => $owner->id, 'external_application' => false, 'source_url' => null]);
        $foreign = $this->vacancy();
        $foreign->update(['owner_id' => $other->id, 'external_application' => false, 'source_url' => null]);

        $this->asUser($owner)->postJson('/api/platform/delete-intents', ['type' => 'vacancy', 'id' => $foreign->id])->assertForbidden();
        $token = $this->postJson('/api/platform/delete-intents', ['type' => 'vacancy', 'id' => $own->id])->assertOk()->json('token');
        $this->deleteJson('/api/platform/remove/vacancy/'.$own->id, ['confirmation_token' => $token])->assertUnprocessable();
        $this->travel(6)->seconds();
        $this->deleteJson('/api/platform/remove/vacancy/'.$foreign->id, ['confirmation_token' => $token])->assertUnprocessable();
        $this->deleteJson('/api/platform/remove/vacancy/'.$own->id, ['confirmation_token' => $token])->assertOk();
        $this->assertSoftDeleted('vacancies', ['id' => $own->id]);
        $this->assertNotSoftDeleted('vacancies', ['id' => $foreign->id]);
    }

    public function test_stale_tab_cannot_act_as_another_account_or_write_preferences(): void
    {
        $seeker = $this->person();
        $admin = $this->person('admin');
        $this->asUser($admin)->withHeader('X-Peso-User', (string) $seeker->id)
            ->patchJson('/api/auth/preferences', ['dashboard_tour_completed' => true])->assertConflict()->assertJsonPath('code', 'SESSION_CHANGED');
        $this->getJson('/api/platform/users')->assertConflict();
        $this->assertNull($admin->fresh()->dashboard_tour_completed_at);
        $this->assertSame('jobseeker', $seeker->fresh()->role);
    }

    public function test_source_referral_is_requested_locally_and_requires_peso_employer_verification(): void
    {
        $seeker = $this->person();
        $staff = $this->person('peso_staff');
        $v = $this->vacancy();
        $this->asUser($seeker)->postJson('/api/platform/vacancies/'.$v->id.'/referrals')->assertCreated()->assertJsonPath('data.status', 'requested');
        $this->postJson('/api/platform/vacancies/'.$v->id.'/referrals')->assertConflict();
        $r = Referral::firstOrFail();
        $this->asUser($staff)->patchJson('/api/platform/referrals/'.$r->id, ['status' => 'referred', 'notes' => 'Review completed'])->assertUnprocessable();
        $this->patchJson('/api/platform/referrals/'.$r->id, ['status' => 'referred', 'notes' => 'Review completed', 'source_confirmation' => 'Employer contacted today and confirmed current opening and application instructions.'])->assertOk();
        $this->patchJson('/api/platform/referrals/'.$r->id, ['status' => 'offered', 'notes' => 'Employer offer documented for this applicant.'])->assertOk();
        $this->postJson('/api/platform/referrals/'.$r->id.'/placement', ['started_on' => today()->toDateString(), 'employment_type' => 'Full-time', 'evidence' => 'Employer confirmed the actual employment start.', 'follow_up_on' => today()->addMonth()->toDateString()])->assertCreated();
        $this->assertDatabaseCount('placements', 1);
    }

    public function test_source_training_request_needs_a_verified_intake_before_confirmation_and_capacity_is_enforced(): void
    {
        $p = $this->program();
        $u = $this->person();
        $staff = $this->person('peso_staff');
        // Historical source requests remain reviewable; new catalog interest is separate.
        Enrollment::create(['user_id' => $u->id, 'training_program_id' => $p->id, 'status' => 'requested']);
        $e = Enrollment::firstOrFail();
        $this->asUser($staff)->patchJson('/api/platform/enrollments/'.$e->id, ['status' => 'confirmed', 'notes' => 'No intake checked yet'])->assertUnprocessable();
        $data = ['provider' => 'Confirmed provider', 'location' => 'Bansud', 'mode' => 'In person', 'capacity' => 1, 'starts_on' => today()->addWeek()->toDateString(), 'ends_on' => today()->addMonth()->toDateString(), 'schedule' => 'Monday to Friday', 'fee' => 150, 'intake_verification' => 'Provider contacted and confirmed the exact dates, fees and one available place.'];
        $id = $this->postJson('/api/platform/training/'.$p->id.'/intakes', $data)->assertCreated()->json('data.id');
        $this->patchJson('/api/platform/enrollments/'.$e->id, ['status' => 'confirmed', 'notes' => 'Provider admission confirmed', 'intake_program_id' => $id])->assertOk()->assertJsonPath('data.training_program_id', $id);
        $this->assertNull($p->fresh()->fee);
        $this->assertNull($p->fresh()->capacity);
        $second = $this->person();
        Enrollment::create(['user_id' => $second->id, 'training_program_id' => $p->id, 'status' => 'requested']);
        $other = Enrollment::where('user_id', $second->id)->firstOrFail();
        $this->asUser($staff)->patchJson('/api/platform/enrollments/'.$other->id, ['status' => 'confirmed', 'notes' => 'Attempt over capacity', 'intake_program_id' => $id])->assertUnprocessable();
        $this->assertSame($p->id, $other->fresh()->training_program_id);
    }

    public function test_delete_has_a_server_countdown_preserves_history_and_does_not_restore_on_import(): void
    {
        $p = $this->program();
        $staff = $this->person('peso_staff');
        $token = $this->asUser($staff)->postJson('/api/platform/delete-intents', ['type' => 'training', 'id' => $p->id])->assertOk()->json('token');
        $this->deleteJson('/api/platform/remove/training/'.$p->id, ['confirmation_token' => $token])->assertUnprocessable();
        $this->travel(6)->seconds();
        $this->deleteJson('/api/platform/remove/training/'.$p->id, ['confirmation_token' => $token])->assertOk();
        $this->assertSoftDeleted('training_programs', ['id' => $p->id]);
        $this->assertSame(0, TrainingProgram::count());
        $row = $p->toArray();
        $row['checked_at'] = now()->toIso8601String();
        $row['fee'] = null;
        app(ReviewedTrainingImporter::class)->import([$row]);
        $this->assertSame(0, TrainingProgram::count());
        $this->assertSame(1, TrainingProgram::withTrashed()->count());
    }

    public function test_delete_permissions_tokens_and_account_password_are_checked(): void
    {
        $v = $this->vacancy();
        $u = $this->person();
        $admin = $this->person('admin');
        $this->asUser($u)->postJson('/api/platform/delete-intents', ['type' => 'vacancy', 'id' => $v->id])->assertForbidden();
        $token = $this->asUser($admin)->postJson('/api/platform/delete-intents', ['type' => 'account', 'id' => $u->id])->assertOk()->json('token');
        $this->travel(6)->seconds();
        $this->deleteJson('/api/platform/remove/vacancy/'.$v->id, ['confirmation_token' => $token])->assertUnprocessable();
        $this->deleteJson('/api/platform/remove/account/'.$u->id, ['confirmation_token' => $token, 'current_password' => 'wrong'])->assertUnprocessable();
        $this->deleteJson('/api/platform/remove/account/'.$u->id, ['confirmation_token' => $token, 'current_password' => 'SecureTest123!'])->assertOk();
        $this->assertNotNull(DB::table('users')->where('id', $u->id)->value('archived_at'));
        $this->assertNull(User::find($u->id));
        $this->postJson('/api/platform/delete-intents', ['type' => 'account', 'id' => $admin->id])->assertForbidden();
    }

    public function test_enrollment_removal_withdraws_active_request_without_changing_completed_training(): void
    {
        $p = $this->program();
        $p->update(['external_enrollment' => false, 'source_name' => null, 'capacity' => 5, 'starts_on' => today()->addMonth()->toDateString()]);
        $u = $this->person();
        $this->asUser($u)->postJson('/api/platform/training/'.$p->id.'/enroll', ['consent' => true])->assertCreated();
        $e = Enrollment::firstOrFail();
        $token = $this->postJson('/api/platform/delete-intents', ['type' => 'enrollment', 'id' => $e->id])->assertOk()->json('token');
        $this->travel(6)->seconds();
        $this->deleteJson('/api/platform/remove/enrollment/'.$e->id, ['confirmation_token' => $token])->assertOk();
        $this->assertSame('withdrawn', $e->fresh()->status);
        $this->assertSoftDeleted('enrollments', ['id' => $e->id]);
        $this->assertSame(0, Enrollment::count());
        $other = $this->person();
        $this->asUser($other)->postJson('/api/platform/training/'.$p->id.'/enroll', ['consent' => true])->assertCreated();
        $completed = Enrollment::firstOrFail();
        $intent = $this->postJson('/api/platform/delete-intents', ['type' => 'enrollment', 'id' => $completed->id])->assertOk()->json('token');
        // Simulate completion by another authorized request during the wait.
        $completed->update(['status' => 'completed', 'certificate_reference' => 'Isolated completion fixture']);
        $this->travel(6)->seconds();
        $this->deleteJson('/api/platform/remove/enrollment/'.$completed->id, ['confirmation_token' => $intent])->assertUnprocessable();
        $this->assertNull($completed->fresh()->deleted_at);
        $this->assertSame('completed', $completed->fresh()->status);
    }

    public function test_deleted_vacancy_disappears_but_linked_referral_history_keeps_its_title(): void
    {
        $v = $this->vacancy();
        $u = $this->person();
        $staff = $this->person('peso_staff');
        $this->asUser($u)->postJson('/api/platform/vacancies/'.$v->id.'/referrals')->assertCreated();
        $token = $this->asUser($staff)->postJson('/api/platform/delete-intents', ['type' => 'vacancy', 'id' => $v->id])->assertOk()->json('token');
        $this->travel(6)->seconds();
        $this->deleteJson('/api/platform/remove/vacancy/'.$v->id, ['confirmation_token' => $token])->assertOk();
        $this->getJson('/api/platform/vacancies')->assertJsonPath('total', 0);
        $this->getJson('/api/platform/referrals')->assertOk()->assertJsonPath('data.0.vacancy.title', $v->title);
        $this->assertDatabaseCount('referrals', 1);
        $this->asUser($u)->postJson('/api/platform/vacancies/'.$v->id.'/referrals')->assertNotFound();
    }

    public function test_events_are_retired_from_both_api_versions_and_public_catalog(): void
    {
        $staff = $this->person('peso_staff');
        $base = ['title' => 'Isolated event', 'type' => 'Job fair', 'location' => 'Bansud', 'starts_at' => now()->addWeek()->toIso8601String(), 'description' => 'Isolated test', 'status' => 'draft'];
        $this->asUser($staff);
        foreach (['/api/platform', '/api/v1/platform'] as $prefix) {
            $this->getJson($prefix.'/events')->assertNotFound();
            $this->postJson($prefix.'/events', $base)->assertNotFound();
            $this->patchJson($prefix.'/events/1', $base)->assertNotFound();
        }
        $this->getJson('/api/public/catalog')->assertOk()->assertJsonMissingPath('events');
    }

    public function test_withdrawing_a_referral_does_not_validate_or_require_an_interview_date(): void
    {
        $u = $this->person();
        $v = $this->vacancy();
        $row = Referral::create(['user_id' => $u->id, 'vacancy_id' => $v->id, 'status' => 'requested', 'notes' => 'Synthetic fixture']);
        $this->asUser($u)->patchJson('/api/platform/referrals/'.$row->id, ['status' => 'withdrawn', 'notes' => 'I am withdrawing this request.', 'interview_at' => 'not-a-date'])->assertOk();
        $this->assertSame('withdrawn', $row->fresh()->status);
        $this->assertNull($row->fresh()->interview_at);
    }
}
