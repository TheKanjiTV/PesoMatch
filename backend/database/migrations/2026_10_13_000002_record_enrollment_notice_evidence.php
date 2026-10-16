<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            // Existing requests remain null; never invent historical consent.
            $table->timestamp('consent_accepted_at')->nullable();
            $table->string('consent_notice_version', 40)->nullable();
            $table->string('consent_recipient', 160)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('enrollments', fn (Blueprint $table) => $table->dropColumn(['consent_accepted_at', 'consent_notice_version', 'consent_recipient']));
    }
};
