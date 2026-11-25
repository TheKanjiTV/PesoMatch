<?php

namespace Tests\Feature;

use App\Models\Referral;
use App\Models\Skill;
use App\Models\User;
use App\Models\Vacancy;
use App\Services\AiOutputs;
use App\Services\AiPrompts;
use App\Services\AiProvider;
use App\Services\SemanticMatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WorkspaceRefinementTest extends TestCase
{
    use RefreshDatabase;

    private function vacancy(): Vacancy
    {
        return Vacancy::create(['title' => 'Records Assistant', 'organization' => 'Synthetic Employer', 'location' => 'Mansalay', 'industry' => 'Services', 'employment_type' => 'Full-time', 'description' => 'Maintain computer records.', 'skills' => ['Computer Literacy'], 'slots' => 2, 'deadline' => today()->addMonth(), 'status' => 'published']);
    }

    public function test_four_step_request_validates_saves_and_is_visible_to_planning_staff(): void
    {
        $user = User::factory()->create();
        $data = ['wizard_completed' => true, 'topic' => 'Computer Literacy', 'description' => 'Learn to maintain digital records.', 'preferred_start' => today()->addWeek()->toDateString(), 'preferred_end' => today()->addMonth()->toDateString(), 'preferred_schedule' => 'Saturday mornings', 'mode' => 'Online', 'location' => 'Mansalay', 'goal' => 'Prepare for office work.'];
        $this->actingAs($user)->postJson('/api/v1/platform/training-demands', ['wizard_completed' => true, 'topic' => 'Computer Literacy'])->assertUnprocessable()->assertJsonValidationErrors(['description', 'preferred_start', 'goal']);
        $this->postJson('/api/v1/platform/training-demands', array_replace($data, ['preferred_end' => today()->toDateString()]))->assertUnprocessable();
        $this->postJson('/api/v1/platform/training-demands', $data)->assertCreated();
        $this->getJson('/api/v1/platform/training-demands')->assertOk()->assertJsonPath('data.0.preferred_schedule', 'Saturday mornings');
        // Existing catalog interest actions must not erase a completed request.
        $this->postJson('/api/v1/platform/training-demands', ['topic' => 'Computer Literacy'])->assertCreated();
        $this->assertDatabaseCount('training_demands', 1);
        $this->assertDatabaseHas('training_demands', ['user_id' => $user->id, 'goal' => $data['goal']]);
        $this->actingAs(User::factory()->create(['role' => 'peso_staff']))->getJson('/api/v1/platform/training-demands?topic_key=computer%20literacy')->assertOk()->assertJsonPath('data.0.description', $data['description']);
        $this->assertDatabaseHas('audit_events', ['action' => 'training.topic_requested', 'actor_id' => $user->id]);
        $this->assertDatabaseCount('enrollments', 0);
    }

    public function test_only_staff_enable_and_record_optional_results_after_an_interview(): void
    {
        $job = User::factory()->create();
        $staff = User::factory()->create(['role' => 'peso_staff']);
        $referral = Referral::create(['user_id' => $job->id, 'vacancy_id' => $this->vacancy()->id, 'status' => 'interviewing', 'consent' => true, 'match_snapshot' => [], 'interview_at' => now()->addDay()]);
        $url = '/api/v1/platform/referrals/'.$referral->id.'/interview-outcome';
        $this->actingAs($job)->patchJson($url, ['enabled' => true])->assertForbidden();
        $this->actingAs(User::factory()->create(['role' => 'employer']))->patchJson($url, ['enabled' => true])->assertForbidden();
        $this->actingAs($staff)->patchJson($url, ['enabled' => true])->assertUnprocessable();
        $referral->update(['interview_at' => now()->subHour()]);
        $this->patchJson($url, ['enabled' => true, 'result' => 'accepted', 'notes' => 'Employer confirmed the interview decision.'])->assertOk()->assertJsonPath('data.interview_result', 'accepted');
        $this->assertSame('interviewing', $referral->fresh()->status);
        $this->actingAs($job)->getJson('/api/v1/platform/referrals')->assertOk()->assertJsonPath('data.0.outcome_enabled', true)->assertJsonPath('data.0.interview_result', 'accepted');
        $this->actingAs($staff)->patchJson($url, ['enabled' => false])->assertOk();
        $this->actingAs($job)->getJson('/api/v1/platform/referrals')->assertOk()->assertJsonMissingPath('data.0.interview_result');
        $this->assertDatabaseHas('audit_events', ['action' => 'referral.interview_outcome_updated', 'actor_id' => $staff->id]);
    }

    public function test_vacancies_include_count_vector_percent_and_opt_in_embeddings_supply_actual_cosine_percent(): void
    {
        Http::preventStrayRequests();
        config(['ai.enabled' => true, 'ai.key' => 'synthetic-only']);
        $job = User::factory()->create();
        $job->jobseekerProfile()->create()->skills()->attach(Skill::create(['name' => 'Computer Literacy']));
        $v = $this->vacancy();
        $this->actingAs($job)->getJson('/api/v1/platform/vacancies')->assertOk()->assertJsonPath('data.0.assessment.method', 'count-vector-cosine-v1');
        Http::assertNothingSent();
        $payload = ['vacancy_ids' => [$v->id], 'consent' => true, 'notice_version' => config('ai.notice_version'), 'language' => 'en'];
        $this->postJson('/api/v1/platform/ai/vacancy-matches', array_replace($payload, ['consent' => false]))->assertUnprocessable();
        $a = array_fill(0, 1024, 0);
        $a[0] = 1;
        $b = array_fill(0, 1024, 0);
        $b[0] = .6;
        $b[1] = .8;
        $matcher = app(SemanticMatcher::class);
        $matcher->save('vacancy', $v->id, $matcher->text($v), $b);
        Http::fake(['api.cohere.com/v2/embed' => fn ($r) => Http::response(['embeddings' => ['float' => array_fill(0, count($r['texts']), $a)]])]);
        $this->postJson('/api/v1/platform/ai/vacancy-matches', $payload)->assertOk()->assertJsonPath('scores.'.$v->id, 60);
        $this->postJson('/api/v1/platform/ai/vacancy-matches', $payload)->assertOk();
        Http::assertSentCount(1);
    }

    public function test_adviser_retries_a_response_that_exceeds_the_question_limit(): void
    {
        config(['ai.enabled' => true, 'ai.key' => 'synthetic-only']);
        $out = ['relevant_evidence' => [], 'not_stated' => [], 'questions' => array_fill(0, 9, 'Which tools have you used?'), 'steps' => [], 'training_ids' => []];
        $response = fn ($out) => ['finish_reason' => 'COMPLETE', 'message' => ['content' => [['type' => 'text', 'text' => json_encode($out)]]]];
        Http::fake(['api.cohere.com/v2/chat' => Http::sequence()->push($response($out))->push($response(array_replace($out, ['questions' => array_slice($out['questions'], 0, 8)])))]);
        $result = app(AiProvider::class)->generate(AiPrompts::adviser(), [], AiOutputs::adviser(), AiOutputs::rules('adviser'), 'en');
        $this->assertCount(8, $result['questions']);
        Http::assertSentCount(2);
    }

    public function test_profile_reports_saved_experience_even_when_the_legacy_flag_is_false(): void
    {
        $user = User::factory()->create();
        $profile = $user->jobseekerProfile()->create(['has_work_experience' => false]);
        $profile->workExperiences()->create(['job_title' => 'Records Assistant', 'company_name' => 'Synthetic Office', 'start_date' => '2025-01-01', 'end_date' => '2025-06-01', 'is_current' => false]);
        $this->actingAs($user)->getJson('/api/v1/jobseeker/profile')->assertOk()->assertJsonPath('data.work_experience.has_experience', true)->assertJsonPath('data.work_experience.experiences.0.job_title', 'Records Assistant');
        $new = User::factory()->create();
        $this->actingAs($new)->getJson('/api/v1/jobseeker/profile')->assertOk()->assertJsonPath('data.work_experience.has_experience', null);
    }
}
