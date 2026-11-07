<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureSessionIdentity
{
    public function handle(Request $request, Closure $next)
    {
        // The header only detects a stale tab. Authorization always uses the
        // authenticated server session, never a client supplied identity/role.
        $expected = $request->header('X-Peso-User');
        if ($expected !== null && (string) $request->user()?->id !== $expected) {
            return response()->json(['message' => 'The signed-in account changed in another tab. Your workspace is being refreshed.', 'code' => 'SESSION_CHANGED'], 409);
        }

        return $next($request);
    }
}
