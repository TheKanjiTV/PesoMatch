<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

if (config('database.default') !== 'sqlite') {
    throw new RuntimeException('Source must be SQLite.');
}
$source = DB::connection('sqlite');
if (count($source->select('PRAGMA foreign_key_check'))) {
    throw new RuntimeException('Invalid source keys.');
}
$backup = base_path('../.local/backups/'.date('Ymd-His'));
mkdir($backup, 0700, true);
$source->statement('VACUUM INTO '.$source->getPdo()->quote($backup.'/database.sqlite'));
copy(base_path('.env'), $backup.'/backend.env');
$mysql = array_merge(config('database.connections.mysql'), ['host' => '127.0.0.1', 'port' => 3306, 'database' => null, 'username' => 'root', 'password' => '']);
config(['database.connections.transfer_server' => $mysql]);
DB::connection('transfer_server')->statement('CREATE DATABASE IF NOT EXISTS peso_employment CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
config(['database.connections.transfer' => array_merge($mysql, ['database' => 'peso_employment'])]);
$target = DB::connection('transfer');
if (count($target->select('SHOW TABLES'))) {
    throw new RuntimeException('Refusing non-empty target database.');
}
Artisan::call('migrate', ['--database' => 'transfer', '--force' => true]);
echo Artisan::output();
$normalize = function ($v) use (&$normalize) {
    if (is_object($v)) {
        $v = (array) $v;
    }if (is_array($v)) {
        if (! array_is_list($v)) {
            ksort($v);
        }

return array_map($normalize, $v);
    }if (is_string($v) && in_array($v[0] ?? '', ['[', '{'])) {
        $j = json_decode($v, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $normalize($j);
        }
    }if (is_string($v) && preg_match('/^-?\d+\.\d+$/', $v)) {
        $v = rtrim(rtrim($v, '0'), '.');
    }

return $v === null ? null : (string) $v;
};
$hash = function ($rows) use ($normalize) {
    $rows = $rows->map(fn ($r) => json_encode($normalize($r)))->all();
    sort($rows);

    return hash('sha256', implode("\n", $rows));
};
$tables = $source->select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
$counts = [];
$target->statement('SET FOREIGN_KEY_CHECKS=0');
$target->transaction(function () use ($source, $target, $tables, $hash, &$counts) {
    foreach ($tables as $item) {
        $t = $item->name;
        $rows = $source->table($t)->get();
        if ($t === 'migrations') {
            $target->table($t)->delete();
        }foreach ($rows->chunk(100) as $chunk) {
            if ($chunk->count()) {
                $target->table($t)->insert($chunk->map(fn ($r) => (array) $r)->all());
            }
        }$copy = $target->table($t)->get();
        if ($hash($rows) !== $hash($copy)) {
            throw new RuntimeException('Row verification failed: '.$t);
        }$counts[$t] = $rows->count();
        echo "$t: ".$rows->count()." rows verified\n";
    }
});
$target->statement('SET FOREIGN_KEY_CHECKS=1');
$env = file_get_contents(base_path('.env'));
foreach (['DB_CONNECTION' => 'mysql', 'DB_HOST' => '127.0.0.1', 'DB_PORT' => '3306', 'DB_DATABASE' => 'peso_employment', 'DB_USERNAME' => 'root', 'DB_PASSWORD' => ''] as $k => $v) {
    $line = $k.'='.$v;
    $env = preg_match('/^'.$k.'=/m', $env) ? preg_replace('/^'.$k.'=.*$/m', $line, $env) : $env."\n".$line;
}file_put_contents(base_path('.env'), $env);
Artisan::call('config:clear');
file_put_contents($backup.'/verification.json',json_encode($counts,JSON_PRETTY_PRINT));
echo "Verified copy complete. Active database: peso_employment. Original SQLite and private backup retained.\n";
