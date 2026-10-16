<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_events', function (Blueprint $table) {
            $table->timestamp('starts_at')->nullable()->change();
            $table->date('event_date')->nullable();
            $table->string('source_key', 64)->nullable()->unique();
            $table->string('source_url', 700)->nullable();
            $table->string('source_name')->nullable();
            $table->string('source_reference')->nullable();
            $table->string('verification_method', 400)->nullable();
            $table->timestamp('source_checked_at')->nullable();
        });
        Schema::create('public_resources', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('publisher');
            $table->string('source_url', 700)->unique();
            $table->string('reference_period');
            $table->string('scope');
            $table->json('indicators');
            $table->text('notes');
            $table->timestamp('source_checked_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('public_resources');
        Schema::table('service_events', fn (Blueprint $table) => $table->dropColumn(['event_date', 'source_key', 'source_url', 'source_name', 'source_reference', 'verification_method', 'source_checked_at']));
        // Do not force starts_at back to NOT NULL: source calendars may only
        // publish a date. A rollback must not invent times or delete records.
    }
};
