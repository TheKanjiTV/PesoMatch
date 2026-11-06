<?php

use App\Models\PublicResource;
use App\Models\ServiceEvent;
use App\Models\Skill;
use App\Models\TrainingProgram;
use App\Models\User;
use App\Models\Vacancy;
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

Artisan::command('peso:import-verified-training', function () {

    $rows = json_decode(file_get_contents(database_path('data/verified-training.json')), true, 512, JSON_THROW_ON_ERROR);

    DB::transaction(function () use ($rows) {
        foreach ($rows as $row) {

            if (parse_url($row['source_url'], PHP_URL_HOST) !== 'e-tesda.gov.ph') {
                throw new RuntimeException('Unexpected source host.');
            }

            foreach ($row['skills'] as $skill) {
                Skill::firstOrCreate(['name' => $skill]);
            }

            TrainingProgram::updateOrCreate(['source_url' => $row['source_url']], ['title' => $row['title'], 'provider' => 'TESDA Online Program', 'location' => 'Online · Philippines', 'mode' => 'Online', 'description' => $row['description'], 'requirements' => 'Create an account on the official TESDA Online Program website and review the course prerequisites. Course completion is not an automatic National Certificate.', 'skills' => $row['skills'], 'capacity' => null, 'starts_on' => null, 'ends_on' => null, 'schedule' => 'Self-paced · see official source', 'fee' => 0, 'status' => 'published', 'is_sample' => false, 'source_name' => $row['source_name'], 'source_checked_at' => CarbonImmutable::parse($row['checked_at'])->setTimezone(config('app.timezone')), 'external_enrollment' => true]);

        }
    });

    $this->info(count($rows).' official-source course records imported idempotently. No local enrollment or certification was fabricated.');

})->purpose('Import the researched official training catalog with source evidence');

Artisan::command('peso:import-verified-vacancies', function () {
    $rows = json_decode(file_get_contents(database_path('data/verified-vacancies.json')), true, 512, JSON_THROW_ON_ERROR);
    DB::transaction(function () use ($rows) {
        foreach ($rows as $row) {
            if (! VacancySources::allows($row['source_url'])) {
                throw new RuntimeException('Unexpected source host.');
            }
            foreach ($row['skills'] as $skill) {
                Skill::firstOrCreate(['name' => $skill]);
            }
            Vacancy::updateOrCreate(['source_url' => $row['source_url']], ['title' => $row['title'], 'organization' => $row['organization'], 'location' => $row['location'], 'industry' => $row['industry'], 'employment_type' => $row['employment_type'], 'description' => $row['description'], 'skills' => $row['skills'], 'slots' => null, 'deadline' => null, 'salary_min' => null, 'salary_max' => null, 'status' => 'published', 'is_sample' => false, 'source_name' => $row['source_name'], 'source_checked_at' => CarbonImmutable::parse($row['checked_at'])->setTimezone(config('app.timezone')), 'source_posted_on' => $row['source_posted_on'], 'source_salary' => $row['source_salary'], 'external_application' => true]);
        }
    });
    $this->info(count($rows).' reviewed Pasay PESO listings imported. Confirm availability and application requirements on each official source page. No local partner account or referral was fabricated.');
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
