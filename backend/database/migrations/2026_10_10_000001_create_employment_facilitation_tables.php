<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vacancies', function (Blueprint $t) {
            $t->id();
            $t->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('title');
            $t->string('organization');
            $t->string('location');
            $t->string('industry');
            $t->string('employment_type');
            $t->text('description');
            $t->json('skills');
            $t->unsignedInteger('slots')->default(1);
            $t->unsignedInteger('salary_min')->nullable();
            $t->unsignedInteger('salary_max')->nullable();
            $t->date('deadline');
            $t->string('status')->default('draft')->index();
            $t->boolean('is_sample')->default(false);
            $t->timestamps();
        });
        Schema::create('training_programs', function (Blueprint $t) {
            $t->id();
            $t->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('title');
            $t->string('provider');
            $t->string('location');
            $t->string('mode');
            $t->text('description');
            $t->text('requirements');
            $t->json('skills');
            $t->unsignedInteger('capacity');
            $t->date('starts_on');
            $t->date('ends_on');
            $t->string('schedule');
            $t->decimal('fee', 10, 2)->default(0);
            $t->string('status')->default('draft')->index();
            $t->boolean('is_sample')->default(false);
            $t->timestamps();
        });
        Schema::create('enrollments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('training_program_id')->constrained()->restrictOnDelete();
            $t->string('status')->default('requested')->index();
            $t->text('notes')->nullable();
            $t->string('certificate_reference')->nullable();
            $t->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
            $t->unique(['user_id', 'training_program_id']);
        });
        Schema::create('referrals', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('vacancy_id')->constrained()->restrictOnDelete();
            $t->string('status')->default('requested')->index();
            $t->text('notes')->nullable();
            $t->timestamp('interview_at')->nullable();
            $t->json('match_snapshot')->nullable();
            $t->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
            $t->unique(['user_id', 'vacancy_id']);
        });
        Schema::create('placements', function (Blueprint $t) {
            $t->id();
            $t->foreignId('referral_id')->unique()->constrained()->restrictOnDelete();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->date('started_on');
            $t->string('employment_type');
            $t->text('evidence');
            $t->date('follow_up_on');
            $t->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
        });
        Schema::create('employment_outcomes', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('placement_id')->nullable()->constrained()->nullOnDelete();
            $t->string('status')->index();
            $t->string('organization')->nullable();
            $t->string('job_title')->nullable();
            $t->date('reported_on');
            $t->text('notes');
            $t->timestamp('verified_at')->nullable();
            $t->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $t->text('verification_notes')->nullable();
            $t->timestamps();
        });
        Schema::create('service_requests', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('service');
            $t->text('details');
            $t->string('status')->default('requested')->index();
            $t->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('appointment_at')->nullable();
            $t->text('staff_notes')->nullable();
            $t->timestamps();
        });
        Schema::create('service_events', function (Blueprint $t) {
            $t->id();
            $t->string('title');
            $t->string('type');
            $t->string('location');
            $t->timestamp('starts_at');
            $t->text('description');
            $t->string('status')->default('published');
            $t->boolean('is_sample')->default(false);
            $t->timestamps();
        });
        Schema::create('audit_events', function (Blueprint $t) {
            $t->id();
            $t->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('action');
            $t->string('entity');
            $t->unsignedBigInteger('entity_id');
            $t->json('changes');
            $t->timestamp('created_at');
        });
        Schema::create('saved_vacancies', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('vacancy_id')->constrained()->cascadeOnDelete();
            $t->timestamps();
            $t->unique(['user_id', 'vacancy_id']);
        });
    }

    public function down(): void
    {
        foreach (['saved_vacancies', 'audit_events', 'service_events', 'service_requests', 'employment_outcomes', 'placements', 'referrals', 'enrollments', 'training_programs', 'vacancies'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
