<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vacancies', function (Blueprint $t) {
            $t->string('source_url', 700)->nullable()->unique();
            $t->string('source_name')->nullable();
            $t->timestamp('source_checked_at')->nullable();
            $t->date('source_posted_on')->nullable();
            $t->string('source_salary')->nullable();
            $t->boolean('external_application')->default(false);
            $t->unsignedInteger('slots')->nullable()->change();
            $t->date('deadline')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('vacancies', fn (Blueprint $t) => $t->dropColumn(['source_url', 'source_name', 'source_checked_at', 'source_posted_on', 'source_salary', 'external_application']));
    }
};
