<?php

namespace App\Console\Commands;

use App\Services\AiOutputs;
use App\Services\AiProvider;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class ConfigureEmploymentAi extends Command
{
    protected $signature = 'peso:ai-configure {--key-file= : Private local file containing only the Cohere key} {--check : Verify existing configuration without changing .env}';

    protected $description = 'Verify actual embedding/chat access and securely configure backend AI without printing a key';

    public function handle(AiProvider $provider): int
    {
        if (app()->configurationIsCached() && ! $this->option('check')) {
            $this->error('Run php artisan config:clear before changing the backend environment.');

            return self::FAILURE;
        }
        if (! $this->option('check')) {
            $file = $this->option('key-file');
            if ($file && (! is_file($file) || ! is_readable($file))) {
                $this->error('The private key file is not readable.');

                return self::FAILURE;
            }
            $key = trim($file ? file_get_contents($file) : (string) $this->secret('Cohere API key (hidden; never written to console output)'));
            if (! preg_match('/^[A-Za-z0-9_.-]{20,512}$/D', $key)) {
                $this->error('Enter only the Cohere key, without quotes, spaces or other text.');

                return self::FAILURE;
            }
            config(['ai.key' => $key, 'ai.enabled' => true]);
        }
        if (! $provider->configured()) {
            $this->error('AI is not configured. Supply a private key file or use the hidden interactive prompt.');

            return self::FAILURE;
        }
        try {
            $vectors = $provider->embed(['Synthetic test: assisting customers with product questions.'], 'search_query');
            $schema = AiOutputs::object(['status' => ['type' => 'string', 'enum' => ['ready']]]);
            $provider->generate('Return status ready in JSON. This is a synthetic connectivity check only.', ['purpose' => 'PESO synthetic setup verification; no personal records'], $schema, ['status' => 'required|in:ready'], 'en');
        } catch (HttpExceptionInterface $e) {
            $this->error($e->getMessage());
            $this->warn('No environment changes were saved.');

            return self::FAILURE;
        }
        if (! $this->option('check')) {
            $path = app()->environmentFilePath();
            // Production releases link to one shared private environment. Replace
            // its actual file atomically, keeping the release symlink intact.
            if (is_link($path)) {
                $path = realpath($path);
                if ($path === false) {
                    $this->error('The shared backend environment link is unavailable.');

                    return self::FAILURE;
                }
            }
            $original = file_get_contents($path);
            $newline = str_contains($original, "\r\n") ? "\r\n" : "\n";
            $directory = storage_path('app/private/ai-setup');
            if (! is_dir($directory)) {
                mkdir($directory, 0700, true);
            }
            file_put_contents($directory.'/environment-before-'.now()->format('Ymd-His').'.enc', Crypt::encryptString($original));
            $updated = $original;
            foreach (['AI_ENABLED' => 'true', 'COHERE_API_KEY' => config('ai.key')] as $name => $value) {
                $line = $name.'='.$value;
                $updated = preg_match('/^'.preg_quote($name, '/').'=/m', $updated)
                    ? preg_replace_callback('/^'.preg_quote($name, '/').'=[^\r\n]*/m', fn () => $line, $updated)
                    : rtrim($updated, "\r\n").$newline.$line.$newline;
            }
            $temporary = $path.'.ai-setup-'.bin2hex(random_bytes(6));
            file_put_contents($temporary, $updated, LOCK_EX);
            chmod($temporary, fileperms($path) & 0777);
            if (! rename($temporary, $path)) {
                $this->error('Could not atomically save the backend environment.');

                return self::FAILURE;
            }
            $this->info('Backend AI enabled. Existing APP_KEY, database and other environment values were preserved.');
        }
        $this->info('Live embedding access verified: '.config('ai.embedding_model').' ('.count($vectors[0]).' dimensions).');
        $this->info('Live structured chat verified: '.config('ai.language_model').'.');
        $this->warn('Connectivity checks are not accuracy or human validation. Next run peso:ai-evaluate and peso:ai-index.');

        return self::SUCCESS;
    }
}
