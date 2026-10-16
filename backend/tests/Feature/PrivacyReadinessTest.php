<?php

namespace Tests\Feature;

use App\Models\Enrollment;
use App\Models\TrainingProgram;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PrivacyReadinessTest extends TestCase
{
    use RefreshDatabase;

    private function program(): TrainingProgram
    {
        return TrainingProgram::create(['title' => 'Audit program', 'provider' => 'Sample Training Provider', 'location' => 'Online', 'mode' => 'Online', 'description' => 'Disposable audit program', 'requirements' => 'Review requirements', 'skills' => ['Communication'], 'capacity' => 10, 'starts_on' => today()->addMonth(), 'ends_on' => today()->addMonths(2), 'schedule' => 'Test only', 'fee' => 0, 'status' => 'published']);
    }

    private function seeker(): User
    {
        $user = User::factory()->create();
        $user->jobseekerProfile()->create()->forceFill(['profile_completed_at' => now()])->save();

        return $user;
    }

    public function test_current_enrollment_notice_is_recorded_with_server_time_and_trusted_recipient(): void
    {
        $program = $this->program();
        $this->actingAs($this->seeker())->postJson("/api/platform/training/{$program->id}/enroll", ['consent' => false, 'consent_notice_version' => config('security.enrollment_notice_version')])->assertUnprocessable();
        $this->postJson("/api/platform/training/{$program->id}/enroll", ['consent' => true, 'consent_notice_version' => 'unrecognized-version'])->assertUnprocessable()->assertJsonValidationErrors('consent_notice_version');
        $row = $this->postJson("/api/platform/training/{$program->id}/enroll", ['consent' => true, 'consent_notice_version' => config('security.enrollment_notice_version'), 'consent_recipient' => 'Forged recipient', 'consent_accepted_at' => '2000-01-01'])->assertCreated()->json('data');
        $stored = Enrollment::findOrFail($row['id']);
        $this->assertSame(config('security.enrollment_notice_version'), $stored->consent_notice_version);
        $this->assertSame($program->provider, $stored->consent_recipient);
        $this->assertTrue($stored->consent_accepted_at->isToday());
    }

    public function test_legacy_api_acceptance_does_not_fabricate_a_notice_version(): void
    {
        $program = $this->program();
        $legacy = Enrollment::create(['user_id' => $this->seeker()->id, 'training_program_id' => $program->id]);
        $this->assertNull($legacy->fresh()->consent_accepted_at);
        $this->assertNull($legacy->fresh()->consent_notice_version);
        $this->assertNull($legacy->fresh()->consent_recipient);
        $this->actingAs($this->seeker())->postJson("/api/platform/training/{$program->id}/enroll", ['consent' => true])->assertCreated()->assertJsonPath('data.consent_notice_version', null);
        $this->assertNotNull(Enrollment::latest('id')->first()->consent_accepted_at);
    }

    public function test_privacy_request_and_deletion_access_do_not_require_a_completed_profile(): void
    {
        $this->withHeaders(['Origin' => 'http://127.0.0.1:8443']);
        $user = User::factory()->create();
        $user->jobseekerProfile()->create();
        $this->actingAs($user)->postJson('/api/privacy/requests', ['kind' => 'deletion', 'details' => 'Please review my incomplete account'])->assertCreated();
        $this->getJson('/api/privacy/requests')->assertOk()->assertJsonCount(1, 'data');
        $this->assertNotNull($user->fresh());
        $this->deleteJson('/api/auth/account', ['current_password' => 'incorrect'])->assertUnprocessable();
        $this->deleteJson('/api/auth/account', ['current_password' => 'password'])->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseHas('privacy_requests', ['user_id' => null, 'kind' => 'deletion']);
    }
}
