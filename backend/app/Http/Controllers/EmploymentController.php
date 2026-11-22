<?php

namespace App\Http\Controllers;

use App\Models\EmploymentOutcome;
use App\Models\Enrollment;
use App\Models\LoginPolicy;
use App\Models\TableSetting;
use App\Models\Placement;
use App\Models\PublicResource;
use App\Models\Referral;
use App\Models\ServiceEvent;
use App\Models\ServiceRequest;
use App\Models\TrainingProgram;
use App\Models\User;
use App\Models\Vacancy;
use App\Rules\PasswordBytes;
use App\Services\EmploymentMatcher;
use App\Services\TrainingSources;
use App\Services\VacancySources;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class EmploymentController extends Controller
{
    public const SERVICES = ['Career guidance & counseling', 'Pre-employment orientation', 'Employability assessment', 'Livelihood & self-employment referral', 'Returning worker reintegration', 'Job fair assistance', 'SPES / GIP / JobStart coordination', 'Displaced worker / PWD assistance'];

    private function staff(Request $r): bool
    {
        return in_array($r->user()->role, ['peso_staff', 'admin'], true);
    }

    private function roles(Request $r, array $roles): void
    {
        abort_unless(in_array($r->user()->role, $roles, true), 403, 'Your role cannot perform this action.');
    }

    private function audit(Request $r, string $action, $row, array $changes = []): void
    {
        // Preserve accountability without duplicating free-text personal data in logs.
        $summary = ['changed_fields' => array_values(array_diff(array_keys($changes), ['current_password']))];
        $summary += array_intersect_key($changes, array_flip(['status', 'role', 'consent', 'slots', 'capacity', 'rows_per_page']));
        DB::table('audit_events')->insert(['actor_id' => $r->user()->id, 'action' => $action, 'entity' => $row->getTable(), 'entity_id' => $row->id, 'changes' => json_encode($summary), 'created_at' => now()]);
    }

    private function transition(string $current, string $next, array $map): void
    {
        if (! in_array($next, $map[$current] ?? [], true)) {
            throw ValidationException::withMessages(['status' => ["Cannot change {$current} to {$next}."]]);
        }
    }

    private function participants($query, Request $r)
    {
        return $this->staff($r) ? $query : $query->where('user_id', $r->user()->id);
    }

    private function searchPattern(Request $r): string
    {
        // Bind the value and treat LIKE metacharacters as literal search text.
        return '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], (string) $r->query('search', '')).'%';
    }

    private function searchCatalog($query, Request $r, array $columns): void
    {
        if (! $r->filled('search')) {
            return;
        }
        $pattern = $this->searchPattern($r);
        $query->where(function ($q) use ($columns, $pattern) {
            // Column names are server-owned constants at each call site.
            foreach ($columns as $column) {
                $q->orWhereRaw("{$column} LIKE ? ESCAPE '!'", [$pattern]);
            }
        });
    }

    public function publicCatalog()
    {
        return response()->json(['vacancies' => Vacancy::available()->where('is_sample', false)->orderByRaw('COALESCE(source_posted_on, DATE(created_at)) DESC')->latest()->orderByDesc('id')->limit(6)->get(), 'training' => TrainingProgram::available()->where('is_sample', false)->orderBy('starts_on')->orderBy('title')->orderBy('id')->limit(6)->get(), 'events' => ServiceEvent::where('is_sample', false)->where('status', 'published')->where(fn ($q) => $q->where('starts_at', '>=', now())->orWhereDate('event_date', '>=', today()))->orderBy('event_date')->orderBy('starts_at')->limit(6)->get(), 'services' => self::SERVICES]);
    }

    public function vacancies(Request $r)
    {
        $q = Vacancy::currentSource();
        if (! $r->filled('id') && ! ($r->boolean('include_samples') && app()->environment(['local', 'testing']))) {
            $q->where('is_sample', false);
        }
        if ($r->filled('id')) {
            $q->whereKey($r->integer('id'));
        }
        if ($r->user()->role === 'employer') {
            if ($r->query('scope') !== 'all') {
                $q->where('owner_id', $r->user()->id);
            } elseif ($r->filled('id')) {
                $q->where(fn ($visible) => $visible->where('owner_id', $r->user()->id)
                    ->orWhere(fn ($published) => $published->available()->where('is_sample', false)));
            } else {
                $q->available();
            }
        } elseif (! $this->staff($r)) {
            $q->available();
        }
        $this->searchCatalog($q, $r, ['title', 'organization', 'location', 'skills', 'description']);
        if ($r->query('availability') === 'source_lists_open') {
            $q->where('external_application', true)->where(fn ($source) => $source->where('source_url', 'like', VacancySources::NEGROS_PREFIX.'%')->orWhere('source_url', 'like', VacancySources::ORIENTAL.'%'))
                ->whereDate('deadline', '>=', today())->where('source_checked_at', '>=', now()->subDays(7));
        }
        if (in_array($r->query('status'), Vacancy::STATUSES, true)) {
            $q->where('status', $r->query('status'));
        }
        foreach (['organization', 'employment_type'] as $column) {
            if ($r->filled($column)) {
                $q->where($column, $r->query($column));
            }
        }
        if ($r->filled('location')) {
            $location = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $r->query('location'));
            $q->whereRaw("location LIKE ? ESCAPE '!'", ['%'.$location.'%']);
        }
        if ($r->boolean('saved')) {
            $q->whereIn('id', DB::table('saved_vacancies')->where('user_id', $r->user()->id)->select('vacancy_id'));
        }

        $q->orderBy('is_sample');
        match ($r->query('sort')) {
            'title' => $q->orderBy('title'),
            '-title' => $q->orderByDesc('title'),
            'oldest' => $q->orderByRaw('COALESCE(source_posted_on, DATE(created_at))')->oldest(),
            default => $q->orderByRaw('COALESCE(source_posted_on, DATE(created_at)) DESC')->latest(),
        };

        return $q->orderByDesc('id')->paginate(TableSetting::perPage());
    }

    public function employers(Request $r)
    {
        $this->roles($r, ['employer', 'peso_staff', 'admin']);
        $q = Vacancy::available()->where('is_sample', false)->where('organization', '<>', '');
        $this->searchCatalog($q, $r, ['organization']);

        return $q->select('organization')->selectRaw('COUNT(*) as vacancy_count')
            ->groupBy('organization')->orderBy('organization', $r->query('sort') === '-title' ? 'desc' : 'asc')
            ->toBase()->paginate(TableSetting::perPage());
    }

    public function saveVacancy(Request $r, ?Vacancy $vacancy = null)
    {
        $this->roles($r, ['peso_staff', 'admin', 'employer']);
        if ($vacancy?->exists && ! $this->staff($r)) {
            abort_unless($vacancy->owner_id === $r->user()->id, 403);
        }
        abort_if($vacancy?->external_application, 422, 'Source listings are maintained through the researched source import.');
        $data = $r->validate(['title' => 'required|string|max:160', 'organization' => 'required|string|max:160', 'location' => 'required|string|max:160', 'industry' => 'required|string|max:120', 'employment_type' => ['required', Rule::in(['Full-time', 'Part-time', 'Contractual', 'Seasonal', 'Internship'])], 'description' => 'required|string|max:8000', 'skills' => 'required|array|min:1|max:30', 'skills.*' => 'required|string|max:100|distinct:ignore_case', 'slots' => 'required|integer|min:1|max:10000', 'salary_min' => 'nullable|integer|min:0', 'salary_max' => 'nullable|integer|gte:salary_min', 'deadline' => ($vacancy?->exists ? 'required|date' : 'required|date|after_or_equal:today'), 'status' => ['required', Rule::in(Vacancy::STATUSES)]]);
        if (! $this->staff($r) && $data['status'] === 'published') {
            $data['status'] = 'pending_review';
        }

        return DB::transaction(function () use ($r, $vacancy, $data) {
            $row = $vacancy?->exists
                ? Vacancy::whereKey($vacancy->id)->lockForUpdate()->firstOrFail()
                : new Vacancy(['owner_id' => $r->user()->id]);
            abort_unless($this->staff($r) || $row->owner_id === $r->user()->id, 403);
            $row->fill($data)->save();
            $this->audit($r, 'vacancy.saved', $row, $data);

            return response()->json(['data' => $row]);
        });
    }

    public function programs(Request $r)
    {
        $q = TrainingProgram::query()->withCount(['enrollments as occupied_places' => fn ($q) => $q->whereIn('status', ['confirmed', 'in_progress', 'completed']), 'enrollments as pending_requests' => fn ($q) => $q->where('status', 'requested')]);
        if (! $r->filled('id') && ! ($r->boolean('include_samples') && app()->environment(['local', 'testing']))) {
            $q->where('is_sample', false);
        }
        if ($r->filled('id')) {
            $q->whereKey($r->integer('id'));
        }
        if ($r->user()->role === 'training_provider') {
            $q->where('owner_id', $r->user()->id);
        } elseif (! $this->staff($r)) {
            $q->available();
        }
        $this->searchCatalog($q, $r, ['title', 'provider', 'location', 'skills', 'description']);
        $catalogSources = ['registered_program' => TrainingSources::REGISTERED,
            'online_course' => 'TESDA Online Program', 'overseas_training' => TrainingSources::OVERSEAS];
        if (isset($catalogSources[$r->query('catalog')])) {
            $q->where('source_name', $catalogSources[$r->query('catalog')]);
        } elseif ($r->query('catalog') === 'partner_program') {
            $q->where('external_enrollment', false);
        }
        if ($r->filled('source_program_id')) {
            $q->where('source_program_id', $r->integer('source_program_id'));
        }
        if (in_array($r->query('status'), ['draft', 'pending_review', 'published', 'closed'], true)) {
            $q->where('status', $r->query('status'));
        }

        return $q->orderBy('starts_on')->orderBy('title')->orderBy('id')->paginate(TableSetting::perPage());
    }

    public function saveProgram(Request $r, ?TrainingProgram $program = null)
    {
        $this->roles($r, ['peso_staff', 'admin', 'training_provider']);
        if ($program?->exists && ! $this->staff($r)) {
            abort_unless($program->owner_id === $r->user()->id, 403);
        }
        abort_if($program?->external_enrollment, 422, 'Source listings are maintained through the researched source import.');
        $data = $r->validate(['title' => 'required|string|max:160', 'provider' => 'required|string|max:160', 'location' => 'required|string|max:160', 'mode' => ['required', Rule::in(['In person', 'Online', 'Blended'])], 'description' => 'required|string|max:8000', 'requirements' => 'required|string|max:4000', 'skills' => 'required|array|min:1|max:30', 'skills.*' => 'required|string|max:100|distinct:ignore_case', 'capacity' => 'required|integer|min:1|max:10000', 'starts_on' => ($program?->exists ? 'required|date' : 'required|date|after_or_equal:today'), 'ends_on' => 'required|date|after_or_equal:starts_on', 'schedule' => 'required|string|max:200', 'fee' => 'required|numeric|min:0|max:1000000', 'status' => ['required', Rule::in(['draft', 'pending_review', 'published', 'closed'])]]);
        if (! $this->staff($r)) {
            $data['status'] = $data['status'] === 'closed' ? 'closed' : 'pending_review';
        }

        return DB::transaction(function () use ($r, $program, $data) {
            $row = $program?->exists ? $program : new TrainingProgram(['owner_id' => $r->user()->id]);
            if ($row->exists) {
                TrainingProgram::whereKey($row->id)->lockForUpdate()->first();
                $occupied = Enrollment::where('training_program_id', $row->id)->whereIn('status', ['confirmed', 'in_progress', 'completed'])->count();
                if ($data['capacity'] < $occupied) {
                    throw ValidationException::withMessages(['capacity' => ['Capacity cannot be lower than reserved places.']]);
                }
            }
            $row->fill($data)->save();
            $this->audit($r, 'training.saved', $row, $data);

            return response()->json(['data' => $row]);
        });
    }

    public function matches(Request $r, EmploymentMatcher $matcher)
    {
        $this->roles($r, ['jobseeker']);

        $data = $r->validate(['page' => 'sometimes|integer|min:1|max:100000']);

        return response()->json($matcher->recommendations($r->user(), (int) ($data['page'] ?? 1)));
    }

    public function bookmark(Request $r, Vacancy $vacancy)
    {
        $this->roles($r, ['jobseeker']);
        abort_unless($vacancy->status === 'published', 404);
        abort_if($r->method() !== 'DELETE' && ! Vacancy::currentSource()->whereKey($vacancy->id)->exists(), 404);
        $q = DB::table('saved_vacancies')->where('user_id', $r->user()->id)->where('vacancy_id', $vacancy->id);
        if ($r->method() === 'DELETE') {
            $q->delete();
        } else {
            DB::table('saved_vacancies')->insertOrIgnore(['user_id' => $r->user()->id, 'vacancy_id' => $vacancy->id, 'created_at' => now(), 'updated_at' => now()]);
        }

        return response()->json(['message' => 'Saved vacancies updated.']);
    }

    public function requestReferral(Request $r, Vacancy $vacancy, EmploymentMatcher $matcher)
    {
        $this->roles($r, ['jobseeker']);
        abort_unless($r->user()->jobseekerProfile?->profile_completed_at, 422, 'Complete your jobseeker profile first.');
        $data = $r->validate(['notes' => 'nullable|string|max:2000']);

        return DB::transaction(function () use ($r, $vacancy, $matcher, $data) {
            $vacancy = Vacancy::whereKey($vacancy->id)->lockForUpdate()->firstOrFail();
            abort_unless(Vacancy::available()->whereKey($vacancy->id)->exists(), 422, 'This vacancy is no longer accepting requests.');
            abort_if(Referral::where('user_id', $r->user()->id)->where('vacancy_id', $vacancy->id)->exists(), 409, 'You already have a referral request for this vacancy.');
            $row = Referral::create(['status' => 'requested', 'user_id' => $r->user()->id, 'vacancy_id' => $vacancy->id, 'notes' => $data['notes'] ?? null, 'match_snapshot' => $matcher->assess($r->user(), $vacancy)]);
            $this->audit($r, 'referral.requested', $row);

            return response()->json(['data' => $row], 201);
        });
    }

    public function referrals(Request $r)
    {
        $this->roles($r, ['jobseeker', 'peso_staff', 'admin', 'employer']);
        $q = Referral::with(['vacancy', 'placement', 'user:id,name']);
        if ($r->user()->role === 'employer') {
            $q->forEmployer($r->user()->id);
        } else {
            $this->participants($q, $r);
        }

        return $q->latest()->orderByDesc('id')->paginate(TableSetting::perPage());
    }

    public function updateReferral(Request $r, Referral $referral)
    {
        $this->roles($r, ['jobseeker', 'peso_staff', 'admin', 'employer']);

        return DB::transaction(function () use ($r, $referral) {
            $row = Referral::whereKey($referral->id)->lockForUpdate()->firstOrFail();
            if ($r->user()->role === 'jobseeker') {
                abort_unless($row->user_id === $r->user()->id, 403);
            } elseif ($r->user()->role === 'employer') {
                abort_unless($row->vacancy?->owner_id === $r->user()->id
                    && in_array($row->status, Referral::EMPLOYER_OPEN_STATES, true), 403);
            }
            $data = $r->validate(['status' => ['required', Rule::in(['referred', 'accepted', 'interviewing', 'offered', 'not_selected', 'withdrawn'])], 'notes' => 'required|string|max:4000', 'interview_at' => [Rule::excludeIf($r->input('status') !== 'interviewing'), 'required_if:status,interviewing', 'date', 'after:now'], 'source_confirmation' => 'nullable|string|min:20|max:2000']);
            if ($r->user()->role === 'jobseeker') {
                abort_unless($data['status'] === 'withdrawn', 403);
                unset($data['interview_at']);
            } elseif ($r->user()->role === 'employer') {
                abort_unless(in_array($data['status'], ['accepted', 'interviewing', 'offered', 'not_selected'], true), 403);
            }
            if ($row->vacancy->external_application && $data['status'] === 'referred') {
                abort_unless($this->staff($r) && ! empty($data['source_confirmation']), 422, 'PESO must record employer contact, current availability and application instructions before referring this source-listed vacancy.');
                $snapshot = $row->match_snapshot ?? [];
                $snapshot['source_confirmation'] = ['evidence' => $data['source_confirmation'], 'verified_by' => $r->user()->id, 'verified_at' => now()->toIso8601String()];
                $row->match_snapshot = $snapshot;
            }
            unset($data['source_confirmation']);
            $this->transition($row->status, $data['status'], ['requested' => ['referred', 'not_selected', 'withdrawn'], 'referred' => ['accepted', 'interviewing', 'offered', 'not_selected', 'withdrawn'], 'accepted' => ['interviewing', 'offered', 'not_selected', 'withdrawn'], 'interviewing' => ['offered', 'not_selected', 'withdrawn'], 'offered' => ['not_selected', 'withdrawn']]);
            if ($data['status'] === 'interviewing' && empty($data['interview_at'])) {
                throw ValidationException::withMessages(['interview_at' => ['Set an interview schedule.']]);
            }
            $row->update([...$data, 'updated_by' => $r->user()->id]);
            $this->audit($r, 'referral.'.$data['status'], $row, $data);

            return response()->json(['data' => $row]);
        });
    }

    public function createIntake(Request $r, TrainingProgram $program)
    {
        $this->roles($r, ['peso_staff', 'admin']);
        abort_unless($program->external_enrollment, 422, 'Choose a source-listed program.');
        $data = $r->validate(['provider' => 'required|string|max:160', 'location' => 'required|string|max:160', 'mode' => ['required', Rule::in(['In person', 'Online', 'Blended'])], 'capacity' => 'required|integer|min:1|max:10000', 'starts_on' => 'required|date|after_or_equal:today', 'ends_on' => 'required|date|after_or_equal:starts_on', 'schedule' => 'required|string|max:200', 'fee' => 'required|numeric|min:0|max:1000000', 'intake_verification' => 'required|string|min:20|max:4000']);

        return DB::transaction(function () use ($r, $program, $data) {
            $row = TrainingProgram::create($data + ['title' => $program->title, 'source_program_id' => $program->id, 'owner_id' => $r->user()->id, 'description' => $program->description, 'requirements' => $program->requirements, 'skills' => $program->skills, 'status' => 'published', 'is_sample' => $program->is_sample, 'external_enrollment' => false]);
            $this->audit($r, 'training.intake_verified', $row, $data);

            return response()->json(['data' => $row], 201);
        });
    }

    public function enroll(Request $r, TrainingProgram $program)
    {
        $this->roles($r, ['jobseeker']);
        abort_unless($r->user()->jobseekerProfile?->profile_completed_at, 422, 'Complete your profile before enrolling.');
        $data = $r->validate(['consent' => 'required|accepted', 'notes' => 'nullable|string|max:2000', 'consent_notice_version' => ['sometimes', 'nullable', 'string', Rule::in([config('security.enrollment_notice_version')])]]);

        return DB::transaction(function () use ($r, $program, $data) {
            $program = TrainingProgram::whereKey($program->id)->lockForUpdate()->firstOrFail();
            abort_unless(TrainingProgram::available()->whereKey($program->id)->exists(), 422, 'Enrollment requests are closed for this program.');
            abort_if($program->external_enrollment, 422, 'This is a catalog listing, not a scheduled intake. Record training interest for PESO planning instead.');
            $used = Enrollment::where('training_program_id', $program->id)->whereIn('status', ['confirmed', 'in_progress', 'completed'])->count();
            abort_if($used >= $program->capacity, 422, 'This training is full.');
            abort_if(Enrollment::withTrashed()->where('user_id', $r->user()->id)->where('training_program_id', $program->id)->exists(), 409, 'An enrollment already exists for this program. Ask PESO to review a withdrawn request or select a new intake.');
            $row = Enrollment::create(['status' => 'requested', 'user_id' => $r->user()->id, 'training_program_id' => $program->id, 'notes' => $data['notes'] ?? null, 'consent_accepted_at' => now(), 'consent_notice_version' => $data['consent_notice_version'] ?? null, 'consent_recipient' => $program->provider]);
            $this->audit($r, 'enrollment.requested', $row, ['consent' => true]);

            return response()->json(['data' => $row], 201);
        });
    }

    public function enrollments(Request $r)
    {
        $this->roles($r, ['jobseeker', 'peso_staff', 'admin', 'training_provider']);
        $q = Enrollment::with(['program', 'user:id,name']);
        if ($r->user()->role === 'training_provider') {
            $q->whereHas('program', fn ($q) => $q->where('owner_id', $r->user()->id));
        } else {
            $this->participants($q, $r);
        }

        return $q->latest()->orderByDesc('id')->paginate(TableSetting::perPage());
    }

    public function updateEnrollment(Request $r, Enrollment $enrollment)
    {
        $this->roles($r, ['jobseeker', 'peso_staff', 'admin', 'training_provider']);
        abort_if($r->user()->role === 'jobseeker' && $enrollment->user_id !== $r->user()->id, 403);
        abort_if($r->user()->role === 'training_provider' && $enrollment->program?->owner_id !== $r->user()->id, 403);
        $data = $r->validate(['status' => ['required', Rule::in(['confirmed', 'in_progress', 'completed', 'rejected', 'withdrawn'])], 'notes' => 'required|string|max:4000', 'certificate_reference' => 'nullable|string|max:200', 'intake_program_id' => 'nullable|integer|min:1']);

        return DB::transaction(function () use ($r, $enrollment, $data) {
            $program = TrainingProgram::withTrashed()->whereKey($enrollment->training_program_id)->lockForUpdate()->firstOrFail();
            $row = Enrollment::whereKey($enrollment->id)->lockForUpdate()->firstOrFail();
            abort_unless($row->training_program_id === $program->id, 409, 'The enrollment moved to another intake. Reload and try again.');
            if ($r->user()->role === 'jobseeker') {
                abort_unless($row->user_id === $r->user()->id && $data['status'] === 'withdrawn', 403);
                unset($data['certificate_reference']);
            } elseif ($r->user()->role === 'training_provider') {
                abort_unless($program->owner_id === $r->user()->id, 403);
            }
            if ($program->external_enrollment && $data['status'] === 'confirmed') {
                abort_unless($this->staff($r) && ! empty($data['intake_program_id']), 422, 'Create and select a verified local intake before confirming this source-program request.');
                $intake = TrainingProgram::whereKey($data['intake_program_id'])->lockForUpdate()->firstOrFail();
                abort_unless(! $intake->external_enrollment && $intake->source_program_id === $program->id && $intake->intake_verification && $intake->starts_on >= today()->toDateString(), 422, 'Select an upcoming verified intake for this exact source program.');
                abort_if(Enrollment::withTrashed()->where('user_id', $row->user_id)->where('training_program_id', $intake->id)->where('id', '!=', $row->id)->exists(), 409, 'This jobseeker already has a request for that intake.');
                $row->training_program_id = $intake->id;
                $program = $intake;
            }
            unset($data['intake_program_id']);
            $this->transition($row->status, $data['status'], ['requested' => ['confirmed', 'rejected', 'withdrawn'], 'confirmed' => ['in_progress', 'withdrawn'], 'in_progress' => ['completed', 'withdrawn']]);
            if ($data['status'] === 'confirmed') {
                $used = Enrollment::where('training_program_id', $program->id)->whereIn('status', ['confirmed', 'in_progress', 'completed'])->count();
                abort_if($used >= $program->capacity, 422, 'All training places are reserved.');
                abort_unless(! $program->trashed() && $program->status === 'published', 422, 'Use a published, undeleted intake before confirming enrollment.');
            }
            if ($data['status'] === 'completed' && empty($data['certificate_reference'])) {
                throw ValidationException::withMessages(['certificate_reference' => ['Record the provider completion reference. This is not a TESDA National Certificate.']]);
            }
            $row->update([...$data, 'updated_by' => $r->user()->id]);
            $this->audit($r, 'enrollment.'.$data['status'], $row, $data);

            return response()->json(['data' => $row]);
        });
    }

    public function placements(Request $r)
    {
        $this->roles($r, ['jobseeker', 'peso_staff', 'admin', 'employer']);
        $q = Placement::with(['referral.vacancy', 'user:id,name']);
        if ($r->user()->role === 'employer') {
            $q->whereHas('referral.vacancy', fn ($q) => $q->where('owner_id', $r->user()->id));
        } else {
            $this->participants($q, $r);
        }

        return $q->latest()->orderByDesc('id')->paginate(TableSetting::perPage());
    }

    public function place(Request $r, Referral $referral)
    {
        $this->roles($r, ['peso_staff', 'admin']);
        $data = $r->validate(['started_on' => 'required|date|before_or_equal:today', 'employment_type' => 'required|string|max:80', 'evidence' => 'required|string|min:10|max:4000', 'follow_up_on' => 'required|date|after:today']);

        return DB::transaction(function () use ($r, $referral, $data) {
            $vacancy = Vacancy::whereKey($referral->vacancy_id)->lockForUpdate()->firstOrFail();
            $row = Referral::whereKey($referral->id)->lockForUpdate()->firstOrFail();
            abort_unless($row->status === 'offered', 422, 'Record an offer before verifying placement.');
            $count = Placement::whereHas('referral', fn ($q) => $q->where('vacancy_id', $vacancy->id))->count();
            if ($vacancy->external_application) {
                abort_unless(! empty($row->match_snapshot['source_confirmation']), 422, 'Record PESO employer verification before placing a source-listed applicant.');
            } else {
                abort_if($count >= $vacancy->slots, 422, 'All vacancy positions have a recorded placement.');
            }
            $placement = Placement::create([...$data, 'user_id' => $row->user_id, 'referral_id' => $row->id, 'verified_by' => $r->user()->id]);
            $row->update(['status' => 'placed', 'updated_by' => $r->user()->id]);
            $this->audit($r, 'placement.verified', $placement, $data);

            return response()->json(['data' => $placement], 201);
        });
    }

    public function outcomes(Request $r)
    {
        $this->roles($r, ['jobseeker', 'peso_staff', 'admin']);

        return $this->participants(EmploymentOutcome::with(['user:id,name', 'placement.referral.vacancy']), $r)->orderByDesc('reported_on')->latest()->orderByDesc('id')->paginate(TableSetting::perPage());
    }

    public function reportOutcome(Request $r)
    {
        $this->roles($r, ['jobseeker', 'peso_staff', 'admin']);
        $data = $r->validate(['user_id' => [Rule::excludeIf(! $this->staff($r)), 'sometimes', 'integer', 'exists:users,id'], 'placement_id' => 'nullable|integer|min:1', 'status' => ['required', Rule::in(['employed', 'self_employed', 'unemployed', 'underemployed', 'in_training', 'not_in_labor_force'])], 'organization' => 'nullable|string|max:160', 'job_title' => 'nullable|string|max:160', 'reported_on' => 'required|date|before_or_equal:today', 'notes' => 'required|string|min:5|max:4000']);
        $userId = $this->staff($r) ? ($data['user_id'] ?? $r->user()->id) : $r->user()->id;
        abort_unless(User::whereKey($userId)->where('role', 'jobseeker')->exists(), 422, 'Select a jobseeker.');
        if (! empty($data['placement_id'])) {
            abort_unless(Placement::whereKey($data['placement_id'])->where('user_id', $userId)->exists(), 403);
        }

        return DB::transaction(function () use ($r, $data, $userId) {
            $row = EmploymentOutcome::create([...$data, 'user_id' => $userId]);
            $this->audit($r, 'outcome.reported', $row);

            return response()->json(['data' => $row], 201);
        });
    }

    public function verifyOutcome(Request $r, EmploymentOutcome $outcome)
    {
        $this->roles($r, ['peso_staff', 'admin']);
        $data = $r->validate(['verification_notes' => 'required|string|min:10|max:4000']);

        return DB::transaction(function () use ($r, $outcome, $data) {
            $row = EmploymentOutcome::whereKey($outcome->id)->lockForUpdate()->firstOrFail();
            abort_if($row->verified_at, 409, 'This report is already verified.');
            $row->update([...$data, 'verified_at' => now(), 'verified_by' => $r->user()->id]);
            $this->audit($r, 'outcome.verified', $row, $data);

            return response()->json(['data' => $row]);
        });
    }

    public function services(Request $r)
    {
        $this->roles($r, ['jobseeker', 'peso_staff', 'admin']);

        return $this->participants(ServiceRequest::with(['user:id,name', 'assignee:id,name']), $r)->latest()->orderByDesc('id')->paginate(TableSetting::perPage());
    }

    public function requestService(Request $r)
    {
        $this->roles($r, ['jobseeker']);
        $data = $r->validate(['service' => ['required', Rule::in(self::SERVICES)], 'details' => 'required|string|min:10|max:4000']);

        return DB::transaction(function () use ($r, $data) {
            $row = ServiceRequest::create([...$data, 'user_id' => $r->user()->id]);
            $this->audit($r, 'service.requested', $row);

            return response()->json(['data' => $row], 201);
        });
    }

    public function updateService(Request $r, ServiceRequest $service)
    {
        $this->roles($r, ['jobseeker', 'peso_staff', 'admin']);
        abort_unless($this->staff($r) || $service->user_id === $r->user()->id, 403);
        $data = $r->validate(['status' => ['required', Rule::in(['scheduled', 'in_progress', 'completed', 'cancelled'])], 'assigned_to' => [Rule::excludeIf(! $this->staff($r)), 'nullable', 'integer', 'exists:users,id'], 'appointment_at' => [Rule::excludeIf(! $this->staff($r)), 'nullable', 'date', 'after:now'], 'staff_notes' => 'required|string|max:4000']);
        if (! $this->staff($r)) {
            abort_unless($service->user_id === $r->user()->id && $data['status'] === 'cancelled', 403);
            $data = ['status' => 'cancelled', 'cancellation_reason' => $data['staff_notes']];
        } elseif (! empty($data['assigned_to'])) {
            abort_unless(User::whereKey($data['assigned_to'])->whereIn('role', ['peso_staff', 'admin'])->exists(), 422, 'Assign a PESO officer.');
        }
        if ($data['status'] === 'scheduled' && empty($data['appointment_at'])) {
            throw ValidationException::withMessages(['appointment_at' => ['Set an appointment time.']]);
        }

        return DB::transaction(function () use ($r, $service, $data) {
            $row = ServiceRequest::whereKey($service->id)->lockForUpdate()->firstOrFail();
            $this->transition($row->status, $data['status'], ['requested' => ['scheduled', 'in_progress', 'cancelled'], 'scheduled' => ['in_progress', 'completed', 'cancelled'], 'in_progress' => ['completed', 'cancelled']]);
            if (isset($data['cancellation_reason'])) {
                $data['details'] = $row->details."\n\nJobseeker cancellation: ".$data['cancellation_reason'];
                unset($data['cancellation_reason']);
            }
            $row->update($data);
            $this->audit($r, 'service.'.$data['status'], $row, $data);

            return response()->json(['data' => $row]);
        });
    }

    public function events(Request $r)
    {
        $q = ServiceEvent::query();
        if (! ($r->boolean('include_samples') && app()->environment(['local', 'testing']))) {
            $q->where('is_sample', false);
        }
        if (! $this->staff($r)) {
            $q->where(fn ($query) => $query->where('status', 'published')->orWhere(fn ($source) => $source->whereNotNull('source_url')->where('status', 'completed')));
        }

        return $q->orderByRaw('CASE WHEN COALESCE(event_date, DATE(starts_at)) >= ? THEN 0 ELSE 1 END', [today()->toDateString()])->orderBy('event_date')->orderBy('starts_at')->orderBy('id')->paginate(TableSetting::perPage());
    }

    public function saveEvent(Request $r, ?ServiceEvent $event = null)
    {
        $this->roles($r, ['peso_staff', 'admin']);
        abort_if($event?->source_url, 422, 'Official-source events are maintained through the reviewed source import.');
        $data = $r->validate(['title' => 'required|string|max:160', 'type' => ['required', Rule::in(['Job fair', 'Career guidance', 'Pre-employment orientation', 'Livelihood', 'SPES / GIP / JobStart', 'Reintegration'])], 'location' => 'required|string|max:160', 'starts_at' => ($event?->exists ? 'required|date' : 'required|date|after:now'), 'description' => 'required|string|max:4000', 'status' => ['required', Rule::in(['draft', 'published', 'cancelled', 'completed'])], 'reference_name' => 'nullable|required_with:reference_url|string|max:160', 'reference_url' => 'nullable|required_with:reference_name|url:https|max:700']);
        if (! empty($data['reference_url'])) {
            $parts = parse_url($data['reference_url']);
            abort_if(isset($parts['user']) || isset($parts['pass']), 422, 'Use a public HTTPS link without embedded credentials.');
        }

        return DB::transaction(function () use ($r, $event, $data) {
            $row = $event?->exists ? $event : new ServiceEvent;
            $row->fill($data)->save();
            $this->audit($r, 'event.saved', $row, $data);

            return response()->json(['data' => $row]);
        });
    }

    public function registry(Request $r)
    {
        $this->roles($r, ['peso_staff', 'admin']);

        $query = User::where('role', 'jobseeker');
        if ($r->filled('search')) {
            $pattern = $this->searchPattern($r);
            $query->where(fn ($q) => $q->whereRaw("name LIKE ? ESCAPE '!'", [$pattern])
                ->orWhereRaw("email LIKE ? ESCAPE '!'", [$pattern])
                ->orWhereHas('jobseekerProfile', fn ($profile) => $profile->whereRaw("municipality LIKE ? ESCAPE '!'", [$pattern])));
        }

        return $query->with([
            'jobseekerProfile:id,user_id,barangay,municipality,province,mobile_number,profile_completed_at',
            'jobseekerProfile.skills:id,name',
            'jobseekerProfile.education:id,jobseeker_profile_id,highest_attainment',
            'jobseekerProfile.preferences:id,jobseeker_profile_id,preferred_location',
            'jobseekerProfile.preferences.occupations:id,jobseeker_preference_id,value',
        ])->select('id', 'name', 'email', 'created_at')->latest()->orderByDesc('id')->paginate(TableSetting::perPage());
    }

    public function createAccount(Request $r)
    {
        $this->roles($r, ['admin']);
        $data = $r->validate(['current_password' => 'required|current_password:web', 'first_name' => 'required|string|max:80', 'last_name' => 'required|string|max:80', 'email' => 'required|email|max:255|unique:users,email', 'password' => ['required', 'string', 'confirmed', new PasswordBytes, Password::min(12)->letters()->mixedCase()->numbers()->symbols()], 'role' => ['required', Rule::in(['jobseeker', 'peso_staff', 'employer', 'training_provider', 'admin'])]]);

        return DB::transaction(function () use ($r, $data) {
            $row = User::create(['name' => $data['first_name'].' '.$data['last_name'], 'first_name' => $data['first_name'], 'last_name' => $data['last_name'], 'email' => strtolower($data['email']), 'password' => $data['password']]);
            $row->forceFill(['role' => $data['role']])->save();
            $this->audit($r, 'user.created', $row, ['role' => $row->role]);

            return response()->json(['data' => $row], 201);
        });
    }

    public function users(Request $r)
    {
        $this->roles($r, ['admin']);

        return User::select('id', 'name', 'email', 'role')->orderBy('name')->orderBy('id')->paginate(TableSetting::perPage());
    }

    public function role(Request $r, User $user)
    {
        $this->roles($r, ['admin']);
        abort_if($user->id === $r->user()->id, 422, 'You cannot change your own access.');
        $data = $r->validate(['role' => ['required', Rule::in(['jobseeker', 'employer', 'training_provider', 'peso_staff', 'admin'])], 'current_password' => ['bail', 'required', 'string', 'current_password:web']]);
        unset($data['current_password']);

        return DB::transaction(function () use ($r, $user, $data) {
            $user->forceFill($data)->save();
            $user->forceFill(['remember_token' => null])->save();
            DB::table('sessions')->where('user_id', $user->id)->delete();
            $this->audit($r, 'user.role_changed', $user, $data);

            return response()->json(['message' => 'Access updated.']);
        });
    }

    public function tableSettings()
    {
        return response()->json(['rows_per_page' => TableSetting::perPage()]);
    }

    public function updateTableSettings(Request $r)
    {
        $this->roles($r, ['admin']);
        $data = $r->validate(['rows_per_page' => ['required', 'integer', 'between:1,20']]);

        return DB::transaction(function () use ($r, $data) {
            $settings = TableSetting::updateOrCreate(['id' => TableSetting::ID], ['rows_per_page' => (int) $data['rows_per_page']]);
            $this->audit($r, 'table_settings.updated', $settings, $data);

            return response()->json(['rows_per_page' => $settings->rows_per_page]);
        });
    }

    public function loginPolicy(Request $r)
    {
        $this->roles($r, ['admin']);

        return response()->json(['stages' => LoginPolicy::stages()]);
    }

    public function updateLoginPolicy(Request $r)
    {
        $this->roles($r, ['admin']);
        $data = $r->validate([
            'stages' => ['required', 'array', 'list', 'size:3'],
            'stages.*' => ['required', 'array:attempts,lockout_minutes'],
            'stages.*.attempts' => ['required', 'integer', 'between:1,20'],
            'stages.*.lockout_minutes' => ['required', 'integer', 'between:1,1440'],
        ]);
        $stages = array_map(fn (array $stage) => [
            'attempts' => (int) $stage['attempts'],
            'lockout_minutes' => (int) $stage['lockout_minutes'],
        ], $data['stages']);

        return DB::transaction(function () use ($r, $stages) {
            $policy = LoginPolicy::updateOrCreate(['id' => LoginPolicy::ID], ['stages' => $stages]);
            $this->audit($r, 'login_policy.updated', $policy, ['stages' => $stages]);

            return response()->json(['stages' => $policy->stages]);
        });
    }

    public function auditLog(Request $r)
    {
        $this->roles($r, ['admin']);

        return DB::table('audit_events')->leftJoin('users', 'users.id', '=', 'actor_id')->select('audit_events.*', 'users.name as actor')->orderByDesc('audit_events.id')->paginate(TableSetting::perPage());
    }

    public function summary(Request $r)
    {
        $own = $r->user()->id;
        $staff = $this->staff($r);
        $referrals = Referral::query();
        $enrollments = Enrollment::query();
        $placements = Placement::query();
        $services = ServiceRequest::query();
        if ($r->user()->role === 'employer') {
            $referrals->forEmployer($own);
            $placements->whereHas('referral.vacancy', fn ($q) => $q->where('owner_id', $own));
            $enrollments->where('user_id', $own);
            $services->where('user_id', $own);
        } elseif (! $staff) {
            $referrals->where('user_id', $own);
            $enrollments->where('user_id', $own);
            $placements->where('user_id', $own);
            $services->where('user_id', $own);
        }

        $summary = ['referrals' => $referrals->count(), 'enrollments' => $enrollments->count(), 'placements' => $placements->count(), 'services' => $services->whereNotIn('status', ['completed', 'cancelled'])->count(), 'saved' => DB::table('saved_vacancies')->where('user_id', $own)->whereIn('vacancy_id', Vacancy::currentSource()->select('id'))->pluck('vacancy_id'), 'profile' => $r->user()->jobseekerProfile?->onboarding(), 'services_catalog' => self::SERVICES];
        if ($r->user()->role === 'employer') {
            $summary['vacancies'] = Vacancy::currentSource()->where('owner_id', $own)->where('is_sample', false)->count();
        }

        return response()->json($summary);
    }

    public function laborMarket(Request $r)
    {
        $vacancies = Vacancy::available()->where('external_application', false);
        $real = (clone $vacancies)->where('is_sample', false);
        $sample = (clone $vacancies)->where('is_sample', true);
        $outcomeCounts = [];
        if ($this->staff($r)) {
            $outcomeCounts = EmploymentOutcome::whereNotExists(function ($q) {
                $q->selectRaw('1')->from('employment_outcomes as newer')->whereColumn('newer.user_id', 'employment_outcomes.user_id')
                    ->where(fn ($q) => $q->whereColumn('newer.reported_on', '>', 'employment_outcomes.reported_on')->orWhere(fn ($q) => $q->whereColumn('newer.reported_on', 'employment_outcomes.reported_on')->whereColumn('newer.id', '>', 'employment_outcomes.id')));
            })->where(fn ($q) => $q->whereNull('placement_id')->orWhereHas('placement.referral.vacancy', fn ($q) => $q->where('is_sample', false)))
                ->selectRaw('status, COUNT(*) as total, SUM(CASE WHEN verified_at IS NOT NULL THEN 1 ELSE 0 END) as verified')->groupBy('status')->get();
        }

        return response()->json([
            'scope' => 'Registered platform records only; not a municipal or national unemployment rate.',
            'official_reports' => PublicResource::orderByDesc('source_checked_at')->get(),
            'as_of' => now()->toIso8601String(), 'active_vacancies' => $real->count(), 'sample_vacancies' => $sample->count(), 'source_listed_vacancies' => Vacancy::available()->where('external_application', true)->count(), 'open_positions' => (clone $real)->sum('slots'),
            'industries' => (clone $real)->selectRaw('industry, COUNT(*) as vacancies, SUM(slots) as positions')->groupBy('industry')->get(),
            'skills' => (clone $real)->get()->flatMap(fn ($v) => $v->skills)->countBy()->sortDesc(), 'outcomes' => $outcomeCounts,
            'follow_ups' => $this->staff($r) ? Placement::with(['user:id,name', 'referral.vacancy'])->whereHas('referral.vacancy', fn ($q) => $q->where('is_sample', false))->whereDate('follow_up_on', '<=', today())->get()->filter(fn ($p) => ! EmploymentOutcome::where('placement_id', $p->id)->whereNotNull('verified_at')->whereDate('reported_on', '>=', $p->follow_up_on)->exists())->values() : [],
            'training_completions' => $this->staff($r) ? Enrollment::where('status', 'completed')->whereHas('program', fn ($q) => $q->where('is_sample', false))->count() : null,
        ]);
    }
}
