<?php
// CLI-only initial setup. All environments, credentials and snapshots stay private.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit(1); }
$root = realpath(getenv('SITE_ROOT') ?: '');
$legacy = realpath(getenv('LEGACY_BACKEND') ?: '');
$public = realpath(getenv('PUBLIC_ROOT') ?: '');
$home = realpath(getenv('HOME'));
if (!$root || !$legacy || !$public || !$home || !str_starts_with($root, $home.'/apps/') || !str_starts_with($legacy, $home.'/domains/') || !str_starts_with($public, $home.'/domains/') || str_contains($root, $public)) throw new RuntimeException('Verify private and live paths first.');
$shared = $root.'/shared';
if (file_exists($shared.'/prepared.json')) throw new RuntimeException('Already prepared; inspect existing shared setup instead of overwriting it.');
umask(0077);
if (!is_dir($shared)) mkdir($shared,0700,true);
require $legacy.'/vendor/autoload.php';
$app = require $legacy.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
if (!app()->environment('production') || config('database.default') !== 'mysql' || !filled(config('app.key'))) throw new RuntimeException('Expected existing production MySQL environment.');
$counts=[]; foreach (['users','jobseeker_profiles','resume_documents','vacancies','training_programs','referrals','enrollments','placements','employment_outcomes'] as $table) $counts[$table] = Illuminate\Support\Facades\DB::table($table)->count();
$connection = config('database.connections.mysql');
$env = file_get_contents($legacy.'/.env');
$extractor = $legacy.'/tools/pdftotext';
if (!is_executable($extractor)) throw new RuntimeException('Existing private PDF extractor not executable.');
$replacement = 'RESUME_PDFTOTEXT='.$shared.'/tools/pdftotext';
$env = preg_match('/^RESUME_PDFTOTEXT=/m',$env) ? preg_replace('/^RESUME_PDFTOTEXT=[^\r\n]*/m',$replacement,$env) : rtrim($env)."\n".$replacement."\n";
file_put_contents($shared.'/backend.env',$env,LOCK_EX); chmod($shared.'/backend.env',0600);
$quote = fn($v) => '"'.str_replace(["\\",'"',"\n","\r"],["\\\\",'\\"','\\n','\\r'],(string)$v).'"';
$cnf="[client]\n";foreach(['host'=>'host','port'=>'port','user'=>'username','password'=>'password'] as $key=>$source)$cnf.=$key.'='.$quote($connection[$source])."\n";
file_put_contents($shared.'/mysql-backup.cnf',$cnf);chmod($shared.'/mysql-backup.cnf',0600);
// Existing production identity already has schema privileges; no grants are broadened.
$migration='';foreach(['DB_USERNAME'=>'username','DB_PASSWORD'=>'password'] as $key=>$source)$migration.=$key.'='.escapeshellarg($connection[$source])."\n";
file_put_contents($shared.'/migration.env',$migration);chmod($shared.'/migration.env',0600);
file_put_contents($shared.'/database-name',$connection['database']."\n");
file_put_contents($shared.'/prepared.json',json_encode(['prepared_at'=>date(DATE_ATOM),'legacy_backend'=>$legacy,'public_root'=>$public,'app_key_sha256'=>hash('sha256',config('app.key')),'protected_counts'=>$counts],JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR));
echo "Private shared environment and protected-count manifest prepared; no live mapping changed.\n";
