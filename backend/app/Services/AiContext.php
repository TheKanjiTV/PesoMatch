<?php

namespace App\Services;

use App\Models\ResumeDocument;
use App\Models\TrainingProgram;
use App\Models\User;
use App\Models\Vacancy;

class AiContext
{
    public function redact(string $text, User $user): string
    {
        $text = preg_replace('/^\s*(?:address|tirahan|date of birth|birthday|birth date|gender|sex|civil status|religion|nationality)\s*:.*$/imu', '[personal field removed]', $text);
        $text = preg_replace('/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i', '[email removed]', $text);
        $text = preg_replace('/(?<!\w)(?:\+?63|0)9[\d\s()-]{9,15}/', '[phone removed]', $text);
        foreach ([$user->name, $user->first_name, $user->last_name, $user->jobseekerProfile?->address_line, $user->jobseekerProfile?->mobile_number] as $value) {
            if (filled($value) && mb_strlen($value) >= 3) {
                $text = str_ireplace($value, '[identity removed]', $text);
            }
        }

        return $text;
    }

    public function profile(User $user): array
    {
        $p = $user->jobseekerProfile;
        $evidence = [];
        if (! $p) {
            return [];
        }
        foreach ($p->skills as $s) {
            $evidence[] = ['id' => 'skill-'.$s->id, 'text' => $s->name];
        }
        if ($p->education) {
            $evidence[] = ['id' => 'education', 'text' => implode(' · ', array_filter([$p->education->highest_attainment, $p->education->course_program, $p->education->educational_status]))];
        }
        foreach ($p->workExperiences as $e) {
            $evidence[] = ['id' => 'experience-'.$e->id, 'text' => mb_substr($this->redact(implode(' · ', array_filter([$e->job_title, $e->industry, $e->description])), $user), 0, 1800)];
        }
        foreach ($p->licenses as $l) {
            $evidence[] = ['id' => 'license-'.$l->id, 'text' => $l->license_name.'; expiry: '.($l->expiry_date?->toDateString() ?? 'not stated')];
        }
        foreach ($p->certifications as $c) {
            $evidence[] = ['id' => 'certificate-'.$c->id, 'text' => (string) $c->certification_name];
        }

        return array_slice($evidence, 0, 50);
    }

    public function resume(User $user): array
    {
        $resume = ResumeDocument::where('user_id', $user->id)->first();
        abort_unless($resume && mb_strlen(trim($resume->excerpt ?? '')) >= 40, 422, 'No readable resume text is available. Upload a PDF with selectable text in your profile first.');
        $text = $this->redact($resume->excerpt, $user);

        return ['id' => 'resume', 'text' => $text, 'scope' => 'Stored extracted excerpt only, at most 6000 characters. This is not a full-document review.'];
    }

    public function vacancy(Vacancy $v): array
    {
        return ['id' => $v->id, 'title' => $v->title, 'industry' => $v->industry, 'description' => mb_substr($v->description, 0, 8000), 'required_skills' => $v->skills];
    }

    public function training(Vacancy $v): array
    {
        // Retrieve database records by actual declared skill topics. No model-authored catalog.
        $q = TrainingProgram::available()->where('is_sample', false);
        if (! $v->skills) {
            return [];
        }
        $q->where(function ($q) use ($v) {
            foreach ($v->skills as $skill) {
                $q->orWhereJsonContains('skills', $skill);
            }
        });

        return $q->orderBy('id')->limit(12)->get()->map(fn ($p) => ['id' => $p->id, 'title' => $p->title, 'provider' => $p->provider, 'skills' => $p->skills, 'catalog_only' => $p->external_enrollment])->all();
    }
}
