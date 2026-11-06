<?php

namespace App\Services;

class VacancySources
{
    public const CATALOG = 'https://pasay.gov.ph/job-openings/';

    public const DETAIL_PREFIX = 'https://pasay.gov.ph/peso-jobs/';

    public static function allows(string $url): bool
    {
        $parts = parse_url($url);

        return is_array($parts)
            && ($parts['scheme'] ?? '') === 'https'
            && ($parts['host'] ?? '') === 'pasay.gov.ph'
            && ! array_intersect(['user', 'pass', 'port', 'query', 'fragment'], array_keys($parts))
            && preg_match('~^/peso-jobs/[a-z0-9-]+/$~D', $parts['path'] ?? '') === 1;
    }
}
