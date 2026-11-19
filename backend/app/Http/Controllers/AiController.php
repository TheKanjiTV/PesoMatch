<?php

namespace App\Http\Controllers;

use App\Models\AiPractice;
use App\Models\Vacancy;
use App\Services\AiContext;
use App\Services\AiOutputs;
use App\Services\AiPrompts;
use App\Services\AiProvider;
use App\Services\SemanticMatcher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AiController extends Controller
{
    private function seeker(Request $r): void
    {
        abort_unless($r->user()->role === 'jobseeker', 403);
    }

    private function consent(Request $r): array
    {
        $this->seeker($r);

        return $r->validate(['consent' => 'required|accepted', 'notice_version' => 'required|in:'.config('ai.notice_version'), 'language' => 'required|in:en,fil', 'use_resume' => 'sometimes|boolean']);
    }

    private function vacancy(Request $r): Vacancy
    {
        $data = $r->validate(['vacancy_id' => 'required|integer|min:1']);

        return Vacancy::available()->where('is_sample', false)->findOrFail($data['vacancy_id']);
    }

    public function status(Request $r, AiProvider $ai)
    {
        $this->seeker($r);

        return response()->json(['configured' => $ai->configured(), 'provider' => 'Cohere', 'embedding_model' => config('ai.embedding_model'), 'language_model' => config('ai.language_model'), 'notice_version' => config('ai.notice_version'), 'notice' => 'With your consent, the selected vacancy and minimized profile facts are sent to Cohere. Resume review sends the redacted extracted excerpt; interview practice sends your answers. Names, email, phone and address fields are omitted, but free text can contain identifiers: review it first. Do not include confidential information. Practice transcripts are encrypted and expire after 7 days. Suggestions are not verified qualifications or hiring decisions. Provider processing follows Cohere terms and privacy policy.', 'provider_privacy_url' => 'https://cohere.com/privacy']);
    }

    public function semantic(Request $r, SemanticMatcher $matcher)
    {
        $this->consent($r);
        $page = $r->validate(['page' => 'sometimes|integer|min:1|max:10000'])['page'] ?? 1;

        return response()->json($matcher->rank($r->user(), $page));
    }

    public function adviser(Request $r, AiProvider $ai, AiContext $context)
    {
        $options = $this->consent($r);
        $v = $this->vacancy($r);
        $evidence = $context->profile($r->user());
        if ($options['use_resume'] ?? false) {
            $evidence[] = $context->resume($r->user());
        }
        $training = $context->training($v);
        $out = $ai->generate(AiPrompts::adviser(), ['profile_evidence' => $evidence, 'vacancy' => $context->vacancy($v), 'training_records' => $training], AiOutputs::adviser(array_column($evidence, 'id')), AiOutputs::rules('adviser'), $options['language']);
        AiOutputs::groundEvidence($out, $evidence, $training);
        $out['training'] = collect($training)->whereIn('id', $out['training_ids'])->map(fn ($p) => $p + ['url' => '/training/'.$p['id']])->values();

        return response()->json(['data' => $out, 'model' => config('ai.language_model'), 'generated' => true]);
    }

    public function resume(Request $r, AiProvider $ai, AiContext $context)
    {
        $options = $this->consent($r);
        $v = $this->vacancy($r);
        $resume = $context->resume($r->user());
        $facts = $r->validate(['additional_facts' => 'nullable|string|max:3000'])['additional_facts'] ?? '';
        $facts = $context->redact($facts, $r->user());
        $out = $ai->generate(AiPrompts::resume(), ['resume' => $resume, 'additional_facts' => $facts, 'vacancy' => $context->vacancy($v)], AiOutputs::resume(), AiOutputs::rules('resume'), $options['language']);
        $out = AiOutputs::acceptedRevisions($out, $resume['text'], $resume['text'].' '.$facts);

        return response()->json(['data' => $out, 'scope' => $resume['scope'], 'model' => config('ai.language_model'), 'generated' => true]);
    }

    public function start(Request $r, AiProvider $ai, AiContext $context)
    {
        $options = $this->consent($r);
        $v = $this->vacancy($r);
        $input = ['profile_evidence' => $context->profile($r->user()), 'vacancy' => $context->vacancy($v), 'conversation' => []];
        $out = $ai->generate(AiPrompts::interview(0), $input, AiOutputs::interview(), AiOutputs::rules('interview'), $options['language']);
        abort_unless(filled($out['question']) && substr_count($out['question'], '?') <= 1 && count($out['feedback']) === 0 && empty($out['summary']), 502, 'Invalid opening interview response.');
        $practice = AiPractice::create(['user_id' => $r->user()->id, 'vacancy_id' => $v->id, 'language' => $options['language'], 'model' => config('ai.language_model'), 'transcript' => ['context' => $input, 'turns' => [['output' => $out]]], 'expires_at' => now()->addDays(7)]);

        return response()->json(['data' => $practice->refresh(), 'generated' => true], 201);
    }

    public function show(Request $r, AiPractice $practice)
    {
        $this->seeker($r);
        abort_unless($practice->user_id === $r->user()->id, 403);
        abort_if($practice->expires_at->isPast(), 410, 'This practice session expired. Start a new session.');

        return response()->json(['data' => $practice]);
    }

    public function answer(Request $r, AiPractice $practice, AiProvider $ai, AiContext $context)
    {
        $this->consent($r);
        abort_unless($practice->user_id === $r->user()->id, 403);
        abort_if($practice->expires_at->isPast() || $practice->completed_at, 409, 'This practice session ended or expired.');
        $data = $r->validate(['answer' => 'required|string|min:3|max:3000', 'version' => 'required|integer|min:1']);
        abort_unless($data['version'] === $practice->version, 409, 'This session changed. Reload the practice before answering again.');
        $transcript = $practice->transcript;
        $answer = $context->redact($data['answer'], $r->user());
        $conversation = array_map(fn ($turn) => ['question' => $turn['output']['question'], 'answer' => $turn['answer'] ?? null], $transcript['turns']);
        $conversation[count($conversation) - 1]['answer'] = $answer;
        $answered = count($conversation);
        $out = $ai->generate(AiPrompts::interview($answered), array_replace($transcript['context'], ['conversation' => $conversation]), AiOutputs::interview($answered >= 5), AiOutputs::rules('interview'), $practice->language);
        abort_unless(count($out['feedback']) === 4 && substr_count($out['question'] ?? '', '?') <= 1, 502, 'Incomplete interview rubric feedback.');
        foreach ($out['feedback'] as $f) {
            abort_unless(empty($f['evidence_quote']) || str_contains($answer, $f['evidence_quote']), 502, 'Interview feedback evidence could not be verified.');
        }
        abort_unless($answered >= 5 ? filled($out['summary']) && empty($out['question']) : filled($out['question']), 502, 'The interview response did not follow the practice sequence.');

        return DB::transaction(function () use ($practice, $data, $transcript, $answer, $out, $answered) {
            $row = AiPractice::whereKey($practice->id)->lockForUpdate()->firstOrFail();
            abort_unless($row->version === $data['version'] && ! $row->completed_at && $row->expires_at->isFuture(), 409, 'This session changed. Reload it before answering.');
            $transcript['turns'][count($transcript['turns']) - 1]['answer'] = $answer;
            $transcript['turns'][] = ['output' => $out];
            $row->update(['transcript' => $transcript, 'version' => $row->version + 1, 'completed_at' => $answered >= 5 ? now() : null]);

            return response()->json(['data' => $row, 'generated' => true]);
        });
    }

    public function destroy(Request $r, AiPractice $practice)
    {
        $this->seeker($r);
        abort_unless($practice->user_id === $r->user()->id, 403);
        $practice->delete();

        return response()->noContent();
    }
}
