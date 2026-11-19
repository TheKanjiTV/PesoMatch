<?php

namespace Tests\Feature;

use App\Http\Middleware\SecurityHeaders;
use App\Models\Enrollment;
use App\Models\Referral;
use App\Models\ResumeDocument;
use App\Models\ServiceRequest;
use App\Models\TrainingProgram;
use App\Models\User;
use App\Models\Vacancy;
use App\Services\ResumeStorage;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    private function person(string $role = 'jobseeker'): User
    {
        $u = User::factory()->create(['role' => $role]);
        $u->jobseekerProfile()->create()->forceFill(['profile_completed_at' => now()])->save();

        return $u;
    }

    public function test_terms_and_honeypot_are_enforced_and_notice_versions_are_server_owned(): void
    {
        $data = ['first_name' => 'Audit', 'last_name' => 'Tester', 'email' => 'audit@example.test', 'password' => 'Security-Test-123!', 'password_confirmation' => 'Security-Test-123!'];
        $this->postJson('/api/auth/register', $data)->assertUnprocessable()->assertJsonValidationErrors('terms_accepted');
        $this->postJson('/api/auth/register', [...$data, 'terms_accepted' => true, 'website' => 'spam'])->assertUnprocessable()->assertJsonValidationErrors('website');
        $this->postJson('/api/auth/register', [...$data, 'terms_accepted' => true, 'terms_version' => 'forged', 'terms_accepted_at' => '2000-01-01'])->assertCreated();
        $user = User::first();
        $this->assertSame(config('security.notice_version'), $user->terms_version);
        $this->assertNotNull($user->terms_accepted_at);
        $this->assertSame(config('security.notice_version'), $user->privacy_notice_version);
        $this->postJson('/api/auth/login', ['email' => $data['email'], 'password' => $data['password'], 'website' => 'spam'])->assertUnprocessable()->assertJsonValidationErrors('website');
    }

    public function test_bcrypt_byte_limit_rejects_unicode_and_oversize_passwords_without_server_errors(): void
    {
        $value = str_repeat('é', 40);
        $this->postJson('/api/auth/register', ['first_name' => 'Audit', 'last_name' => 'Test', 'email' => 'bytes@example.test', 'password' => $value, 'password_confirmation' => $value, 'terms_accepted' => true])->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->postJson('/api/auth/login', ['email' => 'bytes@example.test', 'password' => str_repeat('x', 73)])->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->postJson('/api/auth/login', ['email' => ['malformed'], 'password' => 'incorrect'])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_jobseeker_withdrawals_cannot_change_staff_owned_metadata(): void
    {
        $u = $this->person();
        $v = Vacancy::create(['title' => 'Audit job', 'organization' => 'Sample', 'location' => 'Online', 'industry' => 'Services', 'employment_type' => 'Full-time', 'description' => 'Test only', 'skills' => ['Communication'], 'slots' => 1, 'deadline' => today()->addMonth(), 'status' => 'published']);
        $referral = Referral::create(['user_id' => $u->id, 'vacancy_id' => $v->id, 'status' => 'requested']);
        $this->actingAs($u)->patchJson("/api/platform/referrals/{$referral->id}", ['status' => 'withdrawn', 'notes' => 'Private reason must not be duplicated', 'interview_at' => now()->addDay()->toIso8601String()])->assertOk();
        $this->assertNull($referral->fresh()->interview_at);
        $p = TrainingProgram::create(['title' => 'Audit training', 'provider' => 'Sample', 'location' => 'Online', 'mode' => 'Online', 'description' => 'Test only', 'requirements' => 'None', 'skills' => ['Communication'], 'capacity' => 1, 'starts_on' => today()->addMonth(), 'ends_on' => today()->addMonths(2), 'schedule' => 'Test', 'fee' => 0, 'status' => 'published']);
        $e = Enrollment::create(['user_id' => $u->id, 'training_program_id' => $p->id]);
        $this->patchJson("/api/platform/enrollments/{$e->id}", ['status' => 'withdrawn', 'notes' => 'Test withdrawal', 'certificate_reference' => 'FORGED'])->assertOk();
        $this->assertNull($e->fresh()->certificate_reference);
        $service = ServiceRequest::create(['user_id' => $u->id, 'service' => 'Career guidance & counseling', 'details' => 'Original request', 'staff_notes' => 'Officer note']);
        $this->patchJson("/api/platform/services/{$service->id}", ['status' => 'cancelled', 'staff_notes' => 'Cancellation reason'])->assertOk();
        $this->assertSame('Officer note', $service->fresh()->staff_notes);
        $this->assertStringContainsString('Cancellation reason', $service->fresh()->details);
        $audit = DB::table('audit_events')->where('entity', 'referrals')->first()->changes;
        $this->assertStringNotContainsString('Private reason', $audit);
        $this->assertStringContainsString('withdrawn', $audit);
    }

    public function test_privacy_requests_are_owner_scoped_admin_reviewed_and_do_not_silently_delete(): void
    {
        $this->getJson('/api/privacy/requests')->assertUnauthorized();
        $owner = $this->person();
        $other = $this->person();
        $admin = $this->person('admin');
        $row = $this->actingAs($owner)->postJson('/api/privacy/requests', ['kind' => 'deletion', 'details' => 'Please review my records'])->assertCreated()->assertJsonMissingPath('data.user_id')->json('data');
        $this->getJson('/api/privacy/requests')->assertJsonCount(1, 'data');
        $this->getJson('/api/privacy/requests?scope=all')->assertForbidden();
        $this->postJson('/api/privacy/requests', ['kind' => 'access', 'user_id' => $other->id, 'status' => 'completed'])->assertUnprocessable();
        $this->actingAs($other)->getJson('/api/privacy/requests')->assertJsonCount(0, 'data');
        $this->patchJson("/api/privacy/requests/{$row['id']}", ['status' => 'completed', 'response' => 'Forged action'])->assertForbidden();
        $this->actingAs($admin)->getJson('/api/privacy/requests?scope=all')->assertOk()->assertJsonCount(1, 'data');
        $this->patchJson("/api/privacy/requests/{$row['id']}", ['status' => 'in_review', 'response' => 'Identity and retention under review'])->assertOk();
        $this->patchJson("/api/privacy/requests/{$row['id']}", ['status' => 'completed', 'response' => 'Review recorded; no deletion performed by this test'])->assertOk();
        $this->patchJson("/api/privacy/requests/{$row['id']}", ['status' => 'declined', 'response' => 'Cannot alter final response'])->assertConflict();
        $this->assertNotNull($owner->fresh());
        $this->assertDatabaseCount('privacy_requests', 1);
    }

    public function test_invalid_query_shapes_are_rejected_and_registry_omits_unused_sensitive_fields(): void
    {
        $u = $this->person();
        $u->jobseekerProfile->update(['birth_date' => '2000-01-01', 'address_line' => 'Private street', 'sex' => 'Other']);
        $this->actingAs($u)->getJson('/api/platform/vacancies?search[]=bad')->assertUnprocessable();
        $this->getJson('/api/platform/vacancies?id=-1')->assertUnprocessable();
        $this->getJson('/api/platform/vacancies?page=10001')->assertUnprocessable();
        $this->getJson('/api/platform/vacancies?search=%27%20OR%201=1--')->assertOk()->assertJsonCount(0, 'data');
        $this->actingAs($this->person('peso_staff'))->getJson('/api/platform/jobseekers')->assertOk()->assertJsonMissingPath('data.0.jobseeker_profile.birth_date')->assertJsonMissingPath('data.0.jobseeker_profile.sex')->assertJsonMissingPath('data.0.jobseeker_profile.address_line');
    }

    public function test_role_change_requires_step_up_and_revokes_target_sessions(): void
    {
        $target = $this->person();
        DB::table('sessions')->insert(['id' => 'target-session', 'user_id' => $target->id, 'payload' => 'test', 'last_activity' => time()]);
        $this->actingAs($this->person('admin'))->patchJson("/api/platform/users/{$target->id}/role", ['role' => 'peso_staff'])->assertUnprocessable()->assertJsonValidationErrors('current_password');
        $this->patchJson("/api/platform/users/{$target->id}/role", ['role' => 'peso_staff', 'current_password' => 'incorrect'])->assertUnprocessable();
        $this->patchJson("/api/platform/users/{$target->id}/role", ['role' => 'peso_staff', 'current_password' => 'password', 'email' => 'forged@example.test'])->assertOk();
        $this->assertDatabaseMissing('sessions', ['id' => 'target-session']);
        $this->assertNotSame('forged@example.test', $target->fresh()->email);
        $this->assertStringNotContainsString('password', DB::table('audit_events')->first()->changes);
    }

    public function test_security_headers_and_private_cache_rules_cover_success_and_auth_errors(): void
    {
        foreach (['/api/public/catalog', '/api/auth/user'] as $url) {
            $res = $this->getJson($url);
            $res->assertHeader('X-Content-Type-Options', 'nosniff')->assertHeader('X-Frame-Options', 'DENY')->assertHeader('Cache-Control', 'max-age=0, no-store, private');
            $this->assertStringContainsString("frame-ancestors 'none'", $res->headers->get('Content-Security-Policy'));
        }
    }

    public function test_production_gate_redirects_to_canonical_https_and_rejects_unsafe_configuration(): void
    {
        $this->app['env'] = 'production';
        config(['app.url' => 'https://peso.example', 'app.debug' => false, 'session.secure' => true, 'session.encrypt' => true, 'session.http_only' => true]);
        $middleware = new SecurityHeaders;
        $request = Request::create('http://untrusted.example/api/auth/user');
        $request->headers->set('X-Forwarded-Proto', 'https');
        $res = $middleware->handle($request, fn () => response()->json(['ok' => true]));
        $this->assertSame(308, $res->getStatusCode());
        $this->assertSame('https://peso.example/api/auth/user', $res->headers->get('Location'));
        $res = $middleware->handle(Request::create('https://peso.example/api/auth/user'), fn () => response()->json(['ok' => true]));
        $this->assertSame('max-age=31536000', $res->headers->get('Strict-Transport-Security'));
        config(['app.debug' => true]);
        $this->assertSame(503, $middleware->handle($request, fn () => response('unsafe'))->getStatusCode());
    }

    public function test_new_resume_storage_is_encrypted_and_detects_tampering_while_reading_legacy_pdf(): void
    {
        Storage::fake('local');
        $storage = app(ResumeStorage::class);
        $pdf = "%PDF-1.4\nPrivate audit fixture";
        $path = $storage->store(123, $pdf);
        $stored = Storage::disk('local')->get($path);
        $this->assertStringNotContainsString($pdf, $stored);
        $this->assertSame($pdf, $storage->read($path));
        Storage::disk('local')->put('resumes/legacy.pdf', $pdf);
        $this->assertSame($pdf, $storage->read('resumes/legacy.pdf'));
        Storage::disk('local')->put($path, $stored.'tampered');
        $this->expectException(DecryptException::class);
        $storage->read($path);
    }

    public function test_login_and_registration_limits_are_enforced(): void
    {
        for ($i = 0; $i < 30; $i++) {
            $this->postJson('/api/auth/login', ['email' => "rate-{$i}@example.test", 'password' => 'incorrect'])->assertUnprocessable();
        }
        $this->postJson('/api/auth/login', ['email' => 'rate@example.test', 'password' => 'incorrect'])->assertStatus(429);
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/register', [])->assertUnprocessable();
        }
        $this->postJson('/api/auth/register', [])->assertStatus(429);
    }

    public function test_encrypted_resume_cannot_be_downgraded_to_legacy_plaintext(): void
    {
        Storage::fake('local');
        $storage = app(ResumeStorage::class);
        $path = $storage->store(123, "%PDF-1.4\nFixture");
        Storage::disk('local')->put($path, "%PDF-1.4\nReplacement");
        $this->expectException(HttpException::class);
        $storage->read($path);
    }

    public function test_failed_private_file_removal_does_not_report_success_or_delete_account_metadata(): void
    {
        $owner = $this->person();
        ResumeDocument::create(['user_id' => $owner->id, 'filename' => 'audit.pdf', 'path' => 'resumes/test.enc', 'detected' => [], 'excerpt' => 'Test only']);
        $disk = \Mockery::mock();
        $disk->shouldReceive('delete')->with('resumes/test.enc')->twice()->andReturn(false);
        Storage::shouldReceive('disk')->with('local')->twice()->andReturn($disk);
        $this->actingAs($owner)->deleteJson('/api/jobseeker/resume')->assertStatus(503);
        $this->deleteJson('/api/auth/account', ['current_password' => 'password'])->assertStatus(503);
        $this->assertDatabaseCount('resume_documents', 1);
        $this->assertDatabaseHas('users', ['id' => $owner->id]);
    }

    public function test_malformed_password_and_profile_section_shapes_return_validation_errors(): void
    {
        $owner = $this->person();
        $this->actingAs($owner)->patchJson('/api/jobseeker/profile', ['section' => ['personal']])->assertUnprocessable()->assertJsonValidationErrors('section');
        $this->patchJson('/api/auth/account', ['current_password' => ['invalid']])->assertUnprocessable()->assertJsonValidationErrors('current_password');
        $this->patchJson('/api/auth/password', ['current_password' => ['invalid'], 'password' => 'New-Password-123!', 'password_confirmation' => 'New-Password-123!'])->assertUnprocessable()->assertJsonValidationErrors('current_password');
        $this->deleteJson('/api/auth/account', ['current_password' => ['invalid']])->assertUnprocessable()->assertJsonValidationErrors('current_password');
        $this->assertDatabaseHas('users', ['id' => $owner->id]);
    }

    public function test_record_foreign_keys_require_scalar_integers(): void
    {
        $owner = $this->person();
        $staff = $this->person('peso_staff');
        $this->actingAs($staff)->postJson('/api/platform/outcomes', ['user_id' => [$owner->id], 'status' => 'unemployed', 'reported_on' => today()->toDateString(), 'notes' => 'Test malformed ID'])->assertUnprocessable()->assertJsonValidationErrors('user_id');
        $this->postJson('/api/platform/outcomes', ['user_id' => $owner->id, 'placement_id' => [1], 'status' => 'unemployed', 'reported_on' => today()->toDateString(), 'notes' => 'Test malformed ID'])->assertUnprocessable()->assertJsonValidationErrors('placement_id');
        $service = ServiceRequest::create(['user_id' => $owner->id, 'service' => 'Career guidance & counseling', 'details' => 'Test request']);
        $this->patchJson("/api/platform/services/{$service->id}", ['status' => 'in_progress', 'staff_notes' => 'Test assignment', 'assigned_to' => [$staff->id]])->assertUnprocessable()->assertJsonValidationErrors('assigned_to');
    }

    public function test_explicit_remember_login_has_a_bounded_http_only_cookie(): void
    {
        $owner = $this->person();
        $res = $this->postJson('/api/auth/login', ['email' => $owner->email, 'password' => 'password', 'remember' => true])->assertOk();
        $cookie = collect($res->headers->getCookies())->first(fn ($cookie) => str_starts_with($cookie->getName(), 'remember_web_'));
        $this->assertNotNull($cookie);
        $this->assertTrue($cookie->isHttpOnly());
        $this->assertLessThanOrEqual(now()->addWeek()->timestamp + 5, $cookie->getExpiresTime());
        $this->assertGreaterThan(now()->addDays(6)->timestamp, $cookie->getExpiresTime());
    }
}
