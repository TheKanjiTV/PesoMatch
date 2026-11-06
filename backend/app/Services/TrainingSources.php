<?php

namespace App\Services;

class TrainingSources
{
    public const REGISTERED = 'TESDA Registered Program Directory';

    public const OVERSEAS = 'MWO Osaka · TESDA National Language Skills Center';

    public const OSAKA = 'https://mwo-osaka.dmw.gov.ph/2026/09/26/free-jlpt-n3-examination-preparation-training-program/';

    public static function allows(string $url): bool
    {
        $p = parse_url($url);
        if (! is_array($p) || ($p['scheme'] ?? '') !== 'https' || array_intersect(['user', 'pass', 'port', 'fragment'], array_keys($p))) {
            return false;
        }
        if ($url === self::OSAKA) {
            return true;
        }
        parse_str($p['query'] ?? '', $query);
        if (($p['host'] ?? '') === 'e-tesda.gov.ph') {
            return ($p['path'] ?? '') === '/course/view.php' && count(explode('&', $p['query'] ?? '')) === 1 && count($query) === 1 && ctype_digit((string) ($query['id'] ?? ''));
        }

        return ($p['host'] ?? '') === 'www.tesda.gov.ph'
            && ($p['path'] ?? '') === '/Tvi/Result'
            && count(explode('&', $p['query'] ?? '')) === 3
            && count($query) === 3
            && ! array_diff(array_keys($query), ['SearchCourse', 'SearchIns', 'SearchLoc'])
            && count(array_filter($query, fn ($value) => is_string($value) && trim($value) !== '')) === 3;
    }
}
