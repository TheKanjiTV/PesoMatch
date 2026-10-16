<?php

namespace App\Services;

use App\Models\JobseekerProfile;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OnboardingService
{
    public function profile(User $user): JobseekerProfile
    {
        return $user->jobseekerProfile()->firstOrCreate([]);
    }

    public function save(User $user, string $section, array $data): JobseekerProfile
    {
        return DB::transaction(function () use ($user, $section, $data) {
            $profile = $this->profile($user);
            // Ownership comes exclusively from the authenticated user's relationship.
            if ($section === 'personal') {
                $names = Arr::only($data, ['first_name', 'middle_name', 'last_name']);
                $names['name'] = trim($names['first_name'].' '.$names['last_name']);
                $user->update($names);
                $profile->fill(Arr::only($data, ['birth_date', 'sex', 'mobile_number', 'address_line', 'province', 'municipality', 'barangay']));
            } elseif ($section === 'education') {
                $profile->education()->updateOrCreate([], Arr::only($data, ['highest_attainment', 'school_name', 'course_program', 'year_graduated', 'year_level', 'educational_status']));
            } elseif ($section === 'skills') {
                $profile->skills()->sync($data['skills']);
                foreach (['certifications', 'languages', 'licenses'] as $relation) {
                    $profile->{$relation}()->delete();
                    $profile->{$relation}()->createMany($data[$relation] ?? []);
                }
            } elseif ($section === 'work_experience') {
                $profile->has_work_experience = $data['has_experience'];
                $profile->workExperiences()->delete();
                $profile->workExperiences()->createMany($data['experiences'] ?? []);
            } elseif ($section === 'preferences') {
                $preferences = $profile->preferences()->updateOrCreate([], Arr::only($data, ['preferred_industry', 'preferred_location', 'willing_to_relocate']));
                foreach (['occupations' => 'occupations', 'employment_types' => 'employmentTypes', 'work_arrangements' => 'workArrangements'] as $field => $relation) {
                    $preferences->{$relation}()->delete();
                    $preferences->{$relation}()->createMany(array_map(fn ($value) => ['value' => $value], $data[$field]));
                }
            }
            $profile->{$section.'_completed_at'} = now();
            $profile->onboarding_step = $profile->onboarding()['current_step'];
            $profile->save();

            return $profile->fresh();
        });
    }

    public function complete(User $user): JobseekerProfile
    {
        $profile = $this->profile($user);
        if (count($profile->onboarding()['completed_steps']) !== 5) {
            throw ValidationException::withMessages(['onboarding' => ['Complete every required profile step before finishing.']]);
        }
        if ($profile->profile_completed_at === null) {
            $profile->profile_completed_at = now();
            $profile->profile_completion_status = 'complete';
            $profile->onboarding_step = 5;
            $profile->save();
        }

        return $profile->fresh();
    }
}
