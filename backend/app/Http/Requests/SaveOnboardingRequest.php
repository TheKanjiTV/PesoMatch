<?php

namespace App\Http\Requests;

use App\Models\JobseekerProfile;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class SaveOnboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->role === 'jobseeker';
    }

    public function section(): string
    {
        $section = $this->route('section') ?? $this->input('section', '');

        return is_string($section) ? str_replace('-', '_', $section) : '';
    }

    public static function normalizePhone(?string $number): ?string
    {
        if ($number === null) {
            return null;
        }
        $digits = preg_replace('/[\s()+-]/', '', $number);
        if (preg_match('/^09\d{9}$/', $digits)) {
            $digits = '63'.substr($digits, 1);
        } elseif (preg_match('/^9\d{9}$/', $digits)) {
            $digits = '63'.$digits;
        }

        return '+'.$digits;
    }

    protected function prepareForValidation(): void
    {
        if ($this->section() === 'personal' && is_string($this->input('mobile_number'))) {
            $this->merge(['mobile_number' => self::normalizePhone($this->input('mobile_number'))]);
        }
    }

    public function rules(): array
    {
        $common = ['user_id' => ['prohibited'], 'jobseeker_profile_id' => ['prohibited'], 'profile_completed_at' => ['prohibited'], 'onboarding_step' => ['prohibited'], 'section' => ['sometimes', Rule::in(JobseekerProfile::STEPS)]];
        $rules = match ($this->section()) {
            'personal' => [
                'first_name' => ['required', 'string', 'max:100'], 'middle_name' => ['nullable', 'string', 'max:100'], 'last_name' => ['required', 'string', 'max:100'],
                'birth_date' => ['required', 'date_format:Y-m-d', 'before:today'], 'sex' => ['nullable', 'string', Rule::in(['Male', 'Female', 'Prefer not to say', 'Other'])],
                'mobile_number' => ['required', 'string', 'regex:/^\+639\d{9}$/'], 'address_line' => ['required', 'string', 'max:255'],
                'province' => ['required', 'string', 'max:100'], 'municipality' => ['required', 'string', 'max:100'], 'barangay' => ['required', 'string', 'max:100'],
            ],
            'education' => [
                'highest_attainment' => ['required', Rule::in(['Senior High School', 'Vocational / TESDA', 'College Level', 'College Graduate', 'Postgraduate'])],
                'school_name' => ['required', 'string', 'max:255'], 'course_program' => ['nullable', 'string', 'max:255'],
                'year_level' => ['nullable', Rule::in(['1st', '2nd', '3rd', '4th', '5th', '5+'])],
                'year_graduated' => ['nullable', 'integer', 'min:1900', 'max:'.now()->year],
                'educational_status' => ['required', Rule::in(['Currently Studying', 'Graduated', 'Undergraduate', 'Vocational Graduate', 'Other'])],
            ],
            'skills' => [
                'skills' => ['required', 'array', 'min:1', 'max:50'], 'skills.*' => ['required', 'integer', 'distinct', Rule::exists('skills', 'id')],
                'certifications' => ['sometimes', 'array', 'max:30'], 'certifications.*' => ['array:certification_name,issuing_organization,issued_at,credential_reference'],
                'certifications.*.certification_name' => ['required', 'string', 'max:255'], 'certifications.*.issuing_organization' => ['nullable', 'string', 'max:255'],
                'certifications.*.issued_at' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:today'], 'certifications.*.credential_reference' => ['nullable', 'string', 'max:255'],
                'languages' => ['sometimes', 'array', 'max:30'], 'languages.*' => ['array:language,proficiency'],
                'languages.*.language' => ['required', 'string', 'max:100'], 'languages.*.proficiency' => ['required', 'string', 'max:100'],
                'licenses' => ['sometimes', 'array', 'max:30'], 'licenses.*' => ['array:license_name,license_number,expiry_date'],
                'licenses.*.license_name' => ['required', 'string', 'max:255'], 'licenses.*.license_number' => ['nullable', 'string', 'max:100'], 'licenses.*.expiry_date' => ['nullable', 'date_format:Y-m-d'],
            ],
            'work_experience' => [
                'has_experience' => ['required', 'boolean'], 'experiences' => ['required_if:has_experience,true', 'array', 'max:30'],
                'experiences.*' => ['array:job_title,company_name,industry,employment_type,start_date,end_date,is_current,description'],
                'experiences.*.job_title' => ['required', 'string', 'max:255'], 'experiences.*.company_name' => ['required', 'string', 'max:255'],
                'experiences.*.industry' => ['nullable', 'string', 'max:255'], 'experiences.*.employment_type' => ['nullable', Rule::in(['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Self-employed'])],
                'experiences.*.start_date' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
                'experiences.*.end_date' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:today'],
                'experiences.*.is_current' => ['required', 'boolean'], 'experiences.*.description' => ['nullable', 'string', 'max:5000'],
            ],
            'preferences' => [
                'occupations' => ['required', 'array', 'min:1', 'max:15'], 'occupations.*' => ['required', 'string', 'max:100', 'distinct:ignore_case'],
                'preferred_industry' => ['nullable', 'string', 'max:255'], 'preferred_location' => ['required', 'string', 'max:255'],
                'employment_types' => ['required', 'array', 'min:1', 'max:4'], 'employment_types.*' => ['required', 'distinct', Rule::in(['Full-time', 'Part-time', 'Contract', 'Temporary'])],
                'work_arrangements' => ['required', 'array', 'min:1', 'max:3'], 'work_arrangements.*' => ['required', 'distinct', Rule::in(['On-site', 'Hybrid', 'Remote'])],
                'willing_to_relocate' => ['required', 'boolean'],
            ],
            default => ['section' => ['required', Rule::in(JobseekerProfile::STEPS)]],
        };

        return array_merge($common, $rules);
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }
            $index = array_search($this->section(), JobseekerProfile::STEPS, true);
            $profile = $this->user()->jobseekerProfile()->first();
            $current = $profile?->onboarding()['current_step'] ?? 1;
            if ($index !== false && $index + 1 > $current) {
                $validator->errors()->add('section', 'Please complete the previous profile steps first.');
            }
            if ($this->section() !== 'work_experience') {
                return;
            }
            $experiences = $this->input('experiences', []);
            if ($this->boolean('has_experience') && count($experiences) === 0) {
                $validator->errors()->add('experiences', 'Add at least one experience, or choose No.');
            }
            if (! $this->boolean('has_experience') && count($experiences) > 0) {
                $validator->errors()->add('experiences', 'Remove work entries before choosing No experience.');
            }
            foreach ($experiences as $i => $row) {
                if (! $row['is_current'] && empty($row['end_date'])) {
                    $validator->errors()->add("experiences.$i.end_date", 'Enter an end date or select I currently work here.');
                }
                if (! empty($row['end_date']) && $row['end_date'] < $row['start_date']) {
                    $validator->errors()->add("experiences.$i.end_date", 'The end date must be on or after the start date.');
                }
                if ($row['is_current'] && ! empty($row['end_date'])) {
                    $validator->errors()->add("experiences.$i.end_date", 'A current position cannot have an end date.');
                }
            }
        }];
    }

    public function messages(): array
    {
        return ['mobile_number.regex' => 'Enter a valid Philippine mobile number, such as +63 917 123 4567.'];
    }
}
