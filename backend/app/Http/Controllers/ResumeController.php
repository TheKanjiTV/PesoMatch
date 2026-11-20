<?php

namespace App\Http\Controllers;

use App\Models\ResumeDocument;
use App\Services\ResumeAnalyzer;
use App\Services\ResumeStorage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ResumeController extends Controller
{
    public function show(Request $r)
    {
        $row = ResumeDocument::where('user_id', $r->user()->id)->first();
        if ($row && ($row->detected['method'] ?? null) === 'local-pdf-text-skill-evidence-v1') {
            $row = $this->refreshDocument($row, app(ResumeAnalyzer::class));
        }

        return response()->json(['data' => $row]);
    }

    private function refreshDocument(ResumeDocument $row, ResumeAnalyzer $analyzer): ResumeDocument
    {
        $path = tempnam(sys_get_temp_dir(), 'peso-resume-');
        abort_if($path === false, 503, 'The PDF could not be prepared for local extraction.');
        chmod($path, 0600);
        try {
            file_put_contents($path, app(ResumeStorage::class)->read($row->path));
            $text = $analyzer->extract($path);
            $detected = $analyzer->analyze($text);
        } finally {
            unlink($path);
        }

        return DB::transaction(function () use ($row, $text, $detected) {
            $current = ResumeDocument::whereKey($row->id)->where('user_id', $row->user_id)->where('path', $row->path)->lockForUpdate()->firstOrFail();
            $current->update(['detected' => $detected, 'excerpt' => mb_substr($text, 0, 6000)]);

            return $current;
        });
    }

    public function reanalyze(Request $r, ResumeAnalyzer $analyzer)
    {
        $row = ResumeDocument::where('user_id', $r->user()->id)->firstOrFail();

        return response()->json(['data' => $this->refreshDocument($row, $analyzer), 'message' => 'PDF sections refreshed locally. Review each section before saving profile facts.']);
    }

    public function experience(Request $r)
    {
        $data = $r->validate([
            'reviewed' => 'required|accepted', 'job_title' => 'required|string|max:255', 'company_name' => 'required|string|max:255',
            'industry' => 'nullable|string|max:255', 'employment_type' => ['nullable', Rule::in(['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Self-employed'])],
            'start_date' => 'required|date_format:Y-m-d|before_or_equal:today',
            'is_current' => 'required|boolean', 'end_date' => [Rule::requiredIf(! $r->boolean('is_current')), 'nullable', 'date_format:Y-m-d', 'before_or_equal:today', 'after_or_equal:start_date'],
            'description' => 'nullable|string|max:5000',
        ]);
        if ($r->boolean('is_current') && ! empty($data['end_date'])) {
            throw ValidationException::withMessages(['end_date' => ['A current position cannot have an end date.']]);
        }

        return DB::transaction(function () use ($r, $data) {
            $resume = ResumeDocument::where('user_id', $r->user()->id)->lockForUpdate()->firstOrFail();
            $profile = $r->user()->jobseekerProfile()->firstOrCreate([]);
            $profile = $profile->newQuery()->whereKey($profile->id)->lockForUpdate()->firstOrFail();
            abort_if($profile->workExperiences()->count() >= 30, 422, 'Review your existing work entries before adding more.');
            abort_if($profile->workExperiences()->where('job_title', $data['job_title'])->where('company_name', $data['company_name'])->whereDate('start_date', $data['start_date'])->exists(), 409, 'This work experience is already saved. Edit it in your profile instead of adding it again.');
            unset($data['reviewed']);
            $profile->workExperiences()->create($data);
            $profile->has_work_experience = true;
            $profile->work_experience_completed_at = now();
            $profile->onboarding_step = $profile->onboarding()['current_step'];
            $profile->save();
            DB::table('audit_events')->insert(['actor_id' => $r->user()->id, 'action' => 'resume.experience_reviewed', 'entity' => 'resume_documents', 'entity_id' => $resume->id, 'changes' => json_encode(['reviewed' => true]), 'created_at' => now()]);

            return response()->json(['entry' => $data, 'message' => 'Reviewed work experience added. Existing experience, education and skills were preserved.']);
        });
    }

    public function certification(Request $r)
    {
        $data = $r->validate(['reviewed' => 'required|accepted', 'certification_name' => 'required|string|max:255', 'issuing_organization' => 'nullable|string|max:255', 'issued_at' => 'nullable|date_format:Y-m-d|before_or_equal:today', 'credential_reference' => 'nullable|string|max:255']);

        return DB::transaction(function () use ($r, $data) {
            $resume = ResumeDocument::where('user_id', $r->user()->id)->lockForUpdate()->firstOrFail();
            $profile = $r->user()->jobseekerProfile()->firstOrCreate([]);
            $profile = $profile->newQuery()->whereKey($profile->id)->lockForUpdate()->firstOrFail();
            abort_if($profile->certifications()->count() >= 30, 422, 'Review existing certificates before adding more.');
            abort_if($profile->certifications()->where('certification_name', $data['certification_name'])->where('issuing_organization', $data['issuing_organization'] ?? null)->exists(), 409, 'This certificate is already saved in your profile.');
            unset($data['reviewed']);
            $profile->certifications()->create($data);
            DB::table('audit_events')->insert(['actor_id' => $r->user()->id, 'action' => 'resume.certificate_reviewed', 'entity' => 'resume_documents', 'entity_id' => $resume->id, 'changes' => json_encode(['reviewed' => true]), 'created_at' => now()]);

            return response()->json(['entry' => $data, 'message' => 'Reviewed certificate added under Skills & certifications. Formal education was not changed.']);
        });
    }

    public function upload(Request $r, ResumeAnalyzer $analyzer)
    {
        $r->validate(['resume' => 'required|file|mimes:pdf|extensions:pdf|max:5120']);
        $file = $r->file('resume');
        $text = $analyzer->extract($file->getRealPath());
        $detected = $analyzer->analyze($text);
        $path = app(ResumeStorage::class)->store($r->user()->id, file_get_contents($file->getRealPath()));
        $old = null;
        try {
            $row = DB::transaction(function () use ($r, $file, $path, $detected, $text, &$old) {
                $row = ResumeDocument::where('user_id', $r->user()->id)->lockForUpdate()->first();
                $old = $row?->path;

                return ResumeDocument::updateOrCreate(['user_id' => $r->user()->id], ['filename' => mb_substr(basename($file->getClientOriginalName()), 0, 240), 'path' => $path, 'detected' => $detected, 'excerpt' => mb_substr($text, 0, 6000), 'applied_at' => null]);
            });
        } catch (\Throwable $e) {
            Storage::disk('local')->delete($path);
            throw $e;
        }
        if ($old) {
            Storage::disk('local')->delete($old);
        }

        return response()->json(['data' => $row], 201);
    }

    public function apply(Request $r)
    {
        $data = $r->validate(['skills' => 'present|array|max:100', 'skills.*' => 'required|integer|distinct|exists:skills,id', 'apply_mobile' => 'sometimes|boolean']);

        return DB::transaction(function () use ($r, $data) {
            $row = ResumeDocument::where('user_id', $r->user()->id)->lockForUpdate()->firstOrFail();
            if (array_diff($data['skills'], array_column($row->detected['skills'], 'id'))) {
                throw ValidationException::withMessages(['skills' => ['Select only skills detected in this resume.']]);
            }
            $profile = $r->user()->jobseekerProfile()->firstOrCreate([]);
            $profile->skills()->syncWithoutDetaching($data['skills']);
            if (($data['apply_mobile'] ?? false) && preg_match('/^\+639\d{9}$/', $row->detected['mobile_number'] ?? '')) {
                $profile->update(['mobile_number' => $row->detected['mobile_number']]);
            }
            $row->update(['applied_at' => now()]);
            DB::table('audit_events')->insert(['actor_id' => $r->user()->id, 'action' => 'resume.skills_applied', 'entity' => 'resume_documents', 'entity_id' => $row->id, 'changes' => json_encode(['skill_ids' => $data['skills']]), 'created_at' => now()]);

            return response()->json(['message' => 'Reviewed skills added to your profile. Existing skills and qualifications were preserved.', 'data' => $row]);
        });
    }

    public function download(Request $r)
    {
        $row = ResumeDocument::where('user_id', $r->user()->id)->firstOrFail();

        $bytes = app(ResumeStorage::class)->read($row->path);

        return response()->streamDownload(fn () => print ($bytes), $row->filename, ['Content-Type' => 'application/pdf', 'Cache-Control' => 'private, no-store']);
    }

    public function destroy(Request $r)
    {
        $row = ResumeDocument::where('user_id', $r->user()->id)->first();
        if ($row) {
            $path = $row->path;
            abort_unless(Storage::disk('local')->delete($path), 503, 'The document could not be removed. Please try again or contact the operator.');
            $row->delete();
        }

        return response()->noContent();
    }
}
