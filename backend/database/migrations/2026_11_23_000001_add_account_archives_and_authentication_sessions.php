<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('archived_at')->nullable()->index();
        });
        Schema::create('authentication_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('session_hash', 64)->unique();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 512)->nullable();
            $table->timestamp('started_at');
            $table->timestamp('last_seen_at');
            $table->timestamp('expires_at')->index();
            $table->timestamp('ended_at')->nullable();
            $table->string('end_reason')->nullable();
            $table->index(['user_id', 'ended_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('authentication_sessions');
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('archived_at'));
    }
};
