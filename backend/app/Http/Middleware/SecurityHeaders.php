<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next)
    {
        // In production the canonical URL, not an untrusted Host header,
        // determines HTTPS redirects. Proxy trust is an explicit allowlist.
        if (app()->environment('production')) {
            $origin = parse_url(config('app.url'));
            if (($origin['scheme'] ?? '') !== 'https' || empty($origin['host']) || config('app.debug') || ! config('session.secure') || ! config('session.http_only') || ! config('session.encrypt') || in_array('*', config('security.trusted_proxies', []), true)) {
                return $this->headers($request, response()->json(['message' => 'Production security configuration is incomplete.'], 503, ['Cache-Control' => 'no-store']));
            }
            if (! $request->isSecure()) {
                $canonical = 'https://'.$origin['host'].(isset($origin['port']) ? ':'.$origin['port'] : '');

                return $this->headers($request, redirect()->away($canonical.$request->getRequestUri(), 308));
            }
        }

        return $this->headers($request, $next($request));
    }

    private function headers(Request $request, $response)
    {
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        $response->headers->set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
        if ($request->is('api/*', 'sanctum/*')) {
            $response->headers->set('Cache-Control', 'private, no-store, max-age=0');
            $response->headers->set('Pragma', 'no-cache');
        }
        if (app()->environment('production') && $request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000');
        }

        return $response;
    }
}
