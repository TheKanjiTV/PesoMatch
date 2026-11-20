<?php

namespace Tests\Feature;

use App\Models\ResumeDocument;
use App\Models\User;
use App\Services\ResumeAnalyzer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResumeProfileReviewTest extends TestCase
{
    use RefreshDatabase;

    private function owner(): User
    {
        $u = User::factory()->create(['role' => 'jobseeker']);
        $u->jobseekerProfile()->create();
        ResumeDocument::create(['user_id' => $u->id, 'filename' => 'synthetic.pdf', 'path' => 'synthetic-private-path', 'excerpt' => 'Synthetic reviewed facts only. No real applicant information.', 'detected' => ['method' => 'local-pdf-text-skill-evidence-v2', 'skills' => []]]);

        return $u;
    }

    public function test_certificate_sections_are_not_formal_education_and_dates_are_not_invented(): void
    {
        $result = app(ResumeAnalyzer::class)->analyze("EDUCATION\nTest College\nBachelor of Science\nCERTIFICATES\nAIClassASEAN.org AI for Oceans | 2025\nCode.Org Certificate of Completion | 2026\nWORK EXPERIENCE\nJob title: Web Developer\nCompany: Test Studio\n2025 - 2026\nSKILLS\nPHP");
        $this->assertStringContainsString('Test College', $result['education_excerpt']);
        $this->assertStringNotContainsString('AIClassASEAN', $result['education_excerpt']);
        $this->assertStringContainsString('AIClassASEAN', $result['certifications_excerpt']);
        $this->assertStringNotContainsString('Certificate', $result['experience_excerpt']);
        $this->assertSame('Web Developer', $result['experience_draft']['job_title']);
        $this->assertSame('Test Studio', $result['experience_draft']['company_name']);
        $this->assertArrayNotHasKey('start_date', $result['experience_draft']);
    }

    public function test_reviewed_work_is_appended_once_requires_real_dates_and_preserves_other_profile_facts(): void
    {
        $u = $this->owner();
        $profile = $u->jobseekerProfile;
        $profile->workExperiences()->create(['job_title' => 'Existing role', 'company_name' => 'Existing employer', 'start_date' => '2023-01-01', 'end_date' => '2023-12-31', 'is_current' => false]);
        $body = ['reviewed' => true, 'job_title' => 'Web Developer', 'company_name' => 'Test Studio', 'start_date' => '2025-01-01', 'end_date' => '2025-12-31', 'is_current' => false, 'description' => 'Reviewed facts.'];
        $this->actingAs($u)->postJson('/api/jobseeker/resume/experience', array_diff_key($body, ['start_date' => true]))->assertUnprocessable();
        $this->postJson('/api/jobseeker/resume/experience', $body + ['user_id' => 9999])->assertOk();
        $this->assertCount(2, $profile->fresh()->workExperiences);
        $this->assertTrue($profile->fresh()->has_work_experience);
        $this->postJson('/api/jobseeker/resume/experience', $body)->assertConflict();
        $this->assertDatabaseCount('jobseeker_work_experiences', 2);
        $this->assertDatabaseCount('jobseeker_educations', 0);
        $this->postJson('/api/jobseeker/resume/experience', array_replace($body, ['reviewed' => false]))->assertUnprocessable();
        $this->actingAs(User::factory()->create(['role' => 'jobseeker']))->postJson('/api/jobseeker/resume/experience', $body)->assertNotFound();
    }

    public function test_certificates_save_separately_without_fabricating_a_date_and_are_owner_scoped(): void
    {
        $u = $this->owner();
        $body = ['reviewed' => true, 'certification_name' => 'AI for Oceans', 'issuing_organization' => 'Code.Org', 'issued_at' => null];
        $this->actingAs($u)->postJson('/api/jobseeker/resume/certification', array_replace($body, ['issued_at' => '2025']))->assertUnprocessable();
        $this->postJson('/api/jobseeker/resume/certification', $body)->assertOk();
        $certificate = $u->jobseekerProfile->certifications()->firstOrFail();
        $this->assertNull($certificate->issued_at);
        $this->assertSame('AI for Oceans', $certificate->certification_name);
        $this->assertDatabaseCount('jobseeker_educations', 0);
        $this->postJson('/api/jobseeker/resume/certification', $body)->assertConflict();
        $this->actingAs(User::factory()->create(['role' => 'employer']))->postJson('/api/jobseeker/resume/certification', $body)->assertForbidden();
    }
}
