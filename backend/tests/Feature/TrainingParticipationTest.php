<?php

namespace Tests\Feature;

use App\Models\TrainingProgram;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrainingParticipationTest extends TestCase
{
    use RefreshDatabase;

    private function program(): TrainingProgram
    {
        return TrainingProgram::create(['title' => 'Computer Literacy', 'provider' => 'PESO / Mansalay partnership', 'location' => 'Mansalay', 'mode' => 'In person', 'description' => 'Synthetic fixture for digital skills training.', 'requirements' => 'Participant consent', 'skills' => ['Computer Literacy'], 'capacity' => 1, 'starts_on' => today()->addWeek(), 'ends_on' => today()->addMonth(), 'schedule' => 'Weekdays', 'fee' => 0, 'status' => 'published']);
    }

    public function test_peso_can_enroll_walkins_without_accounts_and_full_training_is_visible_and_enforced(): void
    {
        $p = $this->program();
        $staff = User::factory()->create(['role' => 'peso_staff']);
        $data = ['walk_in_name' => 'Synthetic Participant', 'municipality' => 'Mansalay', 'participant_reference' => 'TEST-001', 'consent' => true, 'notes' => 'Consent and participant attendance verified for isolated test.'];
        $this->actingAs($staff)->postJson("/api/platform/training/$p->id/participants", $data)->assertCreated()->assertJsonPath('data.status', 'confirmed')->assertJsonPath('data.user_id', null);
        $this->getJson('/api/platform/training?id='.$p->id)->assertOk()->assertJsonPath('data.0.occupied_places', 1)->assertJsonPath('data.0.pending_requests', 0);
        $this->postJson("/api/platform/training/$p->id/participants", array_replace($data, ['participant_reference' => 'TEST-002']))->assertUnprocessable();
        $u = User::factory()->create();
        $u->jobseekerProfile()->create()->forceFill(['profile_completed_at' => now()])->save();
        $this->actingAs($u)->postJson("/api/platform/training/$p->id/enroll", ['consent' => true])->assertUnprocessable();
        $this->getJson("/api/platform/training/$p->id/participants")->assertForbidden();
        $this->postJson("/api/platform/training/$p->id/participants", $data)->assertForbidden();
    }

    public function test_assisted_enrollment_has_consent_duplicate_and_role_guards(): void
    {
        $p = $this->program();
        $p->update(['capacity' => 3]);
        $staff = User::factory()->create(['role' => 'peso_staff']);
        $job = User::factory()->create();
        $data = ['user_id' => $job->id, 'municipality' => 'Mansalay', 'participant_reference' => 'TEST-001', 'notes' => 'Recorded consenting participant'];
        $this->actingAs($staff)->postJson("/api/platform/training/$p->id/participants", $data)->assertUnprocessable();
        $data['consent'] = true;
        $this->postJson("/api/platform/training/$p->id/participants", $data)->assertCreated();
        $this->postJson("/api/platform/training/$p->id/participants", $data)->assertConflict();
        $this->getJson("/api/platform/training/$p->id/participants")->assertOk()->assertJsonCount(1, 'data');
        $this->assertDatabaseCount('enrollments', 1);
    }

    public function test_training_demand_aggregates_unique_people_without_creating_enrollment(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $this->actingAs($a)->postJson('/api/platform/training-demands', ['topic' => 'Computer Literacy'])->assertCreated();
        $this->postJson('/api/platform/training-demands', ['topic' => ' computer   literacy '])->assertCreated();
        $this->actingAs($b)->postJson('/api/platform/training-demands', ['topic' => 'Computer Literacy'])->assertCreated();
        $this->getJson('/api/platform/training-demands')->assertJsonCount(1, 'data');
        $this->assertDatabaseCount('enrollments', 0);
        $this->actingAs(User::factory()->create(['role' => 'peso_staff']))->getJson('/api/platform/training-demands')->assertOk()->assertJsonPath('data.0.interested_jobseekers', 2);
    }

    public function test_only_admin_can_create_accounts_with_password_reauthentication(): void
    {
        $staff = User::factory()->create(['role' => 'peso_staff']);
        $body = ['first_name' => 'Synthetic', 'last_name' => 'Staff', 'email' => 'staff@example.test', 'password' => 'SafeFixture123!', 'password_confirmation' => 'SafeFixture123!', 'role' => 'peso_staff', 'current_password' => 'AdminFixture123!'];
        $this->actingAs($staff)->postJson('/api/platform/users', $body)->assertForbidden();
        $admin = User::factory()->create(['role' => 'admin', 'password' => 'AdminFixture123!']);
        $this->app['auth']->forgetGuards();
        $this->actingAs($admin, 'web');
        $this->withSession(['password_hash_web' => $admin->getAuthPassword()]);
        $this->postJson('/api/platform/users', array_replace($body, ['current_password' => 'wrong']))->assertUnprocessable();
        $this->postJson('/api/platform/users', $body)->assertCreated()->assertJsonPath('data.role', 'peso_staff')->assertJsonMissingPath('data.password');
        $this->assertDatabaseHas('audit_events', ['action' => 'user.created']);
    }
}
