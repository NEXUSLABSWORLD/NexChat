<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_one_id', 'user_two_id', 'last_message_at'])]
class Conversation extends Model
{
    /**
     * Get the messages for the conversation
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->orderBy('created_at', 'asc');
    }

    /**
     * Get the first user in the conversation
     */
    public function userOne(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_one_id');
    }

    /**
     * Get the second user in the conversation
     */
    public function userTwo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_two_id');
    }

    /**
     * Get the other user in the conversation (not the specified user)
     */
    public function getOtherUser(int $userId): ?User
    {
        if ($this->user_one_id === $userId) {
            return $this->userTwo;
        } elseif ($this->user_two_id === $userId) {
            return $this->userOne;
        }
        
        return null;
    }

    /**
     * Check if a user is part of this conversation
     */
    public function hasUser(int $userId): bool
    {
        return $this->user_one_id === $userId || $this->user_two_id === $userId;
    }

    /**
     * Get the latest message in the conversation
     */
    public function latestMessage(): ?Message
    {
        return $this->messages()->latest()->first();
    }

    /**
     * Get unread message count for a specific user
     */
    public function unreadCount(int $userId): int
    {
        return $this->messages()
            ->where('sender_id', '!=', $userId)
            ->where('is_read', false)
            ->count();
    }

    /**
     * Mark all messages as read for a specific user
     */
    public function markAsRead(int $userId): int
    {
        return $this->messages()
            ->where('sender_id', '!=', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]);
    }
}
