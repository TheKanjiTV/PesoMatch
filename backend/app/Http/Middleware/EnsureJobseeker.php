<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureJobseeker
{
    public function handle(Request $request, Closure $next)
    {
        abort_unless($request->user()?->role === 'jobseeker', 403, 'A jobseeker account is required.');

        return $next($request);
    }
}
