<?php

// Recovery only for this run's new, empty target. Never clears user records.
$p = new PDO('mysql:host=127.0.0.1;dbname=peso_employment', 'root', '');
foreach ($p->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN) as $t) {
    if (! preg_match('/^[a-z_]+$/', $t)) {
        throw new RuntimeException('Unexpected table');
    }if ($t !== 'migrations' && $p->query("SELECT COUNT(*) FROM `$t`")->fetchColumn() != 0) {
        throw new RuntimeException('Target contains records; refusing reset.');
    }
}$p->exec('DROP DATABASE peso_employment');
echo 'Empty failed-transfer schema cleared; source remains intact.'.PHP_EOL;
