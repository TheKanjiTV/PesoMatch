<?php

namespace App\Http\Controllers;

use App\Listeners\AuthenticationActivity;
use App\Models\Enrollment;
use App\Models\ResumeDocument;
use App\Models\TrainingDemand;
use App\Models\TrainingProgram;
use App\Models\User;
use App\Models\Vacancy;
use App\Services\AuthenticationSessions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ArchiveDeletionController extends Controller
{
    private const MODELS = ['account' => User::class, 'vacancy' => Vacancy::class, 'training' => TrainingProgram::class, 'enrollment' => Enrollment::class, 'demand' => TrainingDemand::class];

    private function row(Request $request, string $type, int $id)
    {
        abort_unless($request->user()->role === 'admin' && $request->hasSession(), 403);
        abort_unless(isset(self::MODELS[$type]), 404);
        abort_if($type === 'account' && $id === $request->user()->id, 403);
        $class = self::MODELS[$type];
        $query = $type === 'account' ? User::withoutGlobalScope('active')->whereNotNull('archived_at') : $class::onlyTrashed();
        if (DB::transactionLevel()) {
            $query->lockForUpdate();
        }

        return $query->findOrFail($id);
    }

    private function label($row, string $type): string
    {
        return (string) match ($type) {
            'account' => $row->name,
            'enrollment' => $row->program?->title ?? 'Enrollment #'.$row->id,
            'demand' => $row->topic,
            default => $row->title,
        };
    }

    private function impact($row, string $type): array
    {
        if ($type === 'account') {
            return [
                'profile' => DB::table('jobseeker_profiles')->where('user_id', $row->id)->count(),
                'resume' => ResumeDocument::where('user_id', $row->id)->count(),
                'referrals' => DB::table('referrals')->where('user_id', $row->id)->count(),
                'placements' => DB::table('placements')->where('user_id', $row->id)->count(),
                'enrollments' => DB::table('enrollments')->where('user_id', $row->id)->count(),
                'employment_reports' => DB::table('employment_outcomes')->where('user_id', $row->id)->count(),
                'training_requests' => TrainingDemand::withTrashed()->where('user_id', $row->id)->count(),
                'service_requests' => DB::table('service_requests')->where('user_id', $row->id)->count(),
                'interview_practices' => DB::table('ai_practices')->where('user_id', $row->id)->count(),
            ];
        }
        if ($type === 'vacancy') {
            return [
                'saved_bookmarks' => DB::table('saved_vacancies')->where('vacancy_id', $row->id)->count(),
                'interview_practices' => DB::table('ai_practices')->where('vacancy_id', $row->id)->count(),
                'referrals' => DB::table('referrals')->where('vacancy_id', $row->id)->count(),
                'placements' => DB::table('placements')->whereIn('referral_id', DB::table('referrals')->where('vacancy_id', $row->id)->select('id'))->count(),
            ];
        }
        if ($type === 'training') {
            return ['enrollments' => DB::table('enrollments')->where('training_program_id', $row->id)->count()];
        }

        return [];
    }

    public function intent(Request $request)
    {
        $data = $request->validate(['type' => ['required', Rule::in(array_keys(self::MODELS))], 'id' => 'required|integer|min:1']);
        $data['id'] = (int) $data['id'];
        $row = $this->row($request, $data['type'], $data['id']);
        $impact = $this->impact($row, $data['type']);
        $nonce = bin2hex(random_bytes(16));
        $request->session()->put('permanent_removal_intent', $nonce);

        return response()->json(['token' => Crypt::encryptString(json_encode($data + ['actor' => $request->user()->id, 'nonce' => $nonce, 'ready' => now()->timestamp + 5, 'expires' => now()->timestamp + 300, 'impact' => $impact, 'label' => $this->label($row, $data['type'])])), 'wait_seconds' => 5, 'label' => $this->label($row, $data['type']), 'impact' => $impact]);
    }

    public function destroy(Request $request, string $type, int $id)
    {
        abort_unless($request->user()->role === 'admin' && $request->hasSession(), 403);
        $data = $request->validate(['confirmation_token' => 'required|string|max:8000', 'confirmation_name' => 'required|string|max:500', 'current_password' => 'required|string|current_password:web']);
        try {
            $intent = json_decode(Crypt::decryptString($data['confirmation_token']), true, 512, JSON_THROW_ON_ERROR);
        } catch (\Throwable) {
            abort(422, 'Reopen the permanent deletion confirmation.');
        }
        abort_unless(($intent['actor'] ?? null) === $request->user()->id && ($intent['type'] ?? null) === $type && ($intent['id'] ?? null) === $id && ($intent['nonce'] ?? null) === $request->session()->get('permanent_removal_intent'), 422, 'Reopen the permanent deletion confirmation.');
        abort_unless(now()->timestamp >= $intent['ready'] && now()->timestamp <= $intent['expires'], 422, 'Wait five seconds before confirming permanent deletion.');

        return DB::transaction(function () use ($request, $type, $id, $data, $intent) {
            $row = $this->row($request, $type, $id);
            abort_unless($this->label($row, $type) === $data['confirmation_name'] && $data['confirmation_name'] === $intent['label'], 422, 'Type the complete record name exactly as shown.');
            $impact = $this->impact($row, $type);
            abort_unless($impact === $intent['impact'], 409, 'Linked records changed. Reopen the confirmation to review the updated totals.');
            if ($type === 'account') {
                app(AuthenticationSessions::class)->revoke($row, 'account_deleted');
                $resume = ResumeDocument::where('user_id', $id)->first();
                if ($resume) {
                    abort_unless(Storage::disk('local')->delete($resume->path), 503, 'The private document could not be removed. Please retry.');
                }
                DB::table('ai_embeddings')->where('source_type', 'profile')->where('source_id', $id)->delete();
                DB::table('placements')->where('user_id', $id)->delete();
                app(AuthenticationActivity::class)->record($row, 'auth.account_deleted', ['performed_by' => $request->user()->id]);
                $row->delete();
            } elseif ($type === 'vacancy') {
                $referrals = DB::table('referrals')->where('vacancy_id', $id)->select('id');
                DB::table('placements')->whereIn('referral_id', $referrals)->delete();
                DB::table('referrals')->where('vacancy_id', $id)->delete();
                DB::table('ai_embeddings')->where('source_type', 'vacancy')->where('source_id', $id)->delete();
                $row->forceDelete();
            } else {
                if ($type === 'training') {
                    DB::table('enrollments')->where('training_program_id', $id)->delete();
                }
                $row->forceDelete();
            }
            DB::table('audit_events')->insert(['actor_id' => $request->user()->id, 'action' => $type.'.permanently_deleted', 'entity' => $row->getTable(), 'entity_id' => $id, 'changes' => json_encode(['permanent' => true, 'linked_records_removed' => $impact]), 'created_at' => now()]);
            $request->session()->forget('permanent_removal_intent');

            return response()->json(['message' => 'Record permanently deleted.']);
        });
    }
}
