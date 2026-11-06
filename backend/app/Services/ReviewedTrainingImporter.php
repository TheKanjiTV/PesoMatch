<?php

namespace App\Services;

use App\Models\Skill;
use App\Models\TrainingProgram;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ReviewedTrainingImporter
{
    public function importCatalog(string $catalog): array
    {
        $started = now()->startOfSecond();

        return DB::transaction(function () use ($catalog, $started) {
            $count = $this->import($this->rows($catalog));
            $names = ['online' => 'TESDA Online Program', 'registered' => TrainingSources::REGISTERED, 'international' => TrainingSources::OVERSEAS];
            $selected = $catalog === 'all' ? array_values($names) : [$names[$catalog]];
            // A complete reviewed snapshot can withdraw a source record, but
            // must never delete enrollment history or alter an owned program.
            $retired = TrainingProgram::where('external_enrollment', true)->whereNull('owner_id')
                ->whereIn('source_name', $selected)->where('updated_at', '<', $started)
                ->where('status', 'published')->update(['status' => 'draft']);

            return ['imported' => $count, 'retired' => $retired];
        });
    }

    public function rows(string $catalog): \Generator
    {
        if (in_array($catalog, ['all', 'online'], true)) {
            foreach (json_decode(file_get_contents(database_path('data/verified-training.json')), true, 512, JSON_THROW_ON_ERROR) as $row) {
                yield $row + ['provider' => 'TESDA Online Program', 'location' => 'Online · remote access', 'mode' => 'Online', 'fee' => 0,
                    'requirements' => 'Create an account on the official TESDA Online Program website and review the course prerequisites. Course completion is not an automatic National Certificate.', 'schedule' => 'Self-paced · see official source'];
            }
        }
        if (in_array($catalog, ['all', 'registered'], true)) {
            $holds = json_decode(file_get_contents(database_path('data/verified-training-closure-holds.json')), true, 512, JSON_THROW_ON_ERROR);
            $normalize = fn ($value) => preg_replace('/[^a-z0-9]/', '', mb_strtolower($value));
            $held = [];
            foreach ($holds as $hold) {
                $held[$normalize($hold['provider']).'|'.$normalize($hold['title'])] = true;
            }
            $stream = fopen(database_path('data/verified-training-registry.jsonl'), 'rb');
            try {
                while (($line = fgets($stream)) !== false) {
                    if (trim($line) !== '') {
                        $row = json_decode($line, true, 512, JSON_THROW_ON_ERROR);
                        if (! isset($held[$normalize($row['provider']).'|'.$normalize($row['title'])])) {
                            yield $row;
                        }
                    }
                }
            } finally {
                fclose($stream);
            }
        }
        if (in_array($catalog, ['all', 'international'], true)) {
            foreach (json_decode(file_get_contents(database_path('data/verified-international-training.json')), true, 512, JSON_THROW_ON_ERROR) as $row) {
                yield $row;
            }
        }
    }

    public function import(iterable $rows): int
    {
        return DB::transaction(function () use ($rows) {
            $batch = [];
            $count = 0;
            $skills = [];
            $stamp = now();
            $flush = function () use (&$batch) {
                if (! $batch) {
                    return;
                }
                if (TrainingProgram::whereIn('source_url', array_column($batch, 'source_url'))->where(fn ($q) => $q->whereNotNull('owner_id')->orWhere('external_enrollment', false))->exists()) {
                    throw new RuntimeException('A source identity conflicts with an owned training record.');
                }
                TrainingProgram::upsert($batch, ['source_url'], array_diff(array_keys($batch[0]), ['source_url', 'created_at']));
                $batch = [];
            };
            foreach ($rows as $row) {
                if (! TrainingSources::allows($row['source_url'])) {
                    throw new RuntimeException('Unexpected official training URL.');
                }
                foreach ($row['skills'] as $skill) {
                    $skills[$skill] = true;
                }
                $batch[] = ['source_url' => $row['source_url'], 'title' => $row['title'], 'provider' => $row['provider'],
                    'location' => $row['location'], 'mode' => $row['mode'], 'description' => $row['description'],
                    'requirements' => $row['requirements'], 'schedule' => $row['schedule'], 'fee' => $row['fee'] ?? 0,
                    'skills' => json_encode($row['skills'], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                    'capacity' => $row['capacity'] ?? null, 'starts_on' => $row['starts_on'] ?? null, 'ends_on' => $row['ends_on'] ?? null,
                    'status' => 'published', 'is_sample' => false, 'source_name' => $row['source_name'],
                    'source_checked_at' => CarbonImmutable::parse($row['checked_at'])->setTimezone(config('app.timezone')),
                    'external_enrollment' => true, 'created_at' => $stamp, 'updated_at' => $stamp];
                $count++;
                if (count($batch) === 200) {
                    $flush();
                }
            }
            $flush();
            foreach (array_keys($skills) as $skill) {
                Skill::firstOrCreate(['name' => $skill]);
            }

            return $count;
        });
    }
}
