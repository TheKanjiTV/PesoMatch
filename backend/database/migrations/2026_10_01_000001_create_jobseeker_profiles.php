<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name', 100)->nullable();
            $table->string('middle_name', 100)->nullable();
            $table->string('last_name', 100)->nullable();
            $table->string('role')->default('jobseeker');
            $table->timestamp('dashboard_tour_completed_at')->nullable();
        });
        Schema::create('jobseeker_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->date('birth_date')->nullable();
            $table->string('sex', 40)->nullable();
            $table->string('mobile_number', 13)->nullable();
            $table->string('address_line')->nullable();
            $table->string('province')->nullable();
            $table->string('municipality')->nullable();
            $table->string('barangay')->nullable();
            $table->unsignedTinyInteger('onboarding_step')->default(1);
            $table->string('profile_completion_status')->default('in_progress');
            $table->timestamp('profile_completed_at')->nullable();
            $table->boolean('has_work_experience')->nullable();
            foreach (['personal', 'education', 'skills', 'work_experience', 'preferences'] as $step) {
                $table->timestamp($step.'_completed_at')->nullable();
            }
            $table->timestamps();
        });
        Schema::create('jobseeker_educations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jobseeker_profile_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('highest_attainment');
            $table->string('school_name');
            $table->string('course_program')->nullable();
            $table->unsignedSmallInteger('year_graduated')->nullable();
            $table->string('educational_status');
            $table->timestamps();
        });
        Schema::create('skills', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
        });
        Schema::create('jobseeker_skill', function (Blueprint $table) {
            $table->foreignId('jobseeker_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained()->cascadeOnDelete();
            $table->string('proficiency_level')->nullable();
            $table->timestamps();
            $table->primary(['jobseeker_profile_id', 'skill_id']);
        });
        Schema::create('jobseeker_certifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jobseeker_profile_id')->constrained()->cascadeOnDelete();
            $table->string('certification_name');
            $table->string('issuing_organization')->nullable();
            $table->date('issued_at')->nullable();
            $table->string('credential_reference')->nullable();
            $table->timestamps();
        });
        Schema::create('jobseeker_languages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jobseeker_profile_id')->constrained()->cascadeOnDelete();
            $table->string('language');
            $table->string('proficiency');
            $table->timestamps();
        });
        Schema::create('jobseeker_licenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jobseeker_profile_id')->constrained()->cascadeOnDelete();
            $table->string('license_name');
            $table->string('license_number')->nullable();
            $table->date('expiry_date')->nullable();
            $table->timestamps();
        });
        Schema::create('jobseeker_work_experiences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jobseeker_profile_id')->constrained()->cascadeOnDelete();
            $table->string('job_title');
            $table->string('company_name');
            $table->string('industry')->nullable();
            $table->string('employment_type')->nullable();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->boolean('is_current')->default(false);
            $table->text('description')->nullable();
            $table->timestamps();
        });
        Schema::create('jobseeker_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jobseeker_profile_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('preferred_industry')->nullable();
            $table->string('preferred_location')->nullable();
            $table->boolean('willing_to_relocate')->default(false);
            $table->timestamps();
        });
        foreach (['occupations', 'employment_types', 'work_arrangements'] as $name) {
            Schema::create('jobseeker_preferred_'.$name, function (Blueprint $table) use ($name) {
                $table->id();
                $table->foreignId('jobseeker_preference_id');
                $table->foreign('jobseeker_preference_id', 'pref_'.$name.'_fk')->references('id')->on('jobseeker_preferences')->cascadeOnDelete();
                $table->string('value');
                $table->unique(['jobseeker_preference_id', 'value'], 'pref_'.$name.'_unique');
            });
        }
    }

    public function down(): void
    {
        foreach (['occupations', 'employment_types', 'work_arrangements'] as $name) {
            Schema::dropIfExists('jobseeker_preferred_'.$name);
        }
        foreach (['jobseeker_preferences', 'jobseeker_work_experiences', 'jobseeker_licenses', 'jobseeker_languages', 'jobseeker_certifications', 'jobseeker_skill', 'skills', 'jobseeker_educations', 'jobseeker_profiles'] as $name) {
            Schema::dropIfExists($name);
        }
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn(['first_name', 'middle_name', 'last_name', 'role', 'dashboard_tour_completed_at']));
    }
};
