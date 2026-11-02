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
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('tier'); // 'obsidian_pro' | 'elite_digital'
            $table->string('notchpay_reference')->unique();
            $table->string('notchpay_transaction_id')->nullable();
            $table->string('payment_method')->nullable(); // 'cm.mtn', 'cm.orange', 'card', etc.
            $table->decimal('amount', 10, 2);
            $table->string('currency', 10)->default('XAF');
            $table->string('status')->default('pending'); // 'pending', 'active', 'cancelled', 'expired', 'failed'
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
