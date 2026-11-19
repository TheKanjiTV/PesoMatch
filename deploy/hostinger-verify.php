<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit(1); }
require getcwd().'/vendor/autoload.php';
$app=require getcwd().'/bootstrap/app.php';$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$manifest=json_decode(file_get_contents(getenv('SITE_ROOT').'/shared/prepared.json'),true,512,JSON_THROW_ON_ERROR);
$counts=[];foreach(array_keys($manifest['protected_counts']) as $t)$counts[$t]=Illuminate\Support\Facades\DB::table($t)->count();
if (hash('sha256',config('app.key'))!==$manifest['app_key_sha256'])throw new RuntimeException('APP_KEY changed. Refusing publication.');
// On initial release compare all protected counts. Later releases capture a fresh manifest.
if ($counts!==$manifest['protected_counts'])throw new RuntimeException('Protected row counts changed; inspect before publishing.');
if(!is_executable(config('services.resume.pdftotext')))throw new RuntimeException('Private PDF extractor unavailable.');
$orphans=0;$keys=Illuminate\Support\Facades\DB::select('SELECT TABLE_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL');
foreach($keys as $k){foreach((array)$k as $v)if(!preg_match('/^[a-zA-Z0-9_]+$/D',$v))throw new RuntimeException('Unexpected identifier.');$sql="SELECT COUNT(*) AS n FROM `{$k->TABLE_NAME}` c LEFT JOIN `{$k->REFERENCED_TABLE_NAME}` p ON c.`{$k->COLUMN_NAME}`=p.`{$k->REFERENCED_COLUMN_NAME}` WHERE c.`{$k->COLUMN_NAME}` IS NOT NULL AND p.`{$k->REFERENCED_COLUMN_NAME}` IS NULL";$orphans+=(int)Illuminate\Support\Facades\DB::selectOne($sql)->n;}
if($orphans)throw new RuntimeException('Foreign-key orphan detected.');
echo json_encode(['app_key_preserved'=>true,'protected_counts_preserved'=>true,'foreign_keys_checked'=>count($keys),'orphan_references'=>$orphans,'private_pdf_extractor'=>true,'counts'=>$counts],JSON_PRETTY_PRINT).PHP_EOL;
