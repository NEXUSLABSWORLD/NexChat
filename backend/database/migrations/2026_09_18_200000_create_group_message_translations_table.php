<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('group_message_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_message_id')->constrained('group_messages')->onDelete('cascade');
            $table->string('language_code', 5);
            $table->text('translated_content');
            $table->timestamps();

            $table->unique(['group_message_id', 'language_code']);
            $table->index(['language_code', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_message_translations');
    }
};
