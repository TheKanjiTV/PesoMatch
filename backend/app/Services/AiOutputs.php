<?php

namespace App\Services;

use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class AiOutputs
{
    public static function string(): array
    {
        return ['type' => 'string'];
    }

    public static function strings(): array
    {
        return ['type' => 'array', 'items' => self::string()];
    }

    public static function object(array $properties): array
    {
        return ['type' => 'object', 'properties' => $properties, 'required' => array_keys($properties), 'additionalProperties' => false];
    }

    public static function items(array $properties): array
    {
        return ['type' => 'array', 'items' => self::object($properties)];
    }

    public static function adviser(array $evidenceIds = []): array
    {
        $idType = self::string();
        if ($evidenceIds) {
            $idType['enum'] = array_values($evidenceIds);
        }

        return self::object(['relevant_evidence' => self::items(['evidence_id' => $idType, 'relevance' => self::string()]), 'not_stated' => self::strings(), 'questions' => self::strings(), 'steps' => self::strings(), 'training_ids' => ['type' => 'array', 'items' => ['type' => 'integer']]]);
    }

    public static function resume(): array
    {
        return self::object(['relevance' => self::string(), 'clarity' => self::string(), 'completeness' => self::string(), 'questions' => self::strings(), 'suggestions' => self::items(['original' => self::string(), 'revision' => self::string(), 'reason' => self::string()])]);
    }

    public static function interview(bool $final = false): array
    {
        return self::object(['question' => $final ? ['type' => 'string', 'enum' => ['']] : self::string(), 'feedback' => self::items(['criterion' => ['type' => 'string', 'enum' => ['relevance', 'clarity', 'specific_examples', 'organization']], 'score' => ['type' => 'integer', 'enum' => [1, 2, 3, 4]], 'evidence_quote' => self::string(), 'comment' => self::string()]), 'improvement' => self::string(), 'summary' => self::string()]);
    }

    public static function rules(string $kind): array
    {
        if ($kind === 'adviser') {
            return [
                'relevant_evidence' => 'present|array|max:15', 'relevant_evidence.*' => 'array:evidence_id,relevance',
                'relevant_evidence.*.evidence_id' => 'required|string|max:80', 'relevant_evidence.*.relevance' => 'required|string|max:1000',
                'not_stated' => 'present|array|max:15', 'not_stated.*' => 'required|string|max:1000',
                'questions' => 'present|array|max:8', 'questions.*' => 'required|string|max:1000',
                'steps' => 'present|array|max:10', 'steps.*' => 'required|string|max:1000',
                'training_ids' => 'present|array|max:12', 'training_ids.*' => 'integer|distinct',
            ];
        }
        if ($kind === 'resume') {
            return [
                'relevance' => 'required|string|max:2000', 'clarity' => 'required|string|max:2000', 'completeness' => 'required|string|max:2000',
                'questions' => 'present|array|max:8', 'questions.*' => 'required|string|max:1000',
                'suggestions' => 'present|array|max:8', 'suggestions.*' => 'array:original,revision,reason',
                'suggestions.*.original' => 'required|string|max:1500', 'suggestions.*.revision' => 'required|string|max:1500', 'suggestions.*.reason' => 'required|string|max:1000',
            ];
        }

        return ['question' => 'present|nullable|string|max:1500', 'feedback' => 'present|array|max:4', 'feedback.*' => 'array:criterion,score,evidence_quote,comment', 'feedback.*.criterion' => 'required|in:relevance,clarity,specific_examples,organization|distinct', 'feedback.*.score' => 'required|integer|min:1|max:4', 'feedback.*.evidence_quote' => 'present|nullable|string|max:1200', 'feedback.*.comment' => 'required|string|max:1200', 'improvement' => 'present|nullable|string|max:2000', 'summary' => 'present|nullable|string|max:3000'];
    }

    public static function groundEvidence(array &$output, array $evidence, array $training): void
    {
        $byId = collect($evidence)->keyBy('id');
        foreach ($output['relevant_evidence'] as $index => $item) {
            abort_unless(isset($byId[$item['evidence_id']]), 502, 'AI returned an evidence source outside your submitted information.');
            // The quote comes from the actual server-owned source, never model transcription.
            $output['relevant_evidence'][$index]['quote'] = $byId[$item['evidence_id']]['text'];
        }
        abort_if(array_diff($output['training_ids'], array_column($training, 'id')), 502, 'AI returned a training record outside the supplied catalog.');
    }

    public static function groundRevisions(array $output, string $resume, string $facts): void
    {
        foreach ($output['suggestions'] as $s) {
            abort_unless(str_contains($resume, $s['original']), 502, 'AI quoted a statement that is not in your extracted resume.');
            // Constrained editing: content words must come from this statement or user facts.
            // This is a guard, not proof of semantic entailment; the user still reviews each edit.
            $tokens = fn ($text) => preg_split('/[^\pL\pN]+/u', mb_strtolower($text), -1, PREG_SPLIT_NO_EMPTY);
            $connectives = $tokens('a an the and or but for with to in of on at by as from that which this these those is are was were be been being have has had i my we our it its through during while ang ng mga sa at o ay na nang para kasama gamit ako ko kami namin ito iyon isang ni bilang mula kung kapag');
            $allowed = array_merge($tokens($s['original']), $tokens($facts), $connectives);
            abort_if(array_diff($tokens($s['revision']), $allowed), 502, 'A proposed rewrite added unsupported wording. Answer the follow-up questions with concrete facts and try again.');
            foreach (['no', 'not', 'never', 'without', 'hindi', 'wala', 'walang'] as $negative) {
                if (in_array($negative, $tokens($s['original']), true)) {
                    abort_unless(in_array($negative, $tokens($s['revision']), true), 502, 'A proposed rewrite changed a negative statement. Please review your facts.');
                }
            }
            // Reject new numerical claims; semantic fact preservation still requires user/reviewer judgment.
            preg_match_all('/\d+(?:[.,]\d+)?%?/', $s['revision'], $numbers);
            foreach ($numbers[0] as $number) {
                abort_unless(str_contains($facts, $number), 502, 'AI introduced an unsupported numerical claim.');
            }
        }
    }

    public static function acceptedRevisions(array $output, string $resume, string $facts): array
    {
        $accepted = [];
        $rejected = 0;
        foreach ($output['suggestions'] as $suggestion) {
            try {
                self::groundRevisions(['suggestions' => [$suggestion]], $resume, $facts);
                $accepted[] = $suggestion;
            } catch (HttpExceptionInterface $e) {
                if ($e->getStatusCode() !== 502) {
                    throw $e;
                }
                $rejected++;
            }
        }
        $output['suggestions'] = $accepted;
        $output['rejected_suggestions'] = $rejected;

        return $output;
    }
}
