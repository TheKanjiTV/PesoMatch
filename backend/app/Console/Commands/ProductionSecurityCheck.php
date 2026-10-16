<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class ProductionSecurityCheck extends Command
{
    protected $signature = 'security:check-production';

    protected $description = 'Read-only production configuration gate (prints checks, never credentials)';

    public function handle(): int
    {
        $connection = config('database.connections.'.config('database.default'), []);
        $extractor = new Process([config('services.resume.pdftotext'), '-v']);
        $extractor->setTimeout(3);
        $parserSupported = false;
        try {
            $extractor->run();
            $version = $extractor->getOutput().$extractor->getErrorOutput();
            $parserSupported = preg_match('/pdftotext version ([0-9.]+)/i', $version, $match) && version_compare($match[1], '4.06', '>=');
        } catch (\Throwable) { /* A missing/unknown parser cannot pass the gate. */
        }
        $checks = [
            'Production environment' => app()->environment('production'),
            'Debug disabled' => ! config('app.debug'),
            'Canonical HTTPS URL' => parse_url(config('app.url'), PHP_URL_SCHEME) === 'https',
            'Application encryption key configured' => filled(config('app.key')),
            'Encrypted server-side sessions' => config('session.encrypt') && in_array(config('session.driver'), ['database', 'redis'], true),
            'Secure HttpOnly cookies' => config('session.secure') && config('session.http_only'),
            'SameSite cookie protection' => in_array(config('session.same_site'), ['lax', 'strict'], true),
            'Explicit trusted proxy list' => ! in_array('*', config('security.trusted_proxies', []), true),
            'Database account is not administrative' => ! in_array(strtolower($connection['username'] ?? ''), ['root', 'sa', 'postgres', ''], true),
            'Database password configured' => filled($connection['password'] ?? null),
            'PDF extractor version meets baseline (4.06 or newer)' => (bool) $parserSupported,
        ];
        foreach ($checks as $name => $pass) {
            $this->line(($pass ? 'PASS ' : 'FAIL ').$name);
        }
        $this->warn('Also verify TLS at the edge and remote database, database grants, storage/backups encryption, restore tests, PDF extractor patches, legal operator/contact, retention and minor-user procedures. This command does not attest compliance.');

        return in_array(false, $checks, true) ? self::FAILURE : self::SUCCESS;
    }
}
