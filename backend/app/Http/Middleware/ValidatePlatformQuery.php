<?php

namespace App\Http\Middleware;

use App\Models\Vacancy;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ValidatePlatformQuery
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->isMethod('GET') || $request->isMethod('HEAD')) {
            Validator::make($request->query(), [
                'id' => 'sometimes|integer|min:1', 'page' => 'sometimes|integer|min:1|max:10000',
                'search' => ['bail', 'sometimes', 'nullable', 'string', 'max:200', 'not_regex:/[\x00-\x1f\x7f]/u'],
                'status' => ['sometimes', 'nullable', 'string', Rule::in(['all', ...Vacancy::STATUSES])],
                'scope' => ['sometimes', Rule::in(['mine', 'all'])],
                'organization' => 'sometimes|nullable|string|max:160',
                'location' => 'sometimes|nullable|string|max:160',
                'employment_type' => ['sometimes', 'nullable', Rule::in(['Full-time', 'Part-time', 'Contractual', 'Seasonal', 'Internship'])],
                'sort' => ['sometimes', Rule::in(['newest', 'oldest', 'title', '-title'])],
                'saved' => 'sometimes|boolean',
                'source_program_id' => 'sometimes|integer|min:1',
                'include_samples' => 'sometimes|boolean',
                'catalog' => ['sometimes', Rule::in(['all', 'online_course', 'registered_program', 'overseas_training', 'partner_program'])],
                'availability' => ['sometimes', Rule::in(['all', 'source_lists_open'])],
            ], [
                'search.max' => 'Use 200 characters or fewer.',
                'search.not_regex' => 'Remove line breaks or control characters from your search.',
                'status.in' => 'Choose a valid publication status.',
            ])->validate();
            if (is_string($request->query('search'))) {
                $request->query->set('search', preg_replace('/\s+/u', ' ', trim($request->query('search'))));
            }
        }

        return $next($request);
    }
}
