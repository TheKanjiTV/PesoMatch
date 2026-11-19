<?php

namespace Tests\Feature;

use App\Models\ResumeDocument;
use App\Models\Skill;
use App\Models\TrainingProgram;
use App\Models\User;
use App\Models\Vacancy;
use App\Services\SemanticMatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/** Real paid/free provider inference only when explicitly enabled; never uses Http::fake. */
class LiveAiEmploymentTest extends TestCase
{
    use RefreshDatabase;

    public static function languages(): array
    {
        return [['en'], ['fil']];
    }

    #[DataProvider('languages')]
    public function test_real_models_through_authenticated_routes_and_five_answer_practice(string $language): void
    {
        if (getenv('PESO_LIVE_AI') !== '1') {
            $this->markTestSkipped('Opt-in only: set PESO_LIVE_AI=1 for actual external model calls.');
        }
        $this->assertSame('sqlite', config('database.default'));
        $this->assertSame(':memory:', config('database.connections.sqlite.database'));
        $this->assertTrue((bool) config('ai.enabled') && filled(config('ai.key')), 'Configure real backend provider access first.');
        // Exercise application auth/ownership, while request pacing is tested separately.
        $this->withoutMiddleware(ThrottleRequests::class);
        $recordDirectory = dirname(base_path()).'/.local/live-ai-verification';
        if (! is_dir($recordDirectory)) {
            mkdir($recordDirectory, 0700, true);
        }
        $recordFile = $recordDirectory.'/attempt-'.date('Ymd-His').'-'.$language.'.json';
        $recordedOutputs = [];
        // Only synthetic fixture responses. Never record request headers or real applicant data.
        Http::globalResponseMiddleware(function ($response) use (&$recordedOutputs, $recordFile) {
            $data = json_decode((string) $response->getBody(), true);
            if (isset($data['message']['content'])) {
                $recordedOutputs[] = ['finish_reason' => $data['finish_reason'] ?? null, 'content' => $data['message']['content']];
                file_put_contents($recordFile, json_encode($recordedOutputs, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            }

            return $response;
        });

        $u = User::factory()->create(['name' => 'Synthetic Applicant', 'first_name' => 'Synthetic', 'last_name' => 'Applicant', 'email' => 'live-ai-fixture@example.test']);
        $profile = $u->jobseekerProfile()->create();
        $profile->forceFill(['profile_completed_at' => now()])->save();
        $profile->skills()->attach(Skill::create(['name' => 'Computer Literacy']));
        $facts = $language === 'fil'
            ? 'Nagtala ako ng mga kahilingan ng customer at nag-ayos ng spreadsheet records. Gumamit ako ng computer para sa pagtatala.'
            : 'I recorded customer requests and organized spreadsheet records. I used a computer for record keeping.';
        $profile->workExperiences()->create(['job_title' => 'Records aide', 'company_name' => 'Synthetic test context', 'industry' => 'Services', 'employment_type' => 'Part-time', 'start_date' => '2025-01-01', 'end_date' => '2025-06-01', 'is_current' => false, 'description' => $facts]);
        $v = Vacancy::create(['title' => 'Records Assistant', 'organization' => 'Synthetic evaluation employer', 'location' => 'Mansalay', 'industry' => 'Services', 'employment_type' => 'Full-time', 'description' => 'Record customer requests and organize spreadsheet files. Required education should be confirmed with documents.', 'skills' => ['Computer Literacy'], 'slots' => 1, 'deadline' => today()->addMonth(), 'status' => 'published']);
        TrainingProgram::create(['title' => 'Basic Office Computers', 'provider' => 'Synthetic evaluation provider', 'location' => 'Mansalay', 'mode' => 'In person', 'description' => 'Practice basic computer records tasks.', 'requirements' => 'Discuss entry requirements with the provider.', 'skills' => ['Computer Literacy'], 'capacity' => 5, 'starts_on' => today()->addWeek(), 'ends_on' => today()->addMonth(), 'schedule' => 'Synthetic fixture schedule', 'fee' => 0, 'status' => 'published']);
        ResumeDocument::create(['user_id' => $u->id, 'filename' => 'synthetic-excerpt.pdf', 'path' => 'synthetic-excerpt-fixture-not-a-real-upload', 'excerpt' => $facts, 'detected' => []]);
        app(SemanticMatcher::class)->index();
        $body = ['vacancy_id' => $v->id, 'consent' => true, 'notice_version' => config('ai.notice_version'), 'language' => $language];
        $this->actingAs($u);
        $matching = $this->postJson('/api/platform/ai/semantic-matches', $body)->assertOk()->assertJsonPath('method', 'cohere-semantic-v1')->json();
        $advice = $this->postJson('/api/platform/ai/adviser', $body)->assertOk()->assertJsonPath('generated', true)->json();
        $review = $this->postJson('/api/platform/ai/resume-review', $body)->assertOk()->assertJsonPath('generated', true)->json();
        $practice = $this->postJson('/api/platform/ai/interviews', $body)->assertCreated()->json('data');
        for ($i = 1; $i <= 5; $i++) {
            $response = $this->postJson('/api/platform/ai/interviews/'.$practice['id'].'/answer', $body + ['version' => $practice['version'], 'answer' => $facts]);
            if ($response->status() !== 200) {
                $this->fail('Live '.$language.' answer '.$i.' returned '.$response->status().': '.$response->json('message'));
            }
            $practice = $response->assertOk()->json('data');
            $this->assertCount(4, $practice['transcript']['turns'][$i]['output']['feedback']);
        }
        $this->assertNotNull($practice['completed_at']);
        $this->assertNotEmpty($practice['transcript']['turns'][5]['output']['summary']);
        $directory = dirname(base_path()).'/.local/live-ai-verification';
        if (! is_dir($directory)) {
            mkdir($directory, 0700, true);
        }
        file_put_contents($directory.'/'.date('Ymd-His').'-'.$language.'.json', json_encode(['language' => $language, 'inputs' => ['synthetic_profile_facts' => $facts], 'inference' => 'actual Cohere API; no mocked responses', 'matching' => $matching, 'adviser' => $advice, 'resume' => $review, 'practice' => $practice, 'human_evaluation' => 'pending'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
    }
}
