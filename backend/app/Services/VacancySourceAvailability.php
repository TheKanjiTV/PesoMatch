<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class VacancySourceAvailability
{
    public const URL = 'https://philjobnet.gov.ph/job-vacancies/';

    private const CACHE_KEY = 'public-source-status:philjobnet:v1';

    public function status(): array
    {
        $cached = Cache::get(self::CACHE_KEY);
        if (is_array($cached)) {
            return $cached;
        }

        // A fixed public URL, no client-supplied destination/cookies, and one
        // bounded probe per cache window rather than one probe per listing.
        return Cache::lock(self::CACHE_KEY.':checking', 15)->get(function () {
            $cached = Cache::get(self::CACHE_KEY);
            if (is_array($cached)) {
                return $cached;
            }
            $result = $this->probe();
            Cache::put(self::CACHE_KEY, $result, now()->addMinutes(10));

            return $result;
        }) ?: ['status' => 'unknown', 'checked_at' => null, 'http_status' => null, 'url' => self::URL];
    }

    private function probe(): array
    {
        $result = ['status' => 'unknown', 'checked_at' => now()->toIso8601String(), 'http_status' => null, 'url' => self::URL];
        try {
            $response = Http::connectTimeout(3)->timeout(6)->withoutRedirecting()
                ->withHeaders(['User-Agent' => 'PesoMatch-public-source-status/1.0', 'Accept' => 'text/html'])
                ->get(self::URL);
            $result['http_status'] = $response->status();
            $body = strtolower($response->body());
            $softError = preg_match('/web app - unavailable|page not found|<title[^>]*>[^<]*404/i', $body);
            if (in_array($response->status(), [403, 404, 410], true) || $response->serverError() || $softError) {
                $result['status'] = 'unavailable';
            } elseif ($response->ok() && str_contains($body, 'philjobnet') && str_contains($body, 'find jobs here')) {
                $result['status'] = 'reachable';
            }
        } catch (ConnectionException) {
            // A timeout/TLS/connectivity error is inconclusive, not evidence
            // that every vacancy has closed. Never publish transport diagnostics.
        }

        return $result;
    }
}
