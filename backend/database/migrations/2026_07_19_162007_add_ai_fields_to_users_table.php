<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('ai_proactive_translation')->default(true);
            $table->string('ai_translation_formality')->default('auto');
            $table->unsignedInteger('ai_words_translated_count')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'ai_proactive_translation',
                'ai_translation_formality',
                'ai_words_translated_count'
            ]);
        });
    }
};
