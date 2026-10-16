<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('placements', function (Blueprint $t) {
            $t->dropForeign(['referral_id']);
            $t->foreign('referral_id')->references('id')->on('referrals')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('placements', function (Blueprint $t) {
            $t->dropForeign(['referral_id']);
            $t->foreign('referral_id')->references('id')->on('referrals')->restrictOnDelete();
        });
    }
};
