<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

#[Fillable(['conversation_id', 'sender_id', 'content_original', 'content_translated', 'source_lang', 'target_lang', 'is_read'])]
#[Hidden(['updated_at'])]
class Message extends Model
{
    use HasFactory;

    /**
     * Get the conversation that owns the message
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Get the sender of the message
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * Get the recipient of the message (other user in conversation)
     */
    public function getRecipient(): ?User
    {
        $conversation = $this->conversation;
        if (!$conversation) {
            return null;
        }

        return $conversation->getOtherUser($this->sender_id);
    }

    /**
     * Check if message is unread for a specific user
     */
    public function isUnreadFor(int $userId): bool
    {
        return !$this->is_read && $this->sender_id !== $userId;
    }

    /**
     * Mark message as read
     */
    public function markAsRead(): bool
    {
        $this->is_read = true;
        return $this->save();
    }

    /**
     * Get the content to display for a specific user
     * Returns translated content if available and user is not sender
     */
    public function getDisplayContent(int $userId): string
    {
        // If user is sender, return original content
        if ($this->sender_id === $userId) {
            return $this->content_original;
        }

        // If translated content exists, return it
        if ($this->content_translated) {
            return $this->content_translated;
        }

        // Fallback to original content
        return $this->content_original;
    }

    /**
     * Get the language code for display to a specific user
     */
    public function getDisplayLanguage(int $userId): string
    {
        // If user is sender, return source language
        if ($this->sender_id === $userId) {
            return $this->source_lang;
        }

        // If translation exists, return target language
        if ($this->content_translated) {
            return $this->target_lang;
        }

        // Fallback to source language
        return $this->source_lang;
    }
}
