<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_demands', function (Blueprint $table) {
            $table->text('description')->nullable();
            $table->date('preferred_start')->nullable();
            $table->date('preferred_end')->nullable();
            $table->string('preferred_schedule', 160)->nullable();
            $table->string('mode', 30)->nullable();
            $table->string('location', 160)->nullable();
            $table->text('goal')->nullable();
        });
        Schema::table('referrals', function (Blueprint $table) {
            $table->boolean('outcome_enabled')->default(false);
            $table->string('interview_result', 30)->nullable();
            $table->text('interview_result_notes')->nullable();
            $table->timestamp('interview_result_at')->nullable();
            $table->foreignId('interview_result_by')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('referrals', function (Blueprint $table) {
            $table->dropConstrainedForeignId('interview_result_by');
            $table->dropColumn(['outcome_enabled', 'interview_result', 'interview_result_notes', 'interview_result_at']);
        });
        Schema::table('training_demands', fn (Blueprint $table) => $table->dropColumn(['description', 'preferred_start', 'preferred_end', 'preferred_schedule', 'mode', 'location', 'goal']));
    }
};
