<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['vacancies', 'training_programs', 'enrollments'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->softDeletes());
        }
        Schema::table('training_programs', function (Blueprint $table) {
            $table->foreignId('source_program_id')->nullable()->constrained('training_programs')->nullOnDelete();
            $table->text('intake_verification')->nullable();
        });
        Schema::table('service_events', function (Blueprint $table) {
            $table->string('reference_name', 160)->nullable();
            $table->string('reference_url', 700)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('service_events', fn (Blueprint $table) => $table->dropColumn(['reference_name', 'reference_url']));
        Schema::table('training_programs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('source_program_id');
            $table->dropColumn('intake_verification');
        });
        foreach (['vacancies', 'training_programs', 'enrollments'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->dropSoftDeletes());
        }
    }
};
