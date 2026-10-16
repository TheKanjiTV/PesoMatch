<?php

return [
    'notice_version' => '2026-10-13-draft-v1',
    'enrollment_notice_version' => 'enrollment-review-2026-10-13-v1',
    'remember_minutes' => 10080,
    'trusted_proxies' => array_values(array_filter(array_map('trim', explode(',', env('TRUSTED_PROXIES', ''))))),
];
