<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
            $table->string('walk_in_name', 160)->nullable();
            $table->string('municipality', 160)->nullable();
            $table->string('participant_reference', 100)->nullable();
            $table->string('entry_method', 30)->default('self_service');
            $table->unique(['training_program_id', 'participant_reference'], 'enrollment_participant_reference_unique');
        });
        Schema::create('training_demands', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('topic', 160);
            $table->string('topic_key', 160);
            $table->foreignId('source_program_id')->nullable()->constrained('training_programs')->nullOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'topic_key']);
        });
        Schema::create('ai_embeddings', function (Blueprint $table) {
            $table->id();
            $table->string('source_type', 20);
            $table->unsignedBigInteger('source_id');
            $table->string('model', 100);
            $table->string('content_hash', 64);
            $table->longText('vector');
            $table->timestamps();
            $table->unique(['source_type', 'source_id', 'model']);
        });
        Schema::create('ai_practices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vacancy_id')->constrained()->cascadeOnDelete();
            $table->string('language', 2);
            $table->string('model', 100);
            $table->unsignedInteger('version')->default(1);
            $table->longText('transcript');
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_practices');
        Schema::dropIfExists('ai_embeddings');
        Schema::dropIfExists('training_demands');
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropUnique('enrollment_participant_reference_unique');
            $table->dropColumn(['walk_in_name', 'municipality', 'participant_reference', 'entry_method']);
        });
        // user_id stays nullable: rolling back must not destroy walk-in history.
    }
};
