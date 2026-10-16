<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ValidatePlatformQuery
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->isMethod('GET')) {
            Validator::make($request->query(), [
                'id' => 'sometimes|integer|min:1', 'page' => 'sometimes|integer|min:1|max:10000',
                'search' => 'sometimes|nullable|string|max:200', 'status' => 'sometimes|nullable|string|max:40',
                'saved' => 'sometimes|boolean',
                'include_samples' => 'sometimes|boolean',
            ])->validate();
        }

        return $next($request);
    }
}
