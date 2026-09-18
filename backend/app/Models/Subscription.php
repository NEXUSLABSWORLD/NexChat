<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    protected $fillable = [
        'user_id',
        'tier',
        'notchpay_reference',
        'notchpay_transaction_id',
        'payment_method',
        'amount',
        'currency',
        'status',
        'starts_at',
        'expires_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    /**
     * The user who owns this subscription.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope: only active subscriptions.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
                     ->where('expires_at', '>', now());
    }

    /**
     * Scope: filter by tier.
     */
    public function scopeForTier($query, string $tier)
    {
        return $query->where('tier', $tier);
    }

    /**
     * Check if this subscription is currently active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active' && $this->expires_at && $this->expires_at->isFuture();
    }

    /**
     * Check if this subscription has expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Activate this subscription for a given number of days.
     */
    public function activate(int $durationDays = 30): self
    {
        $this->update([
            'status' => 'active',
            'starts_at' => now(),
            'expires_at' => now()->addDays($durationDays),
        ]);

        // Also update the user's subscription_tier
        $this->user->update(['subscription_tier' => $this->tier]);

        return $this;
    }
}
