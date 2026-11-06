<?php

namespace App\Console\Commands;

use App\Models\ResumeDocument;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class RefreshLocalDemoAccounts extends Command
{
    protected $signature = 'peso:refresh-local-accounts {--apply : Back up and replace recognized disposable test accounts with named local demo accounts}';

    protected $description = 'Review or clean up disposable local browser accounts, preserving other accounts and catalog data';

    public static function isDisposable(string $email): bool
    {
        return (bool) preg_match('/^(?:ui|platform|new|returning|completed|wizard|security|first-isolation)\.[0-9]+(?:\.[a-z0-9]+)*@example\.test$/i', $email);
    }

    public static function identities(): array
    {
        return [
            ['Maria', 'Santos', 'jobseeker'], ['Juan', 'Reyes', 'jobseeker'],
            ['Angela', 'Cruz', 'jobseeker'], ['Carlo', 'Garcia', 'jobseeker'],
            ['Isabel', 'Mendoza', 'jobseeker'], ['Miguel', 'Torres', 'jobseeker'],
            ['Sofia', 'Ramos', 'jobseeker'], ['Daniel', 'Villanueva', 'employer'],
            ['Camille', 'Navarro', 'training_provider'], ['Rafael', 'Castillo', 'peso_staff'],
        ];
    }

    public function handle(): int
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->error('This command is for local demonstration accounts only.');

            return self::FAILURE;
        }

        $candidates = User::all()->filter(fn ($user) => self::isDisposable($user->email));
        $ids = $candidates->pluck('id')->all();
        $protected = User::whereNotIn('id', $ids)->get(['id', 'email', 'role']);
        if (! $protected->contains('role', 'admin')) {
            $this->error('An existing administrator outside the disposable test accounts must be preserved first.');

            return self::FAILURE;
        }
        // Do not detach genuine partner content if somebody reused a test login.
        foreach (['vacancies', 'training_programs'] as $table) {
            if (DB::table($table)->whereIn('owner_id', $ids)->where('is_sample', false)->exists()) {
                $this->error('A candidate owns a non-sample catalog record. Review its ownership before cleanup.');

                return self::FAILURE;
            }
        }

        $new = [];
        foreach (self::identities() as [$first, $last, $role]) {
            $email = strtolower($first.'.'.$last).'@demo.example.test';
            $existing = User::where('email', $email)->first();
            if ($existing && ($existing->first_name !== $first || $existing->last_name !== $last || $existing->role !== $role)) {
                $this->error('An existing account conflicts with a proposed demo identity; no accounts were changed.');

                return self::FAILURE;
            }
            if (! $existing) {
                $new[] = compact('first', 'last', 'role', 'email');
            }
        }
        $this->line(json_encode(['disposable_accounts' => count($ids), 'protected_accounts' => $protected->count(), 'new_local_demo_accounts' => count($new)], JSON_THROW_ON_ERROR));
        if (! $this->option('apply')) {
            $this->info('Dry run only. No accounts or credentials were changed.');

            return self::SUCCESS;
        }
        if ($ids === [] && $new === []) {
            $this->info('The disposable accounts are already removed and all ten demo accounts exist. No passwords were changed.');

            return self::SUCCESS;
        }

        $disk = Storage::disk('local');
        $stamp = now()->format('Y-m-d-His').'-'.Str::lower(Str::random(6));
        $directory = 'account-maintenance/'.$stamp;
        $tables = [];
        foreach (Schema::getTableListing(schemaQualified: false) as $table) {
            if (! str_starts_with($table, 'sqlite_')) {
                $tables[$table] = DB::table($table)->get()->map(fn ($row) => (array) $row)->all();
            }
        }
        $files = [];
        foreach (ResumeDocument::whereIn('user_id', $ids)->get() as $resume) {
            if ($disk->exists($resume->path)) {
                $files[$resume->path] = base64_encode($disk->get($resume->path));
            }
        }
        $snapshot = json_encode(['created_at' => now()->toIso8601String(), 'purpose' => 'User-authorized local test-account cleanup', 'candidate_ids' => $ids, 'tables' => $tables, 'private_files' => $files], JSON_THROW_ON_ERROR);
        $backup = $directory.'/before-cleanup.enc';
        if (! $disk->put($backup, Crypt::encryptString($snapshot)) || ! hash_equals(hash('sha256', $snapshot), hash('sha256', Crypt::decryptString($disk->get($backup))))) {
            throw new RuntimeException('The encrypted backup could not be verified. No accounts were changed.');
        }

        $credentials = $directory.'/LOCAL-DEMO-ACCOUNTS.md';
        $created = [];
        $removedFiles = [];
        try {
            DB::transaction(function () use ($candidates, $new, $disk, $files, $credentials, &$created, &$removedFiles) {
                foreach ($candidates as $candidate) {
                    DB::table('sessions')->where('user_id', $candidate->id)->delete();
                    DB::table('password_reset_tokens')->where('email', $candidate->email)->delete();
                    foreach (ResumeDocument::where('user_id', $candidate->id)->get() as $resume) {
                        if (isset($files[$resume->path])) {
                            if (! $disk->delete($resume->path)) {
                                throw new RuntimeException('A disposable private document could not be removed. Cleanup was rolled back.');
                            }
                            $removedFiles[] = $resume->path;
                        }
                    }
                    $candidate->delete();
                }
                foreach ($new as $identity) {
                    $password = Str::random(28).'!aA7';
                    $user = User::create(['first_name' => $identity['first'], 'last_name' => $identity['last'], 'name' => $identity['first'].' '.$identity['last'], 'email' => $identity['email'], 'password' => $password]);
                    $user->forceFill(['role' => $identity['role']])->save();
                    if ($identity['role'] === 'jobseeker') {
                        // No fabricated address, qualifications, consent or employment outcome.
                        $user->jobseekerProfile()->create();
                    }
                    $created[] = ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => $user->role, 'password' => $password];
                }
                $text = "# Local demo accounts\n\nThese are fictional demonstration identities with functional local logins, not verified real people. Emails use the reserved demo.example.test domain and cannot receive mail. No profile facts, consent or employment outcomes were invented.\n\nKeep this file private. Each new account has a unique generated password; change it in Account Settings after signing in. The existing administrator was preserved.\n\n";
                foreach ($created as $row) {
                    $text .= "## {$row['name']}\n\n- Email: {$row['email']}\n- Role: {$row['role']}\n- Password: `{$row['password']}`\n\n";
                }
                if (! $disk->put($credentials, $text)) {
                    throw new RuntimeException('Private credential delivery failed. Account changes were rolled back.');
                }
            });
        } catch (\Throwable $error) {
            foreach ($removedFiles as $path) {
                $disk->put($path, base64_decode($files[$path], true));
            }
            $disk->delete($credentials);
            throw $error;
        }

        $this->line(json_encode(['removed_disposable_accounts' => count($ids), 'created_demo_accounts' => count($created), 'remaining_accounts' => User::count(), 'backup' => $disk->path($backup), 'credentials' => $disk->path($credentials)], JSON_THROW_ON_ERROR));
        $this->info('Existing non-test accounts, application key and catalog records were preserved. Passwords were not printed.');

        return self::SUCCESS;
    }
}
