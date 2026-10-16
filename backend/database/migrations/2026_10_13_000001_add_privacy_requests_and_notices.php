<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->timestamp('terms_accepted_at')->nullable();
            $t->string('terms_version', 40)->nullable();
            $t->string('privacy_notice_version', 40)->nullable();
        });
        Schema::create('privacy_requests', function (Blueprint $t) {
            $t->id();
            $t->uuid('reference')->unique();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('kind', 30);
            $t->text('details')->nullable();
            $t->string('status', 30)->default('requested');
            $t->text('response')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('privacy_requests');
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn(['terms_accepted_at', 'terms_version', 'privacy_notice_version']));
    }
};
