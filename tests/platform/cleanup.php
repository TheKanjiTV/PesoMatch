<?php
// Only removes the exact disposable browser-test account created by this suite.
require __DIR__.'/../../backend/vendor/autoload.php';
$app = require __DIR__.'/../../backend/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$id = filter_var($argv[1] ?? '', FILTER_VALIDATE_INT);
$email = $argv[2] ?? '';
if (! $id || ! preg_match('/^platform\.[0-9]+\.[a-z0-9]+@example\.test$/', $email)) exit(1);
$user = \App\Models\User::withoutGlobalScope('active')->whereKey($id)->where('email', $email)->first();
if ($user) \Illuminate\Support\Facades\DB::transaction(function () use ($user) {
    \Illuminate\Support\Facades\DB::table('sessions')->where('user_id', $user->id)->delete();
    \Illuminate\Support\Facades\DB::table('privacy_requests')->where('user_id', $user->id)->delete();
    $resume = \App\Models\ResumeDocument::where('user_id', $user->id)->first();
    if ($resume) \Illuminate\Support\Facades\Storage::disk('local')->delete($resume->path);
    $user->delete();
});
