<?php

namespace Tests\Feature;

use App\Models\ResumeDocument;
use App\Models\Skill;
use App\Models\TrainingProgram;
use App\Models\User;
use App\Models\Vacancy;
use App\Services\EmploymentMatcher;
use App\Services\ResumeAnalyzer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ResumeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        // Exercise the configured deployment extractor, not an unrelated Git binary.
    }

    private function person(string $role = 'jobseeker'): User
    {
        $u = User::factory()->create(['role' => $role]);
        $u->jobseekerProfile()->create()->forceFill(['profile_completed_at' => now()])->save();

        return $u;
    }

    private function pdf(string $text): UploadedFile
    {
        // A real single-page PDF exercises the deployed extractor, not a mocked result.
        $stream = 'BT /F1 12 Tf 50 750 Td ('.str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $text).') Tj ET';
        $objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', '<< /Length '.strlen($stream)." >>\nstream\n".$stream."\nendstream"];
        $pdf = "%PDF-1.4\n";
        $offsets = [0];
        foreach ($objects as $i => $object) {
            $offsets[] = strlen($pdf);
            $pdf .= ($i + 1)." 0 obj\n".$object."\nendobj\n";
        }
        $xref = strlen($pdf);
        $pdf .= "xref\n0 6\n0000000000 65535 f \n";
        foreach (array_slice($offsets, 1) as $offset) {
            $pdf .= sprintf('%010d 00000 n ', $offset)."\n";
        }
        $pdf .= "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";

        return UploadedFile::fake()->createWithContent('resume.pdf', $pdf);
    }

    public function test_real_pdf_is_private_reviewed_and_improves_matching_without_removing_skills(): void
    {
        $u = $this->person();
        $other = $this->person();
        $excel = Skill::create(['name' => 'Microsoft Excel']);
        $existing = Skill::create(['name' => 'Communication']);
        $u->jobseekerProfile->skills()->attach($existing);
        $v = Vacancy::create(['title' => 'Office Assistant', 'organization' => 'Test Company', 'location' => 'Online', 'industry' => 'Services', 'employment_type' => 'Full-time', 'description' => 'Office spreadsheets and communication', 'skills' => ['Microsoft Excel', 'Communication'], 'slots' => 1, 'deadline' => today()->addMonth(), 'status' => 'published']);
        $before = app(EmploymentMatcher::class)->assess($u->fresh(), $v)['score'];
        $row = $this->actingAs($u)->post('/api/jobseeker/resume', ['resume' => $this->pdf('Resume for Local Test. Skills: Microsoft Excel and spreadsheets. Contact 09171234567. Education: Test College Graduate.')], ['Accept' => 'application/json'])->assertCreated()->assertJsonPath('data.detected.skills.0.name', 'Microsoft Excel')->assertJsonMissingPath('data.path')->json('data');
        $stored = ResumeDocument::findOrFail($row['id']);
        Storage::disk('local')->assertExists($stored->path);
        $this->assertFalse($u->jobseekerProfile->skills()->whereKey($excel->id)->exists());
        $this->actingAs($other)->getJson('/api/jobseeker/resume')->assertJsonPath('data', null);
        $this->get('/api/jobseeker/resume/download')->assertNotFound();
        $this->actingAs($u)->postJson('/api/jobseeker/resume/apply', ['skills' => [$existing->id]])->assertUnprocessable();
        $this->postJson('/api/jobseeker/resume/apply', ['skills' => [$excel->id], 'apply_mobile' => true])->assertOk();
        $this->assertEqualsCanonicalizing([$excel->id, $existing->id], $u->fresh()->jobseekerProfile->skills->modelKeys());
        $this->assertEquals('+639171234567', $u->fresh()->jobseekerProfile->mobile_number);
        $this->assertGreaterThan($before, app(EmploymentMatcher::class)->assess($u->fresh(), $v)['score']);
        $this->get('/api/jobseeker/resume/download')->assertOk()->assertHeader('Cache-Control', 'max-age=0, no-store, private');
        $this->post('/api/jobseeker/resume', ['resume' => $this->pdf('Another local resume. Skills: Microsoft Excel. Education: Test College with sufficient text for extraction.')], ['Accept' => 'application/json'])->assertCreated();
        Storage::disk('local')->assertMissing($stored->path);
        $replacement = ResumeDocument::where('user_id', $u->id)->firstOrFail()->path;
        $this->deleteJson('/api/jobseeker/resume')->assertNoContent();
        Storage::disk('local')->assertMissing($replacement);
        $this->assertDatabaseCount('resume_documents', 0);
        $this->assertCount(2, $u->fresh()->jobseekerProfile->skills);
    }

    public function test_pdf_validation_and_role_boundaries(): void
    {
        $this->getJson('/api/jobseeker/resume')->assertUnauthorized();
        $this->actingAs($this->person('employer'))->getJson('/api/jobseeker/resume')->assertForbidden();
        $this->actingAs($this->person())->post('/api/jobseeker/resume', ['resume' => UploadedFile::fake()->create('bad.txt', 10, 'text/plain')], ['Accept' => 'application/json'])->assertUnprocessable();
        $this->post('/api/jobseeker/resume', ['resume' => $this->pdf('')], ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('resume');
        $this->post('/api/jobseeker/resume', ['resume' => UploadedFile::fake()->create('large.pdf', 5121, 'application/pdf')], ['Accept' => 'application/json'])->assertUnprocessable();
        $this->postJson('/api/jobseeker/resume/apply', ['skills' => []])->assertNotFound();
        $this->assertDatabaseCount('resume_documents', 0);
    }

    public function test_detection_does_not_claim_negated_skills_or_qualifications(): void
    {
        Skill::create(['name' => 'Microsoft Excel']);
        Skill::create(['name' => 'Programming']);
        $detected = app(ResumeAnalyzer::class)->analyze("No Microsoft Excel experience.\nSkills: PHP and Laravel programming.\nEducation\nTest College\nWork Experience\nInternship only.");
        $this->assertSame(['Programming'], array_column($detected['skills'], 'name'));
        $this->assertArrayNotHasKey('qualification', $detected);
        $this->assertStringContainsString('Test College', $detected['education_excerpt']);
    }

    public function test_verified_catalog_is_idempotent_external_and_training_is_specific_to_missing_skills(): void
    {
        $this->artisan('peso:import-verified-training')->assertSuccessful();
        $this->artisan('peso:import-verified-training')->assertSuccessful();
        $this->assertDatabaseCount('training_programs', count(json_decode(file_get_contents(database_path('data/verified-training.json')), true)));
        $p = TrainingProgram::whereJsonContains('skills', 'Communication')->firstOrFail();
        $this->assertNull($p->starts_on);
        $this->assertNull($p->capacity);
        $this->assertFalse($p->is_sample);
        $u = $this->person();
        Vacancy::create(['title' => 'Service Assistant', 'organization' => 'Test Company', 'location' => 'Online', 'industry' => 'Services', 'employment_type' => 'Full-time', 'description' => 'Communicate with customers', 'skills' => ['Communication'], 'slots' => 1, 'deadline' => today()->addMonth(), 'status' => 'published']);
        $matches = $this->actingAs($u)->getJson('/api/platform/matches')->assertOk()->json('matches');
        $this->assertNotEmpty($matches[0]['training']);
        foreach ($matches[0]['training'] as $suggestion) {
            $this->assertSame(['Communication'], $suggestion['addresses']);
        }
        $this->postJson("/api/platform/training/{$p->id}/enroll", ['consent' => true])->assertUnprocessable();
        $this->assertDatabaseCount('enrollments', 0);
        $u->jobseekerProfile->skills()->attach(Skill::where('name', 'Communication')->firstOrFail());
        $this->actingAs($u->fresh())->getJson('/api/platform/matches')->assertJsonCount(0, 'matches.0.training');
    }
}
