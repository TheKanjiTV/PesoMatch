<?php

namespace App\Services;

use App\Models\TableSetting;
use App\Models\TrainingProgram;
use App\Models\User;
use App\Models\Vacancy;

/** Profile/vacancy vector relevance. Never makes hiring decisions. */
class EmploymentMatcher
{
    private function tokens(string $text): array
    {
        $words = preg_split('/[^\pL\pN]+/u', mb_strtolower($text), -1, PREG_SPLIT_NO_EMPTY);

        return array_values(array_diff($words, ['the', 'and', 'for', 'with', 'a', 'an', 'of', 'to', 'in', 'is', 'on', 'at']));
    }

    public function assess(User $user, Vacancy $vacancy, ?array $corpus = null, ?array $weights = null): array
    {
        $profile = $user->jobseekerProfile;
        $own = $profile?->skills->pluck('name')->all() ?? [];
        $required = $vacancy->skills ?? [];
        $matched = array_values(array_filter($required, fn ($skill) => in_array(mb_strtolower($skill), array_map('mb_strtolower', $own), true)));
        $missing = array_values(array_diff($required, $matched));
        // Count-vector cosine is the local option. No inverse document frequency
        // or fixed skill/text weighting is used. Semantic embeddings are opt-in.
        $facts = app(AiContext::class)->profile($user);
        $preferences = $profile?->preferences;
        $query = implode(' ', array_merge(array_column($facts, 'text'), $preferences?->occupations->pluck('value')->all() ?? [], [$preferences?->preferred_industry ?? '']));
        $document = $vacancy->title.' '.$vacancy->industry.' '.$vacancy->description.' '.implode(' ', $required);
        $a = array_count_values($this->tokens($query));
        $b = array_count_values($this->tokens($document));
        $dot = $aa = $bb = 0.0;
        foreach (array_unique(array_merge(array_keys($a), array_keys($b))) as $token) {
            $x = $a[$token] ?? 0;
            $y = $b[$token] ?? 0;
            $dot += $x * $y;
            $aa += $x * $x;
            $bb += $y * $y;
        }

        return ['score' => (int) round(100 * ($aa && $bb ? $dot / sqrt($aa * $bb) : 0)), 'matched_skills' => $matched, 'missing_skills' => $missing, 'profile_incomplete' => ! $profile?->profile_completed_at, 'method' => 'count-vector-cosine-v1', 'explanation' => 'Profile-to-vacancy vector similarity.'];
    }

    public function recommendations(User $user, int $page = 1, ?int $perPage = null, ?array $semanticScores = null, $candidateSet = null): array
    {
        $configured = TableSetting::perPage();
        $perPage = max(1, min($perPage ?? $configured, $configured));
        $vacancies = $candidateSet ?? Vacancy::available()->where('is_sample', false)->orderBy('id')->get();
        // Keep the national directory out of the full-model hot path. Only
        // topic IDs are indexed, and only returned suggestions are hydrated.
        $programs = TrainingProgram::available()->where('is_sample', false)->orderBy('id')->get(['id', 'skills']);
        $bySkill = [];
        foreach ($programs as $program) {
            foreach ($program->skills as $skill) {
                $bySkill[mb_strtolower($skill)][$program->id] = true;
            }
        }
        $ranked = $vacancies->map(function ($v) use ($user, $semanticScores) {
            $assessment = $this->assess($user, $v);
            if ($semanticScores !== null) {
                $assessment['score'] = (int) round(100 * max(0, $semanticScores[$v->id]));
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

        return ['matches' => $matches, 'training' => $training, 'method' => 'count-vector-cosine-v1',
            'current_page' => $page, 'last_page' => $lastPage, 'per_page' => $perPage, 'total' => $ranked->count(), 'training_total' => $programs->count()];
    }
}
