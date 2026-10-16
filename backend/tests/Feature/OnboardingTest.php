<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class OnboardingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    private function account(): User
    {
        return User::factory()->create(['first_name' => 'Kenji', 'last_name' => 'Santos']);
    }

    private function personal(array $overrides = []): array
    {
        return array_replace(['first_name' => 'Kenji', 'middle_name' => '', 'last_name' => 'Santos', 'birth_date' => '2000-01-02', 'sex' => '', 'mobile_number' => '0917 123 4567', 'address_line' => 'Sample Street', 'province' => 'Oriental Mindoro', 'municipality' => 'Bansud', 'barangay' => 'Poblacion'], $overrides);
    }

    private function education(): array
    {
        return ['highest_attainment' => 'College Graduate', 'school_name' => 'Sample College', 'course_program' => 'Information Technology', 'year_graduated' => 2024, 'educational_status' => 'Graduated'];
    }

    private function preferences(): array
    {
        return ['occupations' => ['Customer Service', 'Office Assistant'], 'preferred_industry' => 'Services', 'preferred_location' => 'Oriental Mindoro', 'employment_types' => ['Full-time'], 'work_arrangements' => ['On-site', 'Hybrid'], 'willing_to_relocate' => false];
    }

    private function saveToSkills(): void
    {
        $this->patchJson('/api/jobseeker/onboarding/personal', $this->personal())->assertOk();
        $this->patchJson('/api/jobseeker/onboarding/education', $this->education())->assertOk();
    }

    private function finishSteps(): void
    {
        $this->saveToSkills();
        $this->patchJson('/api/jobseeker/onboarding/skills', ['skills' => [1, 2], 'certifications' => [], 'languages' => [], 'licenses' => []])->assertOk();
        $this->patchJson('/api/jobseeker/onboarding/work-experience', ['has_experience' => false, 'experiences' => []])->assertOk();
        $this->patchJson('/api/jobseeker/onboarding/preferences', $this->preferences())->assertOk();
    }

    public function test_year_level_is_validated_and_persisted_separately_from_graduation_year(): void
    {
        $this->actingAs($this->account(), 'web');
        $this->patchJson('/api/jobseeker/onboarding/personal', $this->personal())->assertOk();
        foreach (['1st', '2nd', '3rd', '4th', '5th', '5+'] as $level) {
            $this->patchJson('/api/jobseeker/onboarding/education', array_replace($this->education(), ['year_level' => $level]))->assertOk();
            $this->getJson('/api/jobseeker/onboarding')->assertOk()->assertJsonPath('data.education.year_level', $level)->assertJsonPath('data.education.year_graduated', 2024);
        }
        $this->patchJson('/api/jobseeker/onboarding/education', array_replace($this->education(), ['year_level' => '6th']))->assertUnprocessable()->assertJsonValidationErrors('year_level');
        $this->getJson('/api/jobseeker/onboarding')->assertJsonPath('data.education.year_level', '5+');
        $this->patchJson('/api/jobseeker/onboarding/education', array_replace($this->education(), ['year_level' => null, 'course_program' => 'Coastal Resource Studies']))->assertOk();
        $this->getJson('/api/jobseeker/onboarding')->assertJsonPath('data.education.year_level', '')->assertJsonPath('data.education.course_program', 'Coastal Resource Studies');
    }

    public function test_guests_cannot_read_or_modify_profiles(): void
    {
        foreach (['/api/auth/user', '/api/jobseeker/onboarding', '/api/jobseeker/profile', '/api/skills'] as $url) {
            $this->getJson($url)->assertUnauthorized();
        }
        $this->patchJson('/api/jobseeker/onboarding/personal', $this->personal())->assertUnauthorized();
        $this->postJson('/api/jobseeker/onboarding/complete')->assertUnauthorized();
    }

    public function test_registration_creates_account_then_requires_login_and_sets_first_step(): void
    {
        $response = $this->postJson('/api/auth/register', ['terms_accepted' => true, 'first_name' => 'Ana', 'last_name' => 'Cruz', 'email' => 'ANA@example.test', 'password' => 'test-password-123', 'password_confirmation' => 'test-password-123', 'mobile_number' => '9171234567']);
        $response->assertCreated()->assertJsonPath('user.email', 'ana@example.test')->assertJsonPath('user.role', 'jobseeker')->assertJsonPath('onboarding.current_step', 1)->assertJsonPath('onboarding.completed', false)->assertJsonMissingPath('user.password');
        $user = User::first();
        $this->assertTrue(Hash::check('test-password-123', $user->password));
        $this->assertGuest();
        $this->getJson('/api/jobseeker/onboarding')->assertUnauthorized();
        $this->postJson('/api/auth/login', ['email' => 'ana@example.test', 'password' => 'test-password-123'])->assertOk();
        $this->assertAuthenticatedAs($user);
        $this->assertDatabaseHas('jobseeker_profiles', ['user_id' => $user->id, 'mobile_number' => '+639171234567']);
    }

    public function test_registration_rejects_invalid_password_and_public_roles(): void
    {
        $this->postJson('/api/auth/register', ['terms_accepted' => true, 'first_name' => 'Ana', 'last_name' => 'Cruz', 'email' => 'ana@example.test', 'password' => 'tiny', 'password_confirmation' => 'tiny', 'role' => 'admin'])->assertUnprocessable()->assertJsonValidationErrors(['password', 'role']);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_login_and_logout_use_session_and_invalid_credentials_are_generic(): void
    {
        $user = $this->account();
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'incorrect'])->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password'])->assertOk()->assertJsonPath('user.id', $user->id);
        $this->assertAuthenticatedAs($user);
        $this->postJson('/api/auth/logout')->assertOk();
        $this->assertGuest('web');
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/auth/user')->assertUnauthorized();
    }

    public function test_csrf_is_enforced_outside_testing_environment(): void
    {
        $this->app['env'] = 'local';
        $this->postJson('/api/auth/login', ['email' => 'ana@example.test', 'password' => 'test-password'])->assertStatus(419);
    }

    public function test_partial_progress_is_saved_and_resumed_from_first_missing_section(): void
    {
        $user = $this->account();
        $this->actingAs($user);
        $this->patchJson('/api/jobseeker/onboarding/personal', $this->personal())->assertOk()->assertJsonPath('onboarding.current_step', 2)->assertJsonPath('onboarding.completion_percentage', 20)->assertJsonPath('data.personal.mobile_number', '+639171234567');
        $this->getJson('/api/jobseeker/onboarding')->assertOk()->assertJsonPath('data.personal.first_name', 'Kenji')->assertJsonPath('onboarding.current_step', 2);
        $this->getJson('/api/auth/user')->assertJsonPath('onboarding.current_step', 2);
        $this->assertDatabaseHas('jobseeker_profiles', ['user_id' => $user->id, 'onboarding_step' => 2, 'profile_completion_status' => 'in_progress']);
    }

    public function test_steps_cannot_be_skipped_and_completion_cannot_be_forged(): void
    {
        $this->actingAs($this->account());
        $this->patchJson('/api/jobseeker/onboarding/education', $this->education())->assertUnprocessable()->assertJsonValidationErrors('section');
        $this->postJson('/api/jobseeker/onboarding/complete')->assertUnprocessable();
        $this->patchJson('/api/jobseeker/onboarding/personal', $this->personal(['profile_completed_at' => '2026-01-01', 'onboarding_step' => 5]))->assertUnprocessable()->assertJsonValidationErrors(['profile_completed_at', 'onboarding_step']);
    }

    public function test_required_fields_invalid_mobile_and_future_birthdate_are_rejected(): void
    {
        $this->actingAs($this->account());
        $this->patchJson('/api/jobseeker/onboarding/personal', $this->personal(['first_name' => '', 'mobile_number' => '917letters', 'birth_date' => now()->addDay()->format('Y-m-d')]))->assertUnprocessable()->assertJsonValidationErrors(['first_name', 'mobile_number', 'birth_date']);
        $this->assertDatabaseCount('jobseeker_profiles', 0);
    }

    public function test_full_profile_can_finish_with_no_experience_or_optional_qualifications(): void
    {
        $user = $this->account();
        $this->actingAs($user);
        $this->finishSteps();
        $this->postJson('/api/jobseeker/onboarding/complete')->assertOk()->assertJsonPath('onboarding.completed', true)->assertJsonPath('onboarding.completion_percentage', 100)->assertJsonCount(5, 'onboarding.completed_steps')->assertJsonPath('data.work_experience.has_experience', false);
        $this->assertNotNull($user->jobseekerProfile()->first()->profile_completed_at);
        $this->assertDatabaseHas('jobseeker_profiles', ['user_id' => $user->id, 'profile_completion_status' => 'complete', 'has_work_experience' => false]);
        $this->getJson('/api/auth/user')->assertJsonPath('onboarding.completed', true);
        $this->postJson('/api/jobseeker/onboarding/complete')->assertOk();
    }

    public function test_user_ownership_is_not_accepted_from_payload_or_query(): void
    {
        $owner = $this->account();
        $attacker = $this->account();
        $this->actingAs($owner);
        $this->finishSteps();
        $ownerProfile = $owner->jobseekerProfile()->first();
        $this->actingAs($attacker);
        $this->getJson('/api/jobseeker/profile?user_id='.$owner->id)->assertOk()->assertJsonPath('data.personal.address_line', '')->assertJsonPath('onboarding.current_step', 1);
        $this->patchJson('/api/jobseeker/profile', $this->personal(['section' => 'personal', 'user_id' => $owner->id, 'jobseeker_profile_id' => $ownerProfile->id]))->assertUnprocessable()->assertJsonValidationErrors(['user_id', 'jobseeker_profile_id']);
        $this->assertDatabaseHas('jobseeker_profiles', ['id' => $ownerProfile->id, 'address_line' => 'Sample Street']);
    }

    public function test_optional_qualifications_are_normalized_and_replaced_without_duplicates(): void
    {
        $this->actingAs($this->account());
        $this->saveToSkills();
        $data = ['skills' => [1, 4], 'certifications' => [['certification_name' => 'Computer Skills', 'issuing_organization' => 'Sample School', 'issued_at' => '2024-06-01', 'credential_reference' => 'DEMO-123']], 'languages' => [['language' => 'Filipino', 'proficiency' => 'Native']], 'licenses' => [['license_name' => 'Driver license', 'license_number' => 'SAMPLE', 'expiry_date' => '2027-12-31']]];
        $this->patchJson('/api/jobseeker/onboarding/skills', $data)->assertOk()->assertJsonPath('data.skills.certifications.0.certification_name', 'Computer Skills');
        $this->patchJson('/api/jobseeker/onboarding/skills', $data)->assertOk();
        $this->assertDatabaseCount('jobseeker_skill', 2);
        $this->assertDatabaseCount('jobseeker_certifications', 1);
        $this->assertDatabaseCount('jobseeker_languages', 1);
        $this->assertDatabaseCount('jobseeker_licenses', 1);
        $this->patchJson('/api/jobseeker/onboarding/skills', ['skills' => [99999]])->assertUnprocessable()->assertJsonValidationErrors('skills.0');
        $this->assertDatabaseCount('jobseeker_certifications', 1);
    }

    public function test_work_experience_validates_date_order_and_current_employment(): void
    {
        $this->actingAs($this->account());
        $this->saveToSkills();
        $this->patchJson('/api/jobseeker/onboarding/skills', ['skills' => [1]])->assertOk();
        $row = ['job_title' => 'Assistant', 'company_name' => 'Sample Company', 'start_date' => '2024-01-01', 'end_date' => '2023-12-31', 'is_current' => false];
        $this->patchJson('/api/jobseeker/onboarding/work-experience', ['has_experience' => true, 'experiences' => [$row]])->assertUnprocessable()->assertJsonValidationErrors('experiences.0.end_date');
        $this->patchJson('/api/jobseeker/onboarding/work-experience', ['has_experience' => true, 'experiences' => []])->assertUnprocessable();
        $row['end_date'] = '';
        $row['is_current'] = true;
        $this->patchJson('/api/jobseeker/onboarding/work-experience', ['has_experience' => true, 'experiences' => [$row]])->assertOk();
        $this->assertDatabaseHas('jobseeker_work_experiences', ['is_current' => true, 'end_date' => null]);
        $this->patchJson('/api/jobseeker/onboarding/work-experience', ['has_experience' => false, 'experiences' => []])->assertOk();
        $this->assertDatabaseCount('jobseeker_work_experiences', 0);
    }

    public function test_profile_edit_keeps_completion_and_tour_preference_persists(): void
    {
        $user = $this->account();
        $this->actingAs($user);
        $this->finishSteps();
        $this->postJson('/api/jobseeker/onboarding/complete')->assertOk();
        $this->patchJson('/api/jobseeker/profile', $this->personal(['section' => 'personal', 'first_name' => 'Updated']))->assertOk()->assertJsonPath('onboarding.completed', true)->assertJsonPath('data.personal.first_name', 'Updated');
        $this->patchJson('/api/auth/preferences', ['dashboard_tour_completed' => true])->assertOk();
        $this->assertNotNull($user->fresh()->dashboard_tour_completed_at);
        $this->getJson('/api/auth/user')->assertJsonPath('user.first_name', 'Updated');
    }

    public function test_non_jobseekers_cannot_change_jobseeker_profiles(): void
    {
        $user = $this->account();
        $user->role = 'staff';
        $user->save();
        $this->actingAs($user);
        $this->getJson('/api/jobseeker/profile')->assertForbidden();
        $this->patchJson('/api/jobseeker/onboarding/personal', $this->personal())->assertForbidden();
    }
}
