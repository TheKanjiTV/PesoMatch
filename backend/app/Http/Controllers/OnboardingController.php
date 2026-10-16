<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveOnboardingRequest;
use App\Http\Resources\OnboardingResource;
use App\Models\JobseekerProfile;
use App\Services\OnboardingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OnboardingController extends Controller
{
    public function __construct(private OnboardingService $service) {}

    private function response(JobseekerProfile $profile, ?string $message = null): JsonResponse
    {
        $profile->load(['user', 'education', 'skills', 'certifications', 'languages', 'licenses', 'workExperiences', 'preferences.occupations', 'preferences.employmentTypes', 'preferences.workArrangements']);

        return response()->json(array_filter(['message' => $message, 'data' => (new OnboardingResource($profile))->resolve(), 'onboarding' => $profile->onboarding()], fn ($value) => $value !== null));
    }

    public function show(Request $request): JsonResponse
    {
        return $this->response($this->service->profile($request->user()));
    }

    public function update(SaveOnboardingRequest $request): JsonResponse
    {
        $section = $request->section();
        $messages = ['personal' => 'Personal information saved.', 'education' => 'Education details saved.', 'skills' => 'Skills updated.', 'work_experience' => 'Work experience saved.', 'preferences' => 'Job preferences saved.'];

        return $this->response($this->service->save($request->user(), $section, $request->validated()), $messages[$section]);
    }

    public function complete(Request $request): JsonResponse
    {
        return $this->response($this->service->complete($request->user()), 'Your jobseeker profile is complete.');
    }
}
