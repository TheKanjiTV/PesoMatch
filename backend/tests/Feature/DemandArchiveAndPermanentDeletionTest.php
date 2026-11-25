<?php

namespace Tests\Feature;

use App\Models\EmploymentOutcome;
use App\Models\Enrollment;
use App\Models\Placement;
use App\Models\Referral;
use App\Models\ResumeDocument;
use App\Models\TrainingDemand;
use App\Models\TrainingProgram;
use App\Models\User;
use App\Models\Vacancy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DemandArchiveAndPermanentDeletionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeader('Origin', 'http://127.0.0.1:8443');
    }

    private function person(string $role = 'jobseeker'): User
    {
        $user = User::factory()->create(['role' => $role]);
        if ($role === 'jobseeker') {
            $user->jobseekerProfile()->create()->forceFill(['profile_completed_at' => now()])->save();
        }

        return $user;
    }

    private function program(): TrainingProgram
    {
        return TrainingProgram::create(['title' => 'Synthetic training', 'provider' => 'Fixture', 'location' => 'Mansalay', 'mode' => 'Online', 'description' => 'Fixture', 'requirements' => 'None', 'skills' => [], 'capacity' => 2, 'starts_on' => today()->addWeek(), 'ends_on' => today()->addMonth(), 'schedule' => 'Weekdays', 'fee' => 0, 'status' => 'published']);
    }

    private function vacancy(): Vacancy
    {
        return Vacancy::create(['title' => 'Synthetic vacancy', 'organization' => 'Fixture', 'location' => 'Mansalay', 'industry' => 'Services', 'employment_type' => 'Full-time', 'description' => 'Fixture', 'skills' => [], 'slots' => 1, 'deadline' => today()->addMonth(), 'status' => 'published']);
    }

    private function demand(User $user, string $topic = 'Computer Literacy'): TrainingDemand
    {
        return TrainingDemand::create(['user_id' => $user->id, 'topic' => $topic, 'topic_key' => mb_strtolower($topic), 'description' => 'Keep these requested details.']);
    }

    private function admin(): User
    {
        $admin = $this->person('admin');
        $this->app['auth']->forgetGuards();
        $this->actingAs($admin, 'web')->withSession(['password_hash_web' => $admin->getAuthPassword()]);

        return $admin;
    }

    private function deletion(string $type, int $id): array
    {
        $intent = $this->postJson('/api/v1/platform/archive/delete-intents', compact('type', 'id'))->assertOk()->json();

        return ['confirmation_token' => $intent['token'], 'confirmation_name' => $intent['label'], 'current_password' => 'password'];
    }

    public function test_demand_archival_is_per_person_and_restore_and_rerequest_preserve_catalog(): void
    {
        $a = $this->person();
        $b = $this->person();
        $one = $this->demand($a);
        $two = $this->demand($b);
        $other = $this->demand($a, 'Bookkeeping');
        $program = $this->program();
        $this->actingAs($a)->postJson('/api/v1/platform/training-demands/'.$two->id.'/archive')->assertForbidden();
        $this->postJson('/api/v1/platform/training-demands/archive-topic', ['topic_key' => $one->topic_key])->assertNotFound();
        $this->postJson('/api/v1/platform/training-demands/'.$one->id.'/archive')->assertOk();
        $this->getJson('/api/v1/platform/training-demands')->assertJsonPath('total', 1);
        $this->actingAs($this->person('peso_staff'))->getJson('/api/v1/platform/training-demands')->assertOk()->assertJsonPath('data.1.interested_jobseekers', 1);
        $this->postJson('/api/v1/platform/training-demands/'.$two->id.'/archive')->assertOk();
        $this->getJson('/api/v1/platform/training-demands?topic_key=computer%20literacy')->assertJsonPath('total', 0);
        $this->admin();
        $this->getJson('/api/v1/platform/archive?kind=demand')->assertJsonPath('total', 2);
        $this->postJson('/api/v1/platform/archive/demand/'.$one->id.'/restore')->assertOk();
        $this->assertFalse($one->fresh()->trashed());
        $this->actingAs($b)->postJson('/api/v1/platform/training-demands', ['topic' => $two->topic])->assertCreated();
        $this->assertSame('Keep these requested details.', $two->fresh()->description);
        $this->assertFalse($two->fresh()->trashed());
        $this->assertFalse($other->fresh()->trashed());
        $this->assertDatabaseCount('training_demands', 3);
        $this->assertDatabaseHas('training_programs', ['id' => $program->id, 'deleted_at' => null]);
        $this->assertDatabaseCount('enrollments', 0);
        $this->assertSame(2, DB::table('audit_events')->where('action', 'demand.archived')->count());
        $this->assertDatabaseHas('audit_events', ['action' => 'demand.restored']);
    }

    public function test_staff_archive_one_person_keeps_the_other_request_for_the_same_topic(): void
    {
        $one = $this->demand($this->person());
        $two = $this->demand($this->person());
        $this->actingAs($this->person('peso_staff'));
        $this->postJson('/api/v1/platform/training-demands/'.$one->id.'/archive')->assertOk();
        $this->getJson('/api/v1/platform/training-demands')->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.interested_jobseekers', 1);
        $this->getJson('/api/v1/platform/training-demands?topic_key=computer%20literacy')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $two->id);
        $this->assertTrue($one->fresh()->trashed());
        $this->assertFalse($two->fresh()->trashed());
        $this->assertSame(1, DB::table('audit_events')->where('action', 'demand.archived')->count());
        foreach (['/api/platform', '/api/v1/platform'] as $prefix) {
            $this->postJson($prefix.'/training-demands/archive-topic', ['topic_key' => $one->topic_key])->assertNotFound();
        }
    }

    public function test_expired_permanent_deletion_intent_explains_how_to_recover_and_leaves_record_archived(): void
    {
        $row = $this->demand($this->person());
        $row->delete();
        $this->admin();
        $payload = $this->deletion('demand', $row->id);
        $this->travel(6)->minutes();
        $this->deleteJson('/api/v1/platform/archive/demand/'.$row->id, $payload)->assertUnprocessable()->assertJsonPath('message', 'Confirmation expired. Review the deletion confirmation again.');
        $this->assertTrue($row->fresh()->trashed());
        $fresh = $this->deletion('demand', $row->id);
        $this->travel(6)->seconds();
        $this->deleteJson('/api/v1/platform/archive/demand/'.$row->id, $fresh)->assertOk();
    }

    public function test_permanent_delete_requires_admin_archived_record_password_name_wait_and_one_use_token(): void
    {
        $request = $this->demand($this->person());
        foreach (['jobseeker', 'peso_staff', 'employer', 'training_provider'] as $role) {
            $this->actingAs($this->person($role))->postJson('/api/v1/platform/archive/delete-intents', ['type' => 'demand', 'id' => $request->id])->assertForbidden();
            $this->deleteJson('/api/v1/platform/archive/demand/'.$request->id)->assertForbidden();
        }
        $this->admin();
        $this->postJson('/api/v1/platform/archive/delete-intents', ['type' => 'demand', 'id' => $request->id])->assertNotFound();
        $request->delete();
        $payload = $this->deletion('demand', $request->id);
        $path = '/api/v1/platform/archive/demand/'.$request->id;
        $this->deleteJson($path, $payload)->assertUnprocessable();
        $this->travel(6)->seconds();
        $this->deleteJson($path, array_replace($payload, ['current_password' => 'wrong']))->assertUnprocessable();
        $this->deleteJson($path, array_replace($payload, ['confirmation_name' => 'wrong']))->assertUnprocessable();
        $this->deleteJson($path, array_replace($payload, ['confirmation_token' => 'tampered']))->assertUnprocessable();
        $this->deleteJson('/api/v1/platform/archive/training/'.$request->id, $payload)->assertUnprocessable();
        $this->deleteJson($path, $payload)->assertOk();
        $this->deleteJson($path, $payload)->assertUnprocessable();
        $this->assertDatabaseMissing('training_demands', ['id' => $request->id]);
        $this->assertDatabaseHas('audit_events', ['action' => 'demand.permanently_deleted', 'entity_id' => $request->id]);
    }

    public function test_restored_records_and_changed_impacts_cannot_be_deleted_from_stale_confirmation(): void
    {
        $owner = $this->person();
        $row = $this->demand($owner);
        $row->delete();
        $this->admin();
        $payload = $this->deletion('demand', $row->id);
        $this->postJson('/api/v1/platform/archive/demand/'.$row->id.'/restore')->assertOk();
        $this->travel(6)->seconds();
        $this->deleteJson('/api/v1/platform/archive/demand/'.$row->id, $payload)->assertNotFound();
        $program = $this->program();
        $program->delete();
        $payload = $this->deletion('training', $program->id);
        Enrollment::create(['user_id' => $owner->id, 'training_program_id' => $program->id, 'status' => 'withdrawn']);
        $this->travel(6)->seconds();
        $this->deleteJson('/api/v1/platform/archive/training/'.$program->id, $payload)->assertConflict();
        $this->assertDatabaseHas('training_programs', ['id' => $program->id]);
    }

    public function test_training_and_enrollment_deletion_clear_source_links_but_keep_separate_requests(): void
    {
        $owner = $this->person();
        $program = $this->program();
        $request = $this->demand($owner);
        $request->update(['source_program_id' => $program->id]);
        $enrollment = Enrollment::create(['user_id' => $owner->id, 'training_program_id' => $program->id, 'status' => 'withdrawn']);
        $enrollment->delete();
        $this->admin();
        $payload = $this->deletion('enrollment', $enrollment->id);
        $this->travel(6)->seconds();
        $this->deleteJson('/api/v1/platform/archive/enrollment/'.$enrollment->id, $payload)->assertOk();
        $this->assertDatabaseMissing('enrollments', ['id' => $enrollment->id]);
        Enrollment::create(['user_id' => $owner->id, 'training_program_id' => $program->id, 'status' => 'confirmed']);
        $program->delete();
        $payload = $this->deletion('training', $program->id);
        $this->travel(6)->seconds();
        $this->deleteJson('/api/v1/platform/archive/training/'.$program->id, $payload)->assertOk();
        $this->assertDatabaseMissing('training_programs', ['id' => $program->id]);
        $this->assertDatabaseCount('enrollments', 0);
        $this->assertDatabaseHas('training_demands', ['id' => $request->id, 'source_program_id' => null, 'deleted_at' => null]);
    }

    public function test_vacancy_deletion_removes_referrals_placements_vectors_and_bookmarks_but_preserves_employment_reports(): void
    {
        $owner = $this->person();
        $vacancy = $this->vacancy();
        $referral = Referral::create(['user_id' => $owner->id, 'vacancy_id' => $vacancy->id, 'status' => 'placed']);
        $placement = Placement::create(['user_id' => $owner->id, 'referral_id' => $referral->id, 'started_on' => today(), 'employment_type' => 'Full-time', 'evidence' => 'Fixture', 'follow_up_on' => today()->addMonth()]);
        $report = EmploymentOutcome::create(['user_id' => $owner->id, 'placement_id' => $placement->id, 'status' => 'employed', 'reported_on' => today(), 'notes' => 'Fixture']);
        DB::table('saved_vacancies')->insert(['user_id' => $owner->id, 'vacancy_id' => $vacancy->id, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('ai_embeddings')->insert(['source_type' => 'vacancy', 'source_id' => $vacancy->id, 'model' => 'fixture', 'content_hash' => str_repeat('a', 64), 'vector' => '[1]']);
        $vacancy->delete();
        $this->admin();
        $payload = $this->deletion('vacancy', $vacancy->id);
        $this->travel(6)->seconds();
        $this->deleteJson('/api/v1/platform/archive/vacancy/'.$vacancy->id, $payload)->assertOk();
        foreach (['vacancies', 'referrals', 'placements', 'saved_vacancies', 'ai_embeddings'] as $table) {
            $this->assertDatabaseCount($table, 0);
        }
        $this->assertDatabaseHas('employment_outcomes', ['id' => $report->id, 'placement_id' => null]);
        $this->assertDatabaseHas('users', ['id' => $owner->id]);
    }

    public function test_archived_account_deletion_removes_private_resume_and_personal_links_while_keeping_owned_catalog_and_audit(): void
    {
        Storage::fake('local');
        $owner = $this->person();
        $vacancy = $this->vacancy();
        $vacancy->update(['owner_id' => $owner->id]);
        $this->demand($owner);
        $referral = Referral::create(['user_id' => $owner->id, 'vacancy_id' => $vacancy->id, 'status' => 'placed']);
        Placement::create(['user_id' => $owner->id, 'referral_id' => $referral->id, 'started_on' => today(), 'employment_type' => 'Full-time', 'evidence' => 'Fixture', 'follow_up_on' => today()->addMonth()]);
        Storage::disk('local')->put('resumes/fixture.pdf', 'synthetic');
        ResumeDocument::create(['user_id' => $owner->id, 'filename' => 'fixture.pdf', 'path' => 'resumes/fixture.pdf', 'detected' => [], 'excerpt' => 'synthetic']);
        DB::table('ai_embeddings')->insert(['source_type' => 'profile', 'source_id' => $owner->id, 'model' => 'fixture', 'content_hash' => str_repeat('a', 64), 'vector' => '[1]']);
        $owner->forceFill(['archived_at' => now()])->save();
        $this->admin();
        $payload = $this->deletion('account', $owner->id);
        $this->travel(6)->seconds();
        $this->deleteJson('/api/v1/platform/archive/account/'.$owner->id, $payload)->assertOk();
        foreach (['resume_documents', 'jobseeker_profiles', 'training_demands', 'referrals', 'placements', 'ai_embeddings'] as $table) {
            $this->assertDatabaseCount($table, 0);
        }
        Storage::disk('local')->assertMissing('resumes/fixture.pdf');
        $this->assertDatabaseMissing('users', ['id' => $owner->id]);
        $this->assertDatabaseHas('vacancies', ['id' => $vacancy->id, 'owner_id' => null]);
        $this->assertDatabaseHas('audit_events', ['action' => 'account.permanently_deleted', 'entity_id' => $owner->id]);
        $this->assertDatabaseHas('audit_events', ['action' => 'auth.account_deleted', 'actor_id' => null]);
    }
}
