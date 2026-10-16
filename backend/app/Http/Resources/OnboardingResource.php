<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OnboardingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $education = $this->education;
        $preferences = $this->preferences;

        return [
            'personal' => ['first_name' => $this->user->first_name ?? '', 'middle_name' => $this->user->middle_name ?? '', 'last_name' => $this->user->last_name ?? '', 'birth_date' => $this->birth_date?->format('Y-m-d') ?? '', 'sex' => $this->sex ?? '', 'mobile_number' => $this->mobile_number ?? '', 'address_line' => $this->address_line ?? '', 'province' => $this->province ?? '', 'municipality' => $this->municipality ?? '', 'barangay' => $this->barangay ?? ''],
            'education' => ['highest_attainment' => $education?->highest_attainment ?? '', 'school_name' => $education?->school_name ?? '', 'course_program' => $education?->course_program ?? '', 'year_graduated' => $education?->year_graduated ?? '', 'year_level' => $education?->year_level ?? '', 'educational_status' => $education?->educational_status ?? ''],
            'skills' => ['skills' => $this->skills->pluck('id')->values(), 'certifications' => $this->certifications->map(fn ($row) => ['certification_name' => $row->certification_name, 'issuing_organization' => $row->issuing_organization ?? '', 'issued_at' => $row->issued_at?->format('Y-m-d') ?? '', 'credential_reference' => $row->credential_reference ?? '']), 'languages' => $this->languages->map(fn ($row) => ['language' => $row->language, 'proficiency' => $row->proficiency]), 'licenses' => $this->licenses->map(fn ($row) => ['license_name' => $row->license_name, 'license_number' => $row->license_number ?? '', 'expiry_date' => $row->expiry_date?->format('Y-m-d') ?? ''])],
            'work_experience' => ['has_experience' => $this->has_work_experience, 'experiences' => $this->workExperiences->map(fn ($row) => ['job_title' => $row->job_title, 'company_name' => $row->company_name, 'industry' => $row->industry ?? '', 'employment_type' => $row->employment_type ?? '', 'start_date' => $row->start_date->format('Y-m-d'), 'end_date' => $row->end_date?->format('Y-m-d') ?? '', 'is_current' => $row->is_current, 'description' => $row->description ?? ''])],
            'preferences' => ['occupations' => $preferences?->occupations->pluck('value')->values() ?? [], 'preferred_industry' => $preferences?->preferred_industry ?? '', 'preferred_location' => $preferences?->preferred_location ?? '', 'employment_types' => $preferences?->employmentTypes->pluck('value')->values() ?? [], 'work_arrangements' => $preferences?->workArrangements->pluck('value')->values() ?? [], 'willing_to_relocate' => $preferences?->willing_to_relocate ?? false],
        ];
    }
}
