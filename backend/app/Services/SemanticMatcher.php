<?php

namespace App\Services;

use App\Models\User;
use App\Models\Vacancy;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class SemanticMatcher
{
    public function __construct(private AiProvider $ai, private AiContext $context) {}

    public function text(Vacancy $v): string
    {
        return json_encode($this->context->vacancy($v), JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    }

    public function hash(string $text): string
    {
        return hash('sha256', 'semantic-v2-byte480-meanpool:'.$text);
    }

    public function save(string $type, int $id, string $text, array $vector): void
    {
        DB::table('ai_embeddings')->upsert([['source_type' => $type, 'source_id' => $id, 'model' => config('ai.embedding_model'), 'content_hash' => $this->hash($text), 'vector' => Crypt::encryptString(json_encode($vector, JSON_THROW_ON_ERROR)), 'created_at' => now(), 'updated_at' => now()]], ['source_type', 'source_id', 'model'], ['content_hash', 'vector', 'updated_at']);
    }

    public function index(?callable $progress = null): int
    {
        $count = 0;
        Vacancy::available()->where('is_sample', false)->orderBy('id')->chunkById(48, function ($rows) use (&$count, $progress) {
            $cached = DB::table('ai_embeddings')->where('source_type', 'vacancy')->where('model', config('ai.embedding_model'))->whereIn('source_id', $rows->pluck('id'))->pluck('content_hash', 'source_id');
            $changed = $rows->filter(fn ($v) => ($cached[$v->id] ?? null) !== $this->hash($this->text($v)))->values();
            if (! $changed->count()) {
                return;
            }
            $vectors = $this->ai->embedDocuments($changed->map(fn ($v) => $this->text($v))->all(), 'search_document');
            foreach ($changed as $i => $v) {
                $this->save('vacancy', $v->id, $this->text($v), $vectors[$i]);
                $count++;
            }
            $progress && $progress($count);
        });

        return $count;
    }

    public static function cosine(array $a, array $b): float
    {
        $dot = $aa = $bb = 0.0;
        foreach ($a as $i => $x) {
            $y = $b[$i];
            $dot += $x * $y;
            $aa += $x * $x;
            $bb += $y * $y;
        }

        return $aa && $bb ? max(-1, min(1, $dot / sqrt($aa * $bb))) : 0;
    }

    public function scores(User $user, $vacancies): array
    {
        abort_unless($this->ai->configured(), 503, 'AI matching is currently unavailable. Please retry later.');
        $facts = $this->context->profile($user);
        abort_unless(count($facts), 422, 'Add skills, education or work experience to your profile first.');
        $text = json_encode($facts, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $cached = DB::table('ai_embeddings')->where('source_type', 'profile')->where('source_id', $user->id)->where('model', config('ai.embedding_model'))->first();
        if (! $cached || $cached->content_hash !== $this->hash($text)) {
            $vector = $this->ai->embedDocuments([$text], 'search_query')[0];
            $this->save('profile', $user->id, $text, $vector);
        } else {
            $vector = json_decode(Crypt::decryptString($cached->vector), true, 2048, JSON_THROW_ON_ERROR);
        }
        $cache = DB::table('ai_embeddings')->where('source_type', 'vacancy')->where('model', config('ai.embedding_model'))->whereIn('source_id', $vacancies->pluck('id'))->get()->keyBy('source_id');
        $changed = $vacancies->filter(fn ($v) => ! isset($cache[$v->id]) || $cache[$v->id]->content_hash !== $this->hash($this->text($v)))->values();
        abort_if($changed->count() > 20, 503, 'Vacancy matching is being updated. Please retry later.');
        if ($changed->isNotEmpty()) {
            $vectors = $this->ai->embedDocuments($changed->map(fn ($v) => $this->text($v))->all(), 'search_document');
            foreach ($changed as $i => $v) {
                $this->save('vacancy', $v->id, $this->text($v), $vectors[$i]);
                $cache[$v->id] = (object) ['vector' => Crypt::encryptString(json_encode($vectors[$i], JSON_THROW_ON_ERROR))];
            }
        }
        $scores = [];
        foreach ($vacancies as $v) {
            $scores[$v->id] = (int) round(100 * max(0, self::cosine($vector, json_decode(Crypt::decryptString($cache[$v->id]->vector), true, 2048, JSON_THROW_ON_ERROR))));
        }

        return $scores;
    }

    public function rank(User $user, int $page): array
    {
        abort_unless($this->ai->configured(), 503, 'AI matching is currently unavailable.');
        $vacancies = Vacancy::available()->where('is_sample', false)->orderBy('id')->get();
        $cache = DB::table('ai_embeddings')->where('source_type', 'vacancy')->where('model', config('ai.embedding_model'))->whereIn('source_id', $vacancies->pluck('id'))->get()->keyBy('source_id');
        $stale = $vacancies->filter(fn ($v) => ! isset($cache[$v->id]) || $cache[$v->id]->content_hash !== $this->hash($this->text($v)));
        // Never silently rank just the indexed subset of a changing catalog.
        abort_if($stale->count(), 503, 'Vacancy matching is being updated. Please retry later.');
        $facts = $this->context->profile($user);
        abort_unless(count($facts), 422, 'Add skills, education or experience to your profile first.');
        $text = json_encode($facts, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $cached = DB::table('ai_embeddings')->where('source_type', 'profile')->where('source_id', $user->id)->where('model', config('ai.embedding_model'))->first();
        if (! $cached || $cached->content_hash !== $this->hash($text)) {
            $vector = $this->ai->embedDocuments([$text], 'search_query')[0];
            $this->save('profile', $user->id, $text, $vector);
        } else {
            $vector = json_decode(Crypt::decryptString($cached->vector), true, 2048, JSON_THROW_ON_ERROR);
        }
        $scores = [];
        foreach ($vacancies as $v) {
            $scores[$v->id] = round(self::cosine($vector, json_decode(Crypt::decryptString($cache[$v->id]->vector), true, 2048, JSON_THROW_ON_ERROR)), 4);
        }
        unset($cache);
        // Reuse the baseline corpus and training workflow; hydrate training only
        // for this result page, not every candidate in the entire catalog.
        $result = app(EmploymentMatcher::class)->recommendations($user, $page, null, $scores, $vacancies);

        return array_replace($result, ['method' => 'cohere-semantic-v1', 'model' => config('ai.embedding_model'), 'notice' => 'Cosine relevance (-1 to 1), not hiring probability. Explicit qualifications are separate and unverified.']);
    }
}
