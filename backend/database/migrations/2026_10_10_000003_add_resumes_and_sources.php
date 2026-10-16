<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resume_documents', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $t->string('filename');
            $t->string('path');
            $t->json('detected');
            $t->text('excerpt');
            $t->timestamp('applied_at')->nullable();
            $t->timestamps();
        });
        Schema::table('training_programs', function (Blueprint $t) {
            $t->string('source_url', 700)->nullable()->unique();
            $t->string('source_name')->nullable();
            $t->timestamp('source_checked_at')->nullable();
            $t->boolean('external_enrollment')->default(false);
            $t->unsignedInteger('capacity')->nullable()->change();
            $t->date('starts_on')->nullable()->change();
            $t->date('ends_on')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resume_documents');
        Schema::table('training_programs', fn (Blueprint $t) => $t->dropColumn(['source_url', 'source_name', 'source_checked_at', 'external_enrollment']));
    }
};
