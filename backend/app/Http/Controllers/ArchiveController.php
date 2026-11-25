<?php

namespace App\Http\Controllers;

use App\Listeners\AuthenticationActivity;
use App\Models\Enrollment;
use App\Models\TableSetting;
use App\Models\TrainingDemand;
use App\Models\TrainingProgram;
use App\Models\User;
use App\Models\Vacancy;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ArchiveController extends Controller
{
    private const TYPES = ['account', 'vacancy', 'training', 'enrollment', 'demand'];

    public function index(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403);
        $request->validate(['kind' => ['sometimes', Rule::in(['all', ...self::TYPES])]]);
        $queries = [
            DB::table('users')->whereNotNull('archived_at')->selectRaw("id, 'account' as type, name as label, email as context, role as status, archived_at"),
            DB::table('vacancies')->whereNotNull('deleted_at')->selectRaw("id, 'vacancy' as type, title as label, organization as context, status, deleted_at as archived_at"),
            DB::table('training_programs')->whereNotNull('deleted_at')->selectRaw("id, 'training' as type, title as label, provider as context, status, deleted_at as archived_at"),
            DB::table('enrollments')->join('training_programs', 'training_programs.id', '=', 'enrollments.training_program_id')->leftJoin('users', 'users.id', '=', 'enrollments.user_id')->whereNotNull('enrollments.deleted_at')->selectRaw("enrollments.id, 'enrollment' as type, training_programs.title as label, COALESCE(users.name, enrollments.walk_in_name) as context, enrollments.status, enrollments.deleted_at as archived_at"),
        ];
        $queries[] = DB::table('training_demands')->leftJoin('users', 'users.id', '=', 'training_demands.user_id')->whereNotNull('training_demands.deleted_at')->selectRaw("training_demands.id, 'demand' as type, training_demands.topic as label, users.name as context, 'requested' as status, training_demands.deleted_at as archived_at");
        $union = array_shift($queries);
        foreach ($queries as $query) {
            $union->unionAll($query);
        }
        $query = DB::query()->fromSub($union, 'archived');
        if ($request->query('kind', 'all') !== 'all') {
            $query->where('type', $request->query('kind'));
        }
        if ($request->filled('search')) {
            $pattern = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $request->query('search')).'%';
            $query->where(fn ($q) => $q->whereRaw("label LIKE ? ESCAPE '!'", [$pattern])->orWhereRaw("context LIKE ? ESCAPE '!'", [$pattern]));
        }

        return $query->orderByDesc('archived_at')->orderBy('type')->orderByDesc('id')->paginate(TableSetting::perPage())->through(function ($row) {
            $row->archived_at = Carbon::parse($row->archived_at)->toIso8601String();

            return $row;
        });
    }

    public function restore(Request $request, string $type, int $id)
    {
        abort_unless($request->user()->role === 'admin', 403);
        abort_unless(in_array($type, self::TYPES, true), 404);
        if ($type === 'account') {
            $request->validate(['current_password' => ['required', 'string', 'current_password:web']]);
        }

        return DB::transaction(function () use ($request, $type, $id) {
            if ($type === 'account') {
                $row = User::withoutGlobalScope('active')->whereNotNull('archived_at')->lockForUpdate()->findOrFail($id);
                $row->forceFill(['archived_at' => null, 'remember_token' => null])->save();
                app(AuthenticationActivity::class)->record($row, 'auth.account_restored', ['performed_by' => $request->user()->id]);
            } else {
                $class = ['vacancy' => Vacancy::class, 'training' => TrainingProgram::class, 'enrollment' => Enrollment::class, 'demand' => TrainingDemand::class][$type];
                if ($type === 'enrollment') {
                    $candidate = Enrollment::onlyTrashed()->findOrFail($id);
                    // Match enrollment mutations' parent-before-child lock order.
                    $program = TrainingProgram::whereKey($candidate->training_program_id)->lockForUpdate()->first();
                    abort_unless($program && ($candidate->user_id === null || User::whereKey($candidate->user_id)->exists()), 422, 'Restore the linked account and training program first.');
                }
                $row = $class::onlyTrashed()->lockForUpdate()->findOrFail($id);
                if ($type === 'enrollment') {
                    abort_unless(in_array($row->status, ['withdrawn', 'rejected'], true), 422, 'Only withdrawn or rejected enrollment history can be restored.');
                } elseif ($type === 'demand') {
                    abort_unless(User::whereKey($row->user_id)->exists(), 422, 'Restore the linked account first.');
                } else {
                    // Restoration never republishes an expired or unreviewed listing.
                    $row->status = 'draft';
                }
                $row->restore();
            }
            DB::table('audit_events')->insert(['actor_id' => $request->user()->id, 'action' => $type.'.restored', 'entity' => $row->getTable(), 'entity_id' => $id, 'changes' => json_encode(['status' => $row->status ?? $row->role ?? 'requested', 'restored' => true]), 'created_at' => now()]);

            return response()->json(['message' => $type === 'account' ? 'Account restored. A new sign-in is required.' : ($type === 'demand' ? 'Training request restored.' : ($type === 'enrollment' ? 'Enrollment history restored. Its terminal status is unchanged.' : 'Record restored as a draft. Review before publishing.'))]);
        });
    }
}
