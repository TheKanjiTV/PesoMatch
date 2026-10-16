<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use PDO;

class ProvisionLocalDatabase extends Command
{
    protected $signature = 'security:provision-local-database {--apply : Create a new least-privileged local app account and update only DB_USERNAME/DB_PASSWORD}';

    protected $description = 'Provision a dedicated loopback-only database identity without rotating existing credentials';

    public function handle(): int
    {
        if (! app()->environment('local') || app()->configurationIsCached() || config('database.default') !== 'mysql') {
            $this->error('Only an uncached local MySQL environment is supported. Production provisioning requires the deployment operator.');

            return self::FAILURE;
        }
        $connection = config('database.connections.mysql');
        if (! in_array($connection['host'], ['127.0.0.1', 'localhost'], true) || ! preg_match('/^[a-zA-Z0-9_]+$/', $connection['database'])) {
            $this->error('Expected a named database on the local loopback interface.');

            return self::FAILURE;
        }
        if (! in_array(strtolower($connection['username']), ['root', 'admin', 'administrator'], true) && ! empty($connection['password'])) {
            $this->info('A non-administrative password-protected database identity is already configured. No credential changes made.');

            return self::SUCCESS;
        }
        if (! $this->option('apply')) {
            $this->info('Dry run: create a fresh loopback app identity with SELECT/INSERT/UPDATE/DELETE on this database only; preserve existing accounts and application key. Use --apply to perform the local provisioning.');

            return self::SUCCESS;
        }
        $environmentPath = app()->environmentFilePath();
        $original = file_get_contents($environmentPath);
        if (preg_match_all('/^DB_USERNAME=.*$/m', $original) !== 1 || preg_match_all('/^DB_PASSWORD=.*$/m', $original) !== 1) {
            $this->error('Expected exactly one database username/password entry. No changes made.');

            return self::FAILURE;
        }
        $username = 'peso_app_'.bin2hex(random_bytes(4));
        $password = bin2hex(random_bytes(32));
        $administrator = DB::connection()->getPdo();
        $account = $administrator->quote($username)."@'127.0.0.1'";
        try {
            $administrator->exec('CREATE USER '.$account.' IDENTIFIED BY '.$administrator->quote($password));
            $administrator->exec('GRANT SELECT, INSERT, UPDATE, DELETE ON `'.$connection['database'].'`.* TO '.$account);
            $app = new PDO('mysql:host=127.0.0.1;port='.$connection['port'].';dbname='.$connection['database'].';charset=utf8mb4', $username, $password, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            $app->query('SELECT COUNT(*) FROM users')->fetchColumn();
            $app->beginTransaction();
            $app->exec('UPDATE sessions SET last_activity = last_activity WHERE 1 = 0');
            $app->rollBack();
            $backupFolder = base_path('../.local/backups');
            if (! is_dir($backupFolder)) {
                mkdir($backupFolder, 0700, true);
            }
            if (file_put_contents($backupFolder.'/database-connection-'.date('Ymd-His').'.env.enc', Crypt::encryptString($original), LOCK_EX) === false) {
                throw new \RuntimeException('Backup failed.');
            }
            $updated = preg_replace('/^DB_USERNAME=.*$/m', 'DB_USERNAME='.$username, $original);
            $updated = preg_replace('/^DB_PASSWORD=.*$/m', 'DB_PASSWORD='.$password, $updated);
            if (file_put_contents($environmentPath, $updated, LOCK_EX) !== strlen($updated)) {
                file_put_contents($environmentPath, $original, LOCK_EX);
                throw new \RuntimeException('Environment update failed.');
            }
            $this->info('Dedicated local database identity verified and configured. Existing database accounts, data and encryption key were preserved. An encrypted recovery copy is stored under ignored .local/backups. No credentials were printed.');
            $this->warn('This app account intentionally has no schema-administration grants. Run future migrations with a separate deployment identity. Local HTTP remains development-only.');

            return self::SUCCESS;
        } catch (\Throwable) {
            // Do not print SQL, credentials or connection exception diagnostics.
            $this->error('Provisioning did not complete. Existing credentials were not rotated. Review local database privileges and the encrypted recovery copy if present.');

            return self::FAILURE;
        }
    }
}
