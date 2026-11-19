<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AiConfigurationTest extends TestCase
{
    private string $directory;

    private string $original;

    private string $key = 'synthetic-cohere-setup-key-123456';

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        $this->directory = dirname(base_path()).'/.local/ai-setup-test-'.bin2hex(random_bytes(8));
        mkdir($this->directory, 0700, true);
        $this->app->useEnvironmentPath($this->directory)->loadEnvironmentFrom('.env');
        $this->app->useStoragePath($this->directory.'/storage');
        $this->original = "APP_KEY=keep-existing-key\nDB_DATABASE=keep-existing-data\nAPP_ENV=local\n";
        file_put_contents($this->directory.'/.env', $this->original);
        file_put_contents($this->directory.'/key.txt', $this->key);
        config(['ai.enabled' => false, 'ai.key' => null]);
    }

    protected function tearDown(): void
    {
        $resolved = realpath($this->directory);
        $parent = realpath(dirname(base_path()).'/.local');
        if ($resolved && $parent && str_starts_with($resolved, $parent.DIRECTORY_SEPARATOR.'ai-setup-test-')) {
            File::deleteDirectory($resolved);
        }
        parent::tearDown();
    }

    public function test_check_does_not_enable_unconfigured_ai_or_send_an_uncredentialed_request(): void
    {
        $this->assertSame(1, Artisan::call('peso:ai-configure', ['--check' => true]));
        Http::assertNothingSent();
        $this->assertSame($this->original, file_get_contents($this->directory.'/.env'));
    }

    public function test_rejected_credentials_leave_existing_environment_untouched_and_never_print_the_key(): void
    {
        Http::fake(['api.cohere.com/*' => Http::response(['message' => 'unauthorized'], 401)]);
        $this->assertSame(1, Artisan::call('peso:ai-configure', ['--key-file' => $this->directory.'/key.txt']));
        $this->assertSame($this->original, file_get_contents($this->directory.'/.env'));
        $this->assertStringNotContainsString($this->key, Artisan::output());
    }

    public function test_successful_live_access_checks_preserve_other_settings_and_encrypt_the_backup(): void
    {
        $vector = array_fill(0, 1024, 0.0);
        $vector[0] = 1.0;
        Http::fake([
            'api.cohere.com/v2/embed' => Http::response(['embeddings' => ['float' => [$vector]]]),
            'api.cohere.com/v2/chat' => Http::response(['finish_reason' => 'COMPLETE', 'message' => ['content' => [['type' => 'text', 'text' => '{"status":"ready"}']]]]),
        ]);
        $this->assertSame(0, Artisan::call('peso:ai-configure', ['--key-file' => $this->directory.'/key.txt']));
        Http::assertSentCount(2);
        $saved = file_get_contents($this->directory.'/.env');
        $this->assertStringContainsString($this->original, $saved);
        $this->assertStringContainsString('AI_ENABLED=true', $saved);
        $this->assertStringContainsString('COHERE_API_KEY='.$this->key, $saved);
        $this->assertStringNotContainsString($this->key, Artisan::output());
        $backups = glob($this->directory.'/storage/app/private/ai-setup/environment-before-*.enc');
        $this->assertCount(1, $backups);
        $this->assertSame($this->original, Crypt::decryptString(file_get_contents($backups[0])));
    }
}
