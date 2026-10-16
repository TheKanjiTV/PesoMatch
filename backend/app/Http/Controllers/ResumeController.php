<?php

namespace App\Http\Controllers;

use App\Models\ResumeDocument;
use App\Services\ResumeAnalyzer;
use App\Services\ResumeStorage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ResumeController extends Controller
{
    public function show(Request $r)
    {
        return response()->json(['data' => ResumeDocument::where('user_id', $r->user()->id)->first()]);
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
