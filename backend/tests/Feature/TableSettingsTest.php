<?php

namespace Tests\Feature;

use App\Models\TableSetting;
use App\Models\TrainingProgram;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TableSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_default_and_configured_limits_preserve_all_records_across_pages(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        User::factory()->count(395)->create();
        $this->actingAs($admin)->getJson('/api/platform/table-settings')->assertOk()->assertJsonPath('rows_per_page', 20);
        foreach ([20, 10] as $size) {
            $this->patchJson('/api/platform/table-settings', ['rows_per_page' => $size])->assertOk()->assertJsonPath('rows_per_page', $size);
            $ids = [];
            $last = (int) ceil(396 / $size);
            for ($page = 1; $page <= $last; $page++) {
                $data = $this->getJson('/api/platform/users?page='.$page.'&per_page=1000')->assertOk()
                    ->assertJsonPath('total', 396)->assertJsonPath('per_page', $size)
                    ->assertJsonPath('last_page', $last)->assertJsonPath('current_page', $page)
                    ->assertJsonCount($page === $last ? 396 - ($last - 1) * $size : $size, 'data')->json('data');
                $ids = [...$ids, ...array_column($data, 'id')];
            }
            $this->assertCount(396, array_unique($ids));
        }
        $this->assertDatabaseHas('table_settings', ['id' => 1, 'rows_per_page' => 10]);
        $this->assertDatabaseHas('audit_events', ['actor_id' => $admin->id, 'action' => 'table_settings.updated']);
    }

    public function test_only_admin_can_change_the_validated_global_setting(): void
    {
        $path = '/api/platform/table-settings';
        $this->getJson($path)->assertUnauthorized();
        $this->patchJson($path, ['rows_per_page' => 10])->assertUnauthorized();
        foreach (['jobseeker', 'peso_staff', 'employer', 'training_provider'] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role]))->getJson($path)->assertOk();
            $this->patchJson($path, ['rows_per_page' => 10])->assertForbidden();
        }
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        foreach ([0, -1, 21, 100, 1.5, null, 'all'] as $invalid) {
            $this->patchJson($path, ['rows_per_page' => $invalid])->assertUnprocessable()->assertJsonValidationErrors('rows_per_page');
        }
        $this->assertDatabaseCount('table_settings', 0);
        $this->patchJson($path, ['rows_per_page' => 1])->assertOk();
        $this->getJson('/api/platform/users')->assertJsonCount(1, 'data')->assertJsonPath('per_page', 1);
    }

    public function test_every_record_endpoint_uses_the_shared_limit_and_demand_is_not_truncated(): void
    {
        TableSetting::create(['id' => 1, 'rows_per_page' => 10]);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);
        foreach (['vacancies', 'employers', 'training', 'referrals', 'enrollments', 'placements', 'outcomes', 'services', 'jobseekers', 'users', 'audit', 'training-demands'] as $path) {
            $this->getJson('/api/platform/'.$path)->assertOk()->assertJsonPath('per_page', 10);
        }
        $this->getJson('/api/privacy/requests')->assertOk()->assertJsonPath('per_page', 10);
        $program = TrainingProgram::create(['title' => 'Synthetic training', 'provider' => 'Fixture', 'location' => 'Bansud', 'mode' => 'Online', 'description' => 'Test only', 'requirements' => 'None', 'skills' => [], 'capacity' => 1, 'starts_on' => today()->addWeek(), 'ends_on' => today()->addMonth(), 'schedule' => 'Weekdays', 'fee' => 0, 'status' => 'published']);
        $this->getJson('/api/platform/training/'.$program->id.'/participants')->assertOk()->assertJsonPath('per_page', 10);
        $seeker = User::factory()->create(['role' => 'jobseeker']);
        for ($i = 0; $i < 105; $i++) {
            DB::table('training_demands')->insert(['user_id' => $seeker->id, 'topic' => sprintf('Topic %03d', $i), 'topic_key' => sprintf('topic %03d', $i), 'created_at' => now(), 'updated_at' => now()]);
        }
        foreach ([$admin, $seeker] as $user) {
            $this->actingAs($user)->getJson('/api/platform/training-demands?page=11')->assertOk()->assertJsonPath('total', 105)->assertJsonPath('last_page', 11)->assertJsonCount(5, 'data');
        }
        $this->getJson('/api/platform/matches')->assertOk()->assertJsonPath('per_page', 10);
    }
}
