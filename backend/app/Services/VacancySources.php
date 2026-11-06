<?php

namespace App\Services;

class VacancySources
{
    public const CATALOG = 'https://pasay.gov.ph/job-openings/';

    public const DETAIL_PREFIX = 'https://pasay.gov.ph/peso-jobs/';

    public const NEGROS_PREFIX = 'https://negrosjobs.mis-negros.com/job?';

    public const ORIENTAL = 'https://ormindoro.gov.ph/careers/';

    public const ILOILO = 'https://iloiloprovince.balinkbayan.gov.ph/available-job-opportunities';

    public const PREFIXES = [self::DETAIL_PREFIX, self::NEGROS_PREFIX, 'https://www.camarinessur.gov.ph/announcement/', self::ORIENTAL, self::ILOILO];

    public static function allows(string $url): bool
    {
        $parts = parse_url($url);

        if (! is_array($parts) || ($parts['scheme'] ?? '') !== 'https' || array_intersect(['user', 'pass', 'port'], array_keys($parts))) {
            return false;
        }
        if (((($parts['host'] ?? '') === 'ormindoro.gov.ph' && ($parts['path'] ?? '') === '/careers/')
            || (($parts['host'] ?? '') === 'iloiloprovince.balinkbayan.gov.ph' && ($parts['path'] ?? '') === '/available-job-opportunities')) && ! isset($parts['query'])) {
            return ! isset($parts['fragment']) || preg_match('/^:~:text=[A-Za-z0-9%._~-]+(?:&text=[A-Za-z0-9%._~-]+)?$/D', $parts['fragment']) === 1;
        }
        if (isset($parts['fragment'])) {
            return false;
        }
        if (($parts['host'] ?? '') === 'negrosjobs.mis-negros.com') {
            return ($parts['path'] ?? '') === '/job' && preg_match('/^id=[1-9][0-9]*$/D', $parts['query'] ?? '') === 1;
        }
        if (isset($parts['query'])) {
            return false;
        }

        return (($parts['host'] ?? '') === 'pasay.gov.ph' && preg_match('~^/peso-jobs/[a-z0-9-]+/$~D', $parts['path'] ?? '') === 1)
            || (($parts['host'] ?? '') === 'www.camarinessur.gov.ph' && preg_match('~^/announcement/[1-9][0-9]*$~D', $parts['path'] ?? '') === 1);
    }
}
