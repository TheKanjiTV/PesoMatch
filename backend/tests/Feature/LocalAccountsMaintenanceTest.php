<?php

namespace Tests\Feature;

use App\Console\Commands\RefreshLocalDemoAccounts;
use App\Models\User;
use App\Models\Vacancy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LocalAccountsMaintenanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_preview_is_read_only_and_apply_preserves_other_users_with_verified_encrypted_recovery(): void
    {
        Storage::fake('local');
        $admin = User::factory()->create(['role' => 'admin']);
        $genuine = User::factory()->create(['name' => 'Test is a legitimate name', 'email' => 'real.owner@example.test']);
        $disposable = User::factory()->create(['email' => 'ui.12345.abc@example.test']);
        User::factory()->create(['email' => 'platform.123456.xyz@example.test']);
        $this->artisan('peso:refresh-local-accounts')->assertSuccessful();
        $this->assertDatabaseCount('users', 4);
        $this->assertSame([], Storage::disk('local')->allFiles());
        $this->artisan('peso:refresh-local-accounts', ['--apply' => true])->assertSuccessful();
        $this->assertDatabaseCount('users', 12);
        $this->assertDatabaseHas('users', ['id' => $admin->id, 'role' => 'admin']);
        $this->assertDatabaseHas('users', ['id' => $genuine->id, 'email' => $genuine->email]);
        $this->assertDatabaseMissing('users', ['email' => $disposable->email]);
        $files = Storage::disk('local')->allFiles();
        $backup = collect($files)->first(fn ($path) => str_ends_with($path, '.enc'));
        $credentials = collect($files)->first(fn ($path) => str_ends_with($path, '.md'));
        $encrypted = Storage::disk('local')->get($backup);
        $this->assertStringNotContainsString($disposable->email, $encrypted);
        $snapshot = json_decode(Crypt::decryptString($encrypted), true, 512, JSON_THROW_ON_ERROR);
        $this->assertCount(4, $snapshot['tables']['users']);
        $text = Storage::disk('local')->get($credentials);
        $this->assertStringContainsString('fictional demonstration identities', $text);
        preg_match_all('/- Email: ([^\n]+)\n- Role: ([^\n]+)\n- Password: `([^`]+)`/', $text, $matches, PREG_SET_ORDER);
        $this->assertCount(10, $matches);
        $this->assertCount(10, array_unique(array_column($matches, 3)));
        foreach ($matches as $match) {
            $user = User::where('email', $match[1])->firstOrFail();
            $this->assertTrue(Hash::check($match[3], $user->password));
            $this->assertSame($match[2], $user->role);
            $this->assertNull($user->terms_accepted_at);
            $this->assertNull($user->jobseekerProfile?->profile_completed_at);
        }
        $this->assertDatabaseCount('jobseeker_profiles', 7);
        $this->artisan('peso:refresh-local-accounts', ['--apply' => true])->assertSuccessful();
        $this->assertSame($files, Storage::disk('local')->allFiles());
    }

    public function test_cleanup_refuses_to_detach_non_sample_partner_catalog_or_remove_the_only_admin(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create(['email' => 'platform.123.abc@example.test', 'role' => 'admin']);
        $this->artisan('peso:refresh-local-accounts', ['--apply' => true])->assertFailed();
        User::factory()->create(['role' => 'admin']);
        Vacancy::create(['owner_id' => $owner->id, 'title' => 'Preserved actual partner listing', 'organization' => 'Owner', 'location' => 'Manila', 'industry' => 'Services', 'employment_type' => 'Full-time', 'description' => 'Preserve this record', 'skills' => ['Communication'], 'slots' => 1, 'deadline' => today()->addMonth(), 'status' => 'published', 'is_sample' => false]);
        $this->artisan('peso:refresh-local-accounts', ['--apply' => true])->assertFailed();
        $this->assertDatabaseCount('users', 2);
        $this->assertDatabaseCount('vacancies', 1);
        $this->assertSame([], Storage::disk('local')->allFiles());
    }

    public function test_candidate_detection_requires_known_fixture_syntax_and_a_reserved_domain(): void
    {
        foreach (['ui.123.abc@example.test', 'platform.123.xyz@example.test', 'wizard.1440.123@example.test', 'first-isolation.123@example.test'] as $email) {
            $this->assertTrue(RefreshLocalDemoAccounts::isDisposable($email));
        }
        foreach (['ui.person@example.test', 'ui.123@gmail.com', 'maria.santos@demo.example.test', 'admin@example.test', 'test@example.test'] as $email) {
            $this->assertFalse(RefreshLocalDemoAccounts::isDisposable($email));
        }
    }
}
