<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\ResumeDocument;
use App\Models\TrainingProgram;
use App\Models\User;
use App\Models\Vacancy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class RemovalController extends Controller
{
    private function record(Request $r, string $type, int $id)
    {
        $model = ['vacancy' => Vacancy::class, 'training' => TrainingProgram::class, 'enrollment' => Enrollment::class, 'account' => User::class][$type];
        $query = $model::query();
        if (DB::transactionLevel() > 0) {
            $query->lockForUpdate();
        }
        $row = $query->findOrFail($id);
        $staff = in_array($r->user()->role, ['admin', 'peso_staff'], true);
        if ($type === 'account') {
            abort_unless($r->user()->role === 'admin' && $id !== $r->user()->id, 403, 'Use Account Settings to manage your own account.');
            abort_if($row->role === 'admin' && User::where('role', 'admin')->count() <= 1, 422, 'The last administrator cannot be deleted.');
        } elseif ($type === 'enrollment') {
            abort_unless($staff || ($r->user()->role === 'jobseeker' && $row->user_id === $r->user()->id) || ($r->user()->role === 'training_provider' && $row->program->owner_id === $r->user()->id), 403);
            abort_if($row->status === 'completed' || ($r->user()->role !== 'jobseeker' && ! in_array($row->status, ['withdrawn', 'rejected'], true)), 422, 'Completed training is retained as history. Staff can remove only withdrawn or rejected requests.');
        } else {
            $partner = $type === 'training' ? 'training_provider' : 'employer';
            abort_unless($staff || ($r->user()->role === $partner && $row->owner_id === $r->user()->id), 403);
        }

        return $row;
    }

    public function intent(Request $r)
    {
        abort_unless($r->hasSession(), 403, 'Sign in using a browser session to delete a record.');
        $data = $r->validate(['type' => ['required', Rule::in(['vacancy', 'training', 'enrollment', 'account'])], 'id' => 'required|integer|min:1']);
        $this->record($r, $data['type'], $data['id']);
        $nonce = bin2hex(random_bytes(16));
        $r->session()->put('removal_intent', $nonce);

        return response()->json(['token' => Crypt::encryptString(json_encode($data + ['actor' => $r->user()->id, 'nonce' => $nonce, 'ready' => now()->timestamp + 5, 'expires' => now()->timestamp + 300])), 'wait_seconds' => 5]);
    }

    public function destroy(Request $r, string $type, int $id)
    {
        abort_unless($r->hasSession(), 403, 'Sign in using a browser session to delete a record.');
        abort_unless(in_array($type, ['vacancy', 'training', 'enrollment', 'account'], true), 404);
        $r->validate(['confirmation_token' => 'required|string|max:4000']);
        try {
            $intent = json_decode(Crypt::decryptString($r->input('confirmation_token')), true, 512, JSON_THROW_ON_ERROR);
        } catch (\Throwable) {
            abort(422, 'Reopen the delete confirmation.');
        }
        abort_unless(($intent['actor'] ?? null) === $r->user()->id && ($intent['type'] ?? null) === $type && ($intent['id'] ?? null) === $id && ($intent['nonce'] ?? null) === $r->session()->get('removal_intent'), 422, 'Reopen the delete confirmation.');
        abort_unless(now()->timestamp >= $intent['ready'] && now()->timestamp <= $intent['expires'], 422, 'Wait five seconds, then confirm deletion.');
        if ($type === 'account') {
            $r->validate(['current_password' => ['bail', 'required', 'string', 'current_password:web']]);
        }

        return DB::transaction(function () use ($r, $type, $id) {
            // Lock and recheck permissions/state after the thinking period.
            if ($type === 'account') {
                User::where(fn ($q) => $q->whereIn('id', [$r->user()->id, $id])->orWhere('role', 'admin'))->orderBy('id')->lockForUpdate()->get();
            } elseif ($type === 'enrollment') {
                $target = Enrollment::findOrFail($id);
                // Match confirmation/completion lock order and recheck the row
                // after acquiring locks, so completed training cannot be erased.
                TrainingProgram::withTrashed()->whereKey($target->training_program_id)->lockForUpdate()->firstOrFail();
            }
            $row = $this->record($r, $type, $id);
            if ($type === 'enrollment' && ! in_array($row->status, ['withdrawn', 'rejected'], true)) {
                $row->update(['status' => 'withdrawn', 'updated_by' => $r->user()->id]);
            }
            if ($type === 'account') {
                $resume = ResumeDocument::where('user_id', $id)->first();
                if ($resume) {
                    abort_unless(Storage::disk('local')->delete($resume->path), 503, 'The private document could not be removed. Account deletion was stopped.');
                }
                DB::table('sessions')->where('user_id', $id)->delete();
            }
            DB::table('audit_events')->insert(['actor_id' => $r->user()->id, 'entity' => $row->getTable(), 'entity_id' => $id, 'action' => $type.'.deleted', 'changes' => json_encode(['removal' => $type === 'account' ? 'account_erasure' : 'soft_delete']), 'created_at' => now()]);
            $row->delete();
            $r->session()->forget('removal_intent');

            return response()->json(['message' => $type === 'account' ? 'Account deleted and sessions revoked.' : 'Removed from active records. Linked history is preserved.']);
        });
    }
}
