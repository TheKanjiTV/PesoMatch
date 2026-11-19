<?php

namespace App\Console\Commands;

use App\Models\JobseekerProfile;
use App\Models\Skill;
use App\Models\User;
use App\Models\Vacancy;
use App\Services\AiOutputs;
use App\Services\AiPrompts;
use App\Services\AiProvider;
use App\Services\EmploymentMatcher;
use App\Services\SemanticMatcher;
use Illuminate\Console\Command;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class EvaluateEmploymentAi extends Command
{
    protected $signature = 'peso:ai-evaluate {--live : Allow external inference on synthetic cases; may incur provider charges} {--split=development : development or heldout}';

    protected $description = 'Collect real model outputs for four features without inventing reviewer ratings';

    public function handle(AiProvider $ai): int
    {
        if (! $this->option('live')) {
            $this->info('No inference performed. Use --live after configuring Cohere to collect outputs on synthetic data.');

            return self::SUCCESS;
        }
        if (! $ai->configured()) {
            $this->error('Blocked: configure AI_ENABLED=true and COHERE_API_KEY in backend environment. No live results or ratings were collected.');

            return self::FAILURE;
        }
        $split = $this->option('split');
        if (! in_array($split, ['development', 'heldout'], true)) {
            $this->error('Choose development or heldout.');

            return self::FAILURE;
        }
        $path = database_path('data/ai-evaluation-cases.json');
        $cases = json_decode(file_get_contents($path), true, 64, JSON_THROW_ON_ERROR)[$split];
        $report = ['collected_at' => now()->toIso8601String(), 'split' => $split, 'fixture_sha256' => hash_file('sha256', $path), 'embedding_model' => config('ai.embedding_model'), 'language_model' => config('ai.language_model'), 'source' => 'live Cohere inference on synthetic inputs', 'human_evaluation' => 'pending', 'accuracy' => null, 'reviewer_ratings' => null, 'cases' => []];
        foreach ($cases as $c) {
            $row = ['case_id' => $c['id'], 'language' => $c['language'], 'features' => []];
            try {
                $p = new JobseekerProfile;
                $p->forceFill(['profile_completed_at' => now()]);
                $p->setRelation('skills', collect($c['declared_skills'])->map(fn ($s) => new Skill(['name' => $s])));
                $p->setRelation('preferences', null);
                $u = new User;
                $u->setRelation('jobseekerProfile', $p);
                $docs = array_map(fn ($v) => new Vacancy($v + ['skills' => $v['required_skills']]), $c['candidates']);
                $corpus = array_map(fn ($v) => $v->title.' '.$v->industry.' '.$v->description.' '.implode(' ', $v->skills), $docs);
                $q = $ai->embedDocuments([json_encode($c['profile_evidence'], JSON_UNESCAPED_UNICODE)], 'search_query')[0];
                $vectors = $ai->embedDocuments(array_map(fn ($v) => json_encode($v, JSON_UNESCAPED_UNICODE), $c['candidates']), 'search_document');
                $ranking = [];
                foreach ($docs as $i => $v) {
                    $ranking[] = ['candidate_id' => $c['candidates'][$i]['id'], 'semantic_similarity' => SemanticMatcher::cosine($q, $vectors[$i]), 'baseline_score' => app(EmploymentMatcher::class)->assess($u, $v, $corpus)['score']];
                }
                $row['features']['matching'] = ['status' => 'live_output_collected', 'same_candidate_set' => true, 'scores' => $ranking, 'independent_relevance_judgments' => null];
            } catch (HttpExceptionInterface $e) {
                $row['features']['matching'] = ['status' => 'failed', 'message' => $e->getMessage()];
            }
            foreach (['adviser', 'resume', 'interview'] as $kind) {
                try {
                    $data = ['profile_evidence' => $c['profile_evidence'], 'vacancy' => $c['vacancy'], 'training_records' => $c['training_records'], 'resume' => $c['resume'], 'additional_facts' => $c['additional_facts']];
                    $task = $kind === 'interview' ? AiPrompts::interview(0) : AiPrompts::$kind();
                    $out = $ai->generate($task, $data, ($kind === 'adviser' ? AiOutputs::adviser(array_column($c['profile_evidence'], 'id')) : AiOutputs::$kind()), AiOutputs::rules($kind), $c['language']);
                    if ($kind === 'adviser') {
                        AiOutputs::groundEvidence($out, $c['profile_evidence'], $c['training_records']);
                    }
                    if ($kind === 'resume') {
                        $out = AiOutputs::acceptedRevisions($out, $c['resume']['text'], $c['resume']['text'].' '.$c['additional_facts']);
                    }
                    $row['features'][$kind] = ['status' => 'live_output_collected', 'output' => $out, 'human_review' => null];
                    if ($kind === 'interview') {
                        $data['conversation'] = [['question' => $out['question'], 'answer' => $c['interview_answer']]];
                        $feedback = $ai->generate(AiPrompts::interview(1), $data, AiOutputs::interview(), AiOutputs::rules('interview'), $c['language']);
                        abort_unless(count($feedback['feedback']) === 4 && filled($feedback['question']), 502, 'Incomplete interview response.');
                        foreach ($feedback['feedback'] as $f) {
                            abort_unless(empty($f['evidence_quote']) || str_contains($c['interview_answer'], $f['evidence_quote']), 502, 'Interview evidence check failed.');
                        }
                        $row['features'][$kind]['follow_up_output'] = $feedback;
                    }
                } catch (HttpExceptionInterface $e) {
                    $row['features'][$kind] = ['status' => 'failed', 'message' => $e->getMessage()];
                }
            }
            $report['cases'][] = $row;
            $this->info('Collected attempt for '.$c['id'].'. Human review remains pending.');
        }
        $directory = storage_path('app/private/ai-evaluations');
        if (! is_dir($directory)) {
            mkdir($directory, 0700, true);
        }
        $output = $directory.'/'.now()->format('Ymd-His').'-'.$split.'.json';
        file_put_contents($output, json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
        $this->info('Private output artifact: '.$output);
        $this->warn('Live outputs are not human validation or evidence of improvement. Rate both rankings blind to method.');

        return collect($report['cases'])->contains(fn ($row) => collect($row['features'])->contains(fn ($feature) => $feature['status'] === 'failed')) ? self::FAILURE : self::SUCCESS;
    }
}
