<?php

namespace Tests\Feature;

use App\Models\TrainingProgram;
use App\Models\User;
use App\Models\Vacancy;
use App\Services\EmploymentMatcher;
use App\Services\ReviewedTrainingImporter;
use App\Services\TrainingSources;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NationalTrainingCatalogTest extends TestCase
{
    use RefreshDatabase;

    private function record(int $id = 1): array
    {
        return ['title' => 'Registered qualification '.$id, 'provider' => 'Isolated test institution',
            'location' => 'Oriental Mindoro', 'mode' => 'Confirm delivery mode',
            'description' => 'An isolated test registry record, not an announced intake.',
            'requirements' => 'Confirm admission and current intake with the provider.',
            'schedule' => 'Registered program · intake not confirmed', 'skills' => [], 'fee' => null,
            'source_name' => TrainingSources::REGISTERED,
            'source_url' => 'https://www.tesda.gov.ph/Tvi/Result?SearchCourse=Qualification'.$id.'&SearchIns=IsolatedTest&SearchLoc=Oriental+Mindoro',
            'checked_at' => now()->toIso8601String()];
    }

    public function test_registry_import_preserves_unknown_fee_and_intake_and_is_idempotent(): void
    {
        $importer = app(ReviewedTrainingImporter::class);
        $this->assertSame(1, $importer->import([$this->record()]));
        $this->assertSame(1, $importer->import([$this->record()]));
        $this->assertDatabaseCount('training_programs', 1);
        $program = TrainingProgram::firstOrFail();
        $this->assertNull($program->fee);
        $this->assertNull($program->capacity);
        $this->assertNull($program->starts_on);
        $this->assertNull($program->owner_id);
        $this->assertSame('registered_program', $program->catalog_type);
        $this->assertSame('intake_unconfirmed', $program->availability_status);
        $staff = User::factory()->create(['role' => 'peso_staff']);
        $this->actingAs($staff)->getJson('/api/platform/training?catalog=registered_program&search=Oriental%20Mindoro')
            ->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.fee', null);
        $this->getJson('/api/platform/training?catalog=online_course')->assertOk()->assertJsonPath('total', 0);
        $this->getJson('/api/platform/training?catalog=arbitrary')->assertUnprocessable();
        $this->patchJson('/api/platform/training/'.$program->id, [
            'title' => 'Attempt to overwrite source evidence', 'provider' => 'Changed provider',
            'location' => 'Mindoro', 'mode' => 'Online', 'description' => 'Changed evidence',
            'requirements' => 'None', 'skills' => ['Communication'], 'capacity' => 10,
            'starts_on' => today()->addDay()->toDateString(), 'ends_on' => today()->addWeek()->toDateString(),
            'schedule' => 'Daily', 'fee' => 0, 'status' => 'published',
        ])->assertUnprocessable()->assertJsonPath('message', 'Source listings are maintained through the researched source import.');
        $this->assertSame($this->record()['title'], $program->fresh()->title);
        $program->update(['source_checked_at' => now()->subDays(31)]);
        $this->assertSame(0, TrainingProgram::available()->count());
    }

    public function test_streamed_batches_roll_back_when_a_later_destination_is_invalid(): void
    {
        $rows = function () {
            for ($id = 1; $id <= 201; $id++) {
                yield $this->record($id);
            }
            yield array_replace($this->record(202), ['source_url' => 'https://unapproved.example/course']);
        };
        try {
            app(ReviewedTrainingImporter::class)->import($rows());
            $this->fail('An unapproved destination must stop the import.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('Unexpected official training URL.', $exception->getMessage());
        }
        $this->assertDatabaseCount('training_programs', 0);
    }

    public function test_large_directory_has_bounded_suggestions_and_full_catalog_pagination(): void
    {
        $rows = function () {
            for ($id = 1; $id <= 500; $id++) {
                yield $this->record($id);
            }
            yield array_replace($this->record(501), ['source_name' => 'TESDA Online Program',
                'source_url' => 'https://e-tesda.gov.ph/course/view.php?id=999999', 'skills' => ['Communication'], 'fee' => 0]);
        };
        app(ReviewedTrainingImporter::class)->import($rows());
        $user = User::factory()->create(['role' => 'jobseeker']);
        $user->jobseekerProfile()->create()->forceFill(['profile_completed_at' => now()])->save();
        Vacancy::create(['title' => 'Isolated test vacancy', 'organization' => 'Isolated employer', 'location' => 'Mindoro',
            'industry' => 'Services', 'employment_type' => 'Full-time', 'description' => 'Communication work',
            'skills' => ['Communication'], 'slots' => 1, 'deadline' => today()->addMonth(), 'status' => 'published']);
        $data = app(EmploymentMatcher::class)->recommendations($user);
        $this->assertSame(501, $data['training_total']);
        $this->assertCount(100, $data['training']);
        $this->assertSame(['Communication'], $data['training'][0]['addresses']);
        $this->assertCount(1, $data['matches'][0]['training']);
        $this->assertSame(['Communication'], $data['matches'][0]['training'][0]['addresses']);
        $this->actingAs($user)->getJson('/api/platform/training?page=2')->assertOk()
            ->assertJsonPath('total', 501)->assertJsonPath('current_page', 2)->assertJsonCount(20, 'data');
    }

    public function test_training_destinations_reject_credentials_duplicate_keys_and_false_hosts(): void
    {
        $this->assertTrue(TrainingSources::allows($this->record()['source_url']));
        $this->assertTrue(TrainingSources::allows(TrainingSources::OSAKA));
        foreach (['https://e-tesda.gov.ph/course/view.php?id=1&id=2', 'https://e-tesda.gov.ph.evil.example/course/view.php?id=1',
            'https://user:secret@www.tesda.gov.ph/Tvi/Result?SearchCourse=A&SearchIns=B&SearchLoc=C',
            'https://www.tesda.gov.ph/Tvi/Result?SearchCourse=A&SearchIns=B&SearchLoc=C&redirect=evil',
            'https://www.tesda.gov.ph/Tvi/Result?SearchCourse=A&SearchIns=B&SearchLoc=C#extra'] as $url) {
            $this->assertFalse(TrainingSources::allows($url));
        }
    }

    public function test_snapshot_withdrawal_unpublishes_source_rows_without_deleting_history_or_owned_programs(): void
    {
        $importer = app(ReviewedTrainingImporter::class);
        $old = array_replace($this->record(901), ['source_name' => 'TESDA Online Program',
            'source_url' => 'https://e-tesda.gov.ph/course/view.php?id=999999', 'fee' => 0]);
        $importer->import([$old]);
        $program = TrainingProgram::firstOrFail();
        $program->forceFill(['updated_at' => now()->subDay()])->save(['timestamps' => false]);
        $user = User::factory()->create(['role' => 'training_provider']);
        $owned = $program->replicate()->forceFill(['source_url' => 'https://e-tesda.gov.ph/course/view.php?id=999998', 'owner_id' => $user->id]);
        $owned->save();
        $this->artisan('peso:import-verified-training', ['--catalog' => 'online'])->assertSuccessful();
        $this->assertSame('draft', $program->fresh()->status);
        $this->assertSame('published', $owned->fresh()->status);
        $this->assertSame($user->id, $owned->fresh()->owner_id);
        $this->assertDatabaseHas('training_programs', ['id' => $program->id, 'source_url' => $old['source_url']]);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_reviewed_import_cannot_take_over_an_owned_training_identity(): void
    {
        $row = $this->record();
        $importer = app(ReviewedTrainingImporter::class);
        $importer->import([$row]);
        $owner = User::factory()->create(['role' => 'training_provider']);
        $program = TrainingProgram::firstOrFail();
        $program->update(['owner_id' => $owner->id, 'title' => 'Preserved owned program']);
        try {
            $importer->import([$row]);
            $this->fail('Owned records must remain protected.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('A source identity conflicts with an owned training record.', $exception->getMessage());
        }
        $this->assertSame('Preserved owned program', $program->fresh()->title);
        $this->assertSame($owner->id, $program->fresh()->owner_id);
    }
}
