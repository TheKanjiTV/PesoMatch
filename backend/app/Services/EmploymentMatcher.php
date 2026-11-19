<?php

namespace App\Services;

use App\Models\TrainingProgram;
use App\Models\User;
use App\Models\Vacancy;

/** Explainable content-based recommendation baseline. Never makes hiring decisions. */
class EmploymentMatcher
{
    private function tokens(string $text): array
    {
        $words = preg_split('/[^\pL\pN]+/u', mb_strtolower($text), -1, PREG_SPLIT_NO_EMPTY);

        return array_values(array_diff($words, ['the', 'and', 'for', 'with', 'a', 'an', 'of', 'to', 'in', 'is', 'on', 'at']));
    }

    private function weights(array $corpus): array
    {
        $frequencies = [];
        foreach ($corpus as $document) {
            foreach (array_unique($this->tokens($document)) as $token) {
                $frequencies[$token] = ($frequencies[$token] ?? 0) + 1;
            }
        }

        return ['documents' => count($corpus), 'frequencies' => $frequencies];
    }

    public function assess(User $user, Vacancy $vacancy, ?array $corpus = null, ?array $weights = null): array
    {
        $profile = $user->jobseekerProfile;
        $own = $profile?->skills->pluck('name')->all() ?? [];
        $required = $vacancy->skills ?? [];
        $matched = array_values(array_filter($required, fn ($s) => in_array(mb_strtolower($s), array_map('mb_strtolower', $own), true)));
        $missing = array_values(array_diff($required, $matched));
        $preferences = $profile?->preferences;
        $query = implode(' ', array_merge($own, $preferences?->occupations->pluck('value')->all() ?? [], [$preferences?->preferred_industry ?? '']));
        $document = $vacancy->title.' '.$vacancy->industry.' '.$vacancy->description.' '.implode(' ', $required);
        if ($weights === null) {
            $corpus ??= Vacancy::currentSource()->where('status', 'published')->get()->map(fn ($v) => $v->title.' '.$v->industry.' '.$v->description.' '.implode(' ', $v->skills))->all();
            $weights = $this->weights($corpus);
        }
        $a = array_count_values($this->tokens($query));
        $b = array_count_values($this->tokens($document));
        $dot = $normA = $normB = 0.0;
        foreach (array_unique(array_merge(array_keys($a), array_keys($b))) as $token) {
            $df = $weights['frequencies'][$token] ?? 0;
            $idf = log(($weights['documents'] + 1) / ($df + 1)) + 1;
            $x = ($a[$token] ?? 0) * $idf;
            $y = ($b[$token] ?? 0) * $idf;
            $dot += $x * $y;
            $normA += $x * $x;
            $normB += $y * $y;
        }
        $similarity = $normA && $normB ? $dot / sqrt($normA * $normB) : 0;
        $coverage = count($required) ? count($matched) / count($required) : 0;

        return ['score' => (int) round(100 * (.75 * $coverage + .25 * $similarity)), 'matched_skills' => $matched, 'missing_skills' => $missing, 'profile_incomplete' => ! $profile?->profile_completed_at, 'method' => 'content-based-tfidf-v1', 'explanation' => '75% declared skill coverage + 25% TF-IDF profile/occupation similarity. Advisory only; PESO reviews referrals and employers decide hiring.'];
    }

    public function recommendations(User $user, int $page = 1, int $perPage = 100, ?array $semanticScores = null, $candidateSet = null): array
    {
        $vacancies = $candidateSet ?? Vacancy::available()->where('is_sample', false)->orderBy('id')->get();
        $corpus = $vacancies->map(fn ($v) => $v->title.' '.$v->industry.' '.$v->description.' '.implode(' ', $v->skills))->all();
        // Compute corpus frequencies once, rather than rescanning every listing
        // for every token of every other listing as the public catalog grows.
        $weights = $this->weights($corpus);
        // Keep the national directory out of the full-model hot path. Only
        // topic IDs are indexed, and only returned suggestions are hydrated.
        $programs = TrainingProgram::available()->where('is_sample', false)->orderBy('id')->get(['id', 'skills']);
        $bySkill = [];
        foreach ($programs as $program) {
            foreach ($program->skills as $skill) {
                $bySkill[mb_strtolower($skill)][$program->id] = true;
            }
        }
        $ranked = $vacancies->map(function ($v) use ($user, $weights, $semanticScores) {
            $assessment = $this->assess($user, $v, null, $weights);
            if ($semanticScores !== null) {
                $assessment['baseline_score'] = $assessment['score'];
                $assessment['semantic_similarity'] = $semanticScores[$v->id];
                $assessment['method'] = 'cohere-semantic-v1';
                $assessment['qualification_status'] = 'Not assessed. Explicit education, licenses and other requirements need human evidence review.';
            }

            return ['vacancy' => $v, 'assessment' => $assessment];
        });
        $ranked = $semanticScores === null
            ? $ranked->sortByDesc('assessment.score')->values()
            : $ranked->sort(fn ($a, $b) => ($b['assessment']['semantic_similarity'] <=> $a['assessment']['semantic_similarity']) ?: ($a['vacancy']->id <=> $b['vacancy']->id))->values();
        $gaps = $ranked->take(5)->flatMap(fn ($m) => $m['assessment']['missing_skills'])->unique()->values()->all();
        $lastPage = max(1, (int) ceil($ranked->count() / $perPage));
        $page = max(1, $page);
        $summaries = $programs->keyBy('id');
        $needed = [];
        $matches = $ranked->slice(($page - 1) * $perPage, $perPage)->map(function ($match) use ($bySkill, $summaries, &$needed) {
            $missing = $match['assessment']['missing_skills'];
            $ids = [];
            foreach ($missing as $skill) {
                $ids += $bySkill[mb_strtolower($skill)] ?? [];
            }
            $training = collect(array_keys($ids))->sort()->map(function ($id) use ($missing, $summaries) {
                return ['id' => $id, 'addresses' => array_values(array_uintersect($summaries[$id]->skills, $missing, 'strcasecmp'))];
            })->sortByDesc(fn ($p) => count($p['addresses']))->values();
            $total = $training->count();
            $training = $training->take(8)->values();
            foreach ($training as $suggestion) {
                $needed[$suggestion['id']] = true;
            }

            return $match + ['training' => $training, 'training_total' => $total];
        })->values();
        $training = $programs->map(function ($program) use ($gaps) {
            $addresses = array_values(array_intersect($program->skills, $gaps));

            return ['id' => $program->id, 'addresses' => $addresses,
                'reason' => count($addresses) ? 'Builds skills requested in your recommended vacancies.' : 'Explore this program and confirm intake with its provider.'];
        })->sortByDesc(fn ($p) => count($p['addresses']))->take(100)->values();
        foreach ($training as $suggestion) {
            $needed[$suggestion['id']] = true;
        }
        $full = TrainingProgram::whereIn('id', array_keys($needed))->get()->keyBy('id');
        $hydrate = fn ($item) => ['program' => $full[$item['id']], 'addresses' => $item['addresses']] + (isset($item['reason']) ? ['reason' => $item['reason']] : []);
        $matches = $matches->map(function ($match) use ($hydrate) {
            $match['training'] = $match['training']->map($hydrate);

            return $match;
        });
        $training = $training->map($hydrate);

        return ['matches' => $matches, 'training' => $training, 'method' => 'content-based-tfidf-v1',
            'current_page' => $page, 'last_page' => $lastPage, 'per_page' => $perPage, 'total' => $ranked->count(), 'training_total' => $programs->count()];
    }
}
