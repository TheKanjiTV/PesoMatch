<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\TableSetting;
use App\Models\TrainingDemand;
use App\Models\TrainingProgram;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TrainingParticipationController extends Controller
{
    private function staff(Request $r): void
    {
        abort_unless(in_array($r->user()->role, ['peso_staff', 'admin'], true), 403);
    }

    public function roster(Request $r, TrainingProgram $program)
    {
        $this->staff($r);

        return Enrollment::with('user:id,name')->where('training_program_id', $program->id)->orderBy('id')->paginate(TableSetting::perPage());
    }

    public function store(Request $r, TrainingProgram $program)
    {
        $this->staff($r);
        $data = $r->validate([
            'user_id' => ['nullable', 'integer', Rule::exists('users', 'id')->where('role', 'jobseeker')],
            'walk_in_name' => 'required_without:user_id|nullable|string|max:160',
            'municipality' => 'required|string|max:160',
            'participant_reference' => 'required|string|max:100',
            'consent' => 'required|accepted', 'notes' => 'required|string|min:10|max:2000',
        ]);

        return DB::transaction(function () use ($r, $program, $data) {
            $program = TrainingProgram::whereKey($program->id)->lockForUpdate()->firstOrFail();
            abort_unless(! $program->external_enrollment && $program->status === 'published' && $program->starts_on >= today()->toDateString(), 422, 'Choose a published upcoming local training intake.');
            $used = Enrollment::where('training_program_id', $program->id)->whereIn('status', ['confirmed', 'in_progress', 'completed'])->count();
            abort_if($used >= $program->capacity, 422, 'This training is full.');
            $duplicate = Enrollment::withTrashed()->where('training_program_id', $program->id)->where(function ($q) use ($data) {
                $q->where('participant_reference', $data['participant_reference']);
                if (! empty($data['user_id'])) {
                    $q->orWhere('user_id', $data['user_id']);
                }
            })->exists();
            abort_if($duplicate, 409, 'This participant is already recorded for this intake.');
            unset($data['consent']);
            if (! empty($data['user_id'])) {
                $data['walk_in_name'] = null;
            }
            $row = Enrollment::create($data + ['training_program_id' => $program->id, 'status' => 'confirmed', 'entry_method' => 'peso_assisted', 'consent_accepted_at' => now(), 'consent_notice_version' => config('security.enrollment_notice_version'), 'consent_recipient' => $program->provider, 'updated_by' => $r->user()->id]);
            DB::table('audit_events')->insert(['actor_id' => $r->user()->id, 'action' => 'enrollment.peso_assisted', 'entity' => 'enrollments', 'entity_id' => $row->id, 'changes' => json_encode(['status' => 'confirmed', 'consent' => true]), 'created_at' => now()]);

            return response()->json(['data' => $row], 201);
        });
    }

    public function demands(Request $r)
    {
        abort_unless(in_array($r->user()->role, ['jobseeker', 'peso_staff', 'admin'], true), 403);
        if ($r->user()->role === 'jobseeker') {
            return DB::table('training_demands')->whereNull('deleted_at')->where('user_id', $r->user()->id)->orderBy('topic')->orderBy('id')->paginate(TableSetting::perPage());
        }

        if ($r->filled('topic_key')) {
            $key = $r->validate(['topic_key' => 'required|string|max:160'])['topic_key'];

            return DB::table('training_demands')->leftJoin('users', 'users.id', '=', 'training_demands.user_id')->whereNull('training_demands.deleted_at')->where('topic_key', $key)->select('training_demands.*', 'users.name')->orderByDesc('training_demands.updated_at')->paginate(TableSetting::perPage());
        }

        return response()->json(DB::table('training_demands')->whereNull('deleted_at')->select('topic_key')->selectRaw('MIN(topic) as topic, COUNT(DISTINCT user_id) as interested_jobseekers')->groupBy('topic_key')->orderByDesc('interested_jobseekers')->orderBy('topic_key')->paginate(TableSetting::perPage())->toArray() + ['note' => 'Planning demand only. Counts do not create or approve a training intake.']);
    }

    public function demand(Request $r)
    {
        abort_unless($r->user()->role === 'jobseeker', 403);
        $required = $r->boolean('wizard_completed') ? 'required' : 'nullable';
        $data = $r->validate(['topic' => 'required|string|min:3|max:160', 'source_program_id' => 'nullable|integer|exists:training_programs,id',
            'wizard_completed' => 'sometimes|boolean', 'description' => $required.'|string|min:10|max:2000',
            'preferred_start' => $required.'|date|after_or_equal:today', 'preferred_end' => $required.'|date|after_or_equal:preferred_start',
            'preferred_schedule' => $required.'|string|max:160', 'mode' => $required.'|in:In person,Online,Blended',
            'location' => $required.'|string|max:160', 'goal' => $required.'|string|min:10|max:2000']);
        unset($data['wizard_completed']);
        if (! empty($data['source_program_id'])) {
            $source = TrainingProgram::available()->findOrFail($data['source_program_id']);
            $data['topic'] = $source->title;
        }
        $key = mb_strtolower(preg_replace('/\s+/u', ' ', trim($data['topic'])));
        $details = array_fill_keys(['description', 'preferred_start', 'preferred_end', 'preferred_schedule', 'mode', 'location', 'goal'], null);
        $details = array_replace($details, array_intersect_key($data, $details));
        $existing = DB::table('training_demands')->where('user_id', $r->user()->id)->where('topic_key', $key)->first();
        if (! $r->boolean('wizard_completed') && $existing) {
            foreach ($details as $field => $value) {
                $details[$field] = $data[$field] ?? $existing->$field;
            }
        }
        DB::table('training_demands')->upsert([array_merge($details, ['user_id' => $r->user()->id, 'topic' => trim($data['topic']), 'topic_key' => $key, 'source_program_id' => $data['source_program_id'] ?? null, 'created_at' => now(), 'updated_at' => now(), 'deleted_at' => null])], ['user_id', 'topic_key'], ['updated_at', 'deleted_at', 'description', 'preferred_start', 'preferred_end', 'preferred_schedule', 'mode', 'location', 'goal']);

        $id = DB::table('training_demands')->where('user_id', $r->user()->id)->where('topic_key', $key)->value('id');
        DB::table('audit_events')->insert(['actor_id' => $r->user()->id, 'action' => 'training.topic_requested', 'entity' => 'training_demands', 'entity_id' => $id, 'changes' => json_encode(['changed_fields' => array_keys($data)]), 'created_at' => now()]);

        return response()->json(['message' => 'Training topic request submitted.'], 201);
    }

    public function archiveDemand(Request $r, int $id)
    {
        abort_unless(in_array($r->user()->role, ['jobseeker', 'peso_staff', 'admin'], true), 403);

        return DB::transaction(function () use ($r, $id) {
            $row = TrainingDemand::lockForUpdate()->findOrFail($id);
            abort_unless($r->user()->role !== 'jobseeker' || $row->user_id === $r->user()->id, 403);
            $this->archiveRows($r, collect([$row]));

            return response()->json(['message' => 'Training request archived.']);
        });
    }

    private function archiveRows(Request $r, $rows): void
    {
        TrainingDemand::whereIn('id', $rows->pluck('id'))->update(['deleted_at' => now(), 'updated_at' => now()]);
        DB::table('audit_events')->insert($rows->map(fn ($row) => ['actor_id' => $r->user()->id, 'action' => 'demand.archived', 'entity' => 'training_demands', 'entity_id' => $row->id, 'changes' => json_encode(['archived' => true]), 'created_at' => now()])->all());
    }
}
