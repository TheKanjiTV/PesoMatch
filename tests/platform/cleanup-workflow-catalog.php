<?php

use App\Models\TrainingProgram;
use App\Models\User;
use App\Models\Vacancy;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

// Removes only exact owned, labeled catalog fixtures from this browser test.
require __DIR__.'/../../backend/vendor/autoload.php';
$app = require __DIR__.'/../../backend/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$id = filter_var($argv[1] ?? '', FILTER_VALIDATE_INT);
$email = $argv[2] ?? '';
$vacancyId = (int) ($argv[3] ?? 0);
$programId = (int) ($argv[4] ?? 0);
if (! $app->environment(['local', 'testing']) || ! $id || ! preg_match('/^platform\.[0-9]+\.[a-z0-9]+@example\.test$/', $email)) {
    exit(1);
}
$user = User::whereKey($id)->where('email', $email)->firstOrFail();
$db = DB::class;
$db::transaction(function () use ($id, $vacancyId, $programId, $db) {
    if ($vacancyId) {
        $vacancy = Vacancy::withTrashed()->whereKey($vacancyId)->where('owner_id', $id)->where('title', "Browser workflow vacancy $id")->where('description', 'Disposable local browser workflow fixture.')->firstOrFail();
        if ($db::table('referrals')->where('vacancy_id', $vacancyId)->where('user_id', '<>', $id)->exists() || $db::table('saved_vacancies')->where('vacancy_id', $vacancyId)->where('user_id', '<>', $id)->exists()) {
            throw new RuntimeException('Another user references this fixture; preserve it for review.');
        }
        $referrals = $db::table('referrals')->where('vacancy_id', $vacancyId)->where('user_id', $id)->pluck('id');
        $placements = $db::table('placements')->whereIn('referral_id', $referrals)->where('user_id', $id)->pluck('id');
        $db::table('employment_outcomes')->whereIn('placement_id', $placements)->where('user_id', $id)->delete();
        $db::table('placements')->whereIn('id', $placements)->delete();
        $db::table('referrals')->whereIn('id', $referrals)->delete();
        $vacancy->forceDelete();
    }
    if ($programId) {
        $program = TrainingProgram::withTrashed()->whereKey($programId)->where('owner_id', $id)->where('title', "Browser workflow training $id")->where('description', 'Disposable local browser workflow fixture.')->firstOrFail();
        if ($db::table('enrollments')->where('training_program_id', $programId)->where(fn ($q) => $q->whereNull('user_id')->orWhere('user_id', '<>', $id))->exists() || $db::table('training_demands')->where('source_program_id', $programId)->where('user_id', '<>', $id)->exists()) {
            throw new RuntimeException('Another participant references this fixture; preserve it for review.');
        }
        $db::table('enrollments')->where('training_program_id', $programId)->where('user_id', $id)->delete();
        $program->forceDelete();
    }
});
