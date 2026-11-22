<?php

namespace App\Http\Middleware;

use App\Services\AuthenticationSessions;
use Closure;
use Illuminate\Http\Request;

class TrackAuthenticationSession
{
    public function handle(Request $request, Closure $next)
    {
        if (! $request->is('api/*', 'sanctum/csrf-cookie')) {
            return $next($request);
        }
        $sessions = app(AuthenticationSessions::class);
        $previousHash = $request->hasSession() ? $sessions->hash($request->session()->getId()) : '';
        if ($request->hasSession()) {
            $sessions->expire();
        }
        $response = $next($request);
        $sessions->touch($request, $previousHash);

        return $response;
    }
}
