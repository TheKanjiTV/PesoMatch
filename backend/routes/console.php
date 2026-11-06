<?php

use App\Models\PublicResource;
use App\Models\ServiceEvent;
use App\Models\Skill;
use App\Models\User;
use App\Models\Vacancy;
use App\Services\ReviewedTrainingImporter;
use App\Services\VacancySources;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

Artisan::command('inspire', function () {

    $this->comment(Inspiring::quote());

})->purpose('Display an inspiring quote');

Artisan::command('peso:access {email} {role}', function () {

    $roles = ['jobseeker', 'employer', 'training_provider', 'peso_staff', 'admin'];

    if (! in_array($this->argument('role'), $roles, true)) {

        $this->error('Valid roles: '.implode(', ', $roles));

        return 1;

    }

    $user = User::where('email', strtolower($this->argument('email')))->first();

    if (! $user) {

        $this->error('Register the account first.');

        return 1;

    }

    if ($user->role === 'admin' && $this->argument('role') !== 'admin' && User::where('role', 'admin')->count() <= 1) {

        $this->error('Keep at least one administrator.');

        return 1;

    }

    DB::transaction(function () use ($user) {

        $previous = $user->role;

        $user->forceFill(['role' => $this->argument('role'), 'remember_token' => null])->save();
        DB::table('sessions')->where('user_id', $user->id)->delete();

        DB::table('audit_events')->insert(['actor_id' => null, 'action' => 'user.role_provisioned_locally', 'entity' => 'users', 'entity_id' => $user->id, 'changes' => json_encode(['previous_role' => $previous, 'role' => $user->role]), 'created_at' => now()]);

    });

    $this->info('Account access updated. Sign in again to use the new workspace.');

})->purpose('Provision a PESO, employer or training-provider role on an existing local account');

Artisan::command('peso:import-verified-training {--catalog=all}', function (ReviewedTrainingImporter $importer) {
    $catalog = $this->option('catalog');
    if (! in_array($catalog, ['all', 'online', 'registered', 'international'], true)) {
        $this->error('Choose all, online, registered or international.');

        return 1;
    }
    $result = $importer->importCatalog($catalog);
    $this->info($result['imported'].' reviewed training records imported; '.$result['retired'].' withdrawn source records unpublished without deletion. Registered programs do not confirm an open intake, scholarship or fee. No local enrollment or certification was fabricated.');
})->purpose('Import reviewed TESDA online, registered-institution and official overseas training catalogs');

Artisan::command('peso:import-verified-vacancies', function () {
    $rows = json_decode(file_get_contents(database_path('data/verified-vacancies.json')), true, 512, JSON_THROW_ON_ERROR);
    $importedAt = now()->startOfSecond();
    DB::transaction(function () use ($rows, $importedAt) {
        foreach ($rows as $row) {
            if (! VacancySources::allows($row['source_url'])) {
                throw new RuntimeException('Unexpected source host.');
            }
            if (Vacancy::where('source_url', $row['source_url'])->where(fn ($q) => $q->whereNotNull('owner_id')->orWhere('external_application', false))->exists()) {
                throw new RuntimeException('A source identity conflicts with an owned vacancy.');
            }
            foreach ($row['skills'] as $skill) {
                Skill::firstOrCreate(['name' => $skill]);
            }
            Vacancy::updateOrCreate(['source_url' => $row['source_url']], ['title' => $row['title'], 'organization' => $row['organization'], 'location' => $row['location'], 'industry' => $row['industry'], 'employment_type' => $row['employment_type'], 'description' => $row['description'], 'skills' => $row['skills'], 'slots' => $row['slots'] ?? null, 'deadline' => $row['deadline'] ?? null, 'salary_min' => null, 'salary_max' => null, 'status' => 'published', 'is_sample' => false, 'source_name' => $row['source_name'], 'source_checked_at' => CarbonImmutable::parse($row['checked_at'])->setTimezone(config('app.timezone')), 'source_posted_on' => $row['source_posted_on'], 'source_salary' => $row['source_salary'], 'external_application' => true, 'updated_at' => $importedAt]);
        }
        Vacancy::currentSource()->where('external_application', true)->whereNull('owner_id')->where('status', 'published')->where('updated_at', '<', $importedAt)->update(['status' => 'draft']);
    });
    $this->info(count($rows).' reviewed official PESO/government listings imported. Confirm availability and application requirements on each official source page. No local partner account or referral was fabricated.');
})->purpose('Import researched official-source job listings without inventing deadlines, positions or PESO relationships');

Artisan::command('peso:import-verified-public-resources', function () {
    $events = json_decode(file_get_contents(database_path('data/verified-events.json')), true, 512, JSON_THROW_ON_ERROR);
    $reports = json_decode(file_get_contents(database_path('data/verified-public-resources.json')), true, 512, JSON_THROW_ON_ERROR);
    DB::transaction(function () use ($events, $reports) {
        foreach ($events as $row) {
            if (! in_array($row['source_url'], [
                'https://ro11.dole.gov.ph/job-fair-schedules/',
                'https://docs.google.com/spreadsheets/d/1PlMXkd0LkWnWD640JrIprx7DGjleu5U4-9wD_UNIQys/edit',
            ], true)) {
                throw new RuntimeException('Unexpected calendar host.');
            }
            ServiceEvent::updateOrCreate(['source_key' => $row['source_key']], collect($row)->except(['checked_at', 'source_key'])->all() + ['starts_at' => null, 'is_sample' => false, 'source_checked_at' => CarbonImmutable::parse($row['checked_at'])->setTimezone(config('app.timezone'))]);
        }
        foreach ($reports as $row) {
            if (parse_url($row['source_url'], PHP_URL_HOST) !== 'openstat.psa.gov.ph') {
                throw new RuntimeException('Unexpected statistics host.');
            }
            PublicResource::updateOrCreate(['source_url' => $row['source_url']], collect($row)->except(['checked_at'])->all() + ['source_checked_at' => CarbonImmutable::parse($row['checked_at'])->setTimezone(config('app.timezone'))]);
        }
    });
    $this->info(count($events).' source events and '.count($reports).' official statistical report imported. No people, enrollments or outcomes were fabricated.');
})->purpose('Import reviewed official calendars and PSA statistics with source provenance');
