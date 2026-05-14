<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['username', 'email', 'password_hash', 'primary_language_code', 'is_online', 'last_seen_at'])]
#[Hidden(['password_hash', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasApiTokens, Notifiable;

    /**
     * Sanctum uses getAuthPassword() to verify passwords.
     * Our schema stores passwords in 'password_hash' instead of 'password'.
     */
    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    /**
     * Get conversations where user is participant
     */
    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class, 'user_one_id')
                    ->orWhere('user_two_id', $this->id);
    }

    /**
     * Get messages sent by user
     */
    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    /**
     * Get all conversations for this user (both as user_one and user_two)
     */
    public function getAllConversations()
    {
        return Conversation::where('user_one_id', $this->id)
                          ->orWhere('user_two_id', $this->id)
                          ->orderBy('last_message_at', 'desc');
    }

    /**
     * Get conversation with another user
     */
    public function getConversationWith(int $otherUserId): ?Conversation
    {
        return Conversation::where(function ($query) use ($otherUserId) {
                            $query->where('user_one_id', $this->id)
                                  ->where('user_two_id', $otherUserId);
                        })
                        ->orWhere(function ($query) use ($otherUserId) {
                            $query->where('user_one_id', $otherUserId)
                                  ->where('user_two_id', $this->id);
                        })
                        ->first();
    }

    /**
     * Start or get conversation with another user
     */
    public function startConversationWith(int $otherUserId): Conversation
    {
        $conversation = $this->getConversationWith($otherUserId);
        
        if (!$conversation) {
            $conversation = Conversation::create([
                'user_one_id' => $this->id,
                'user_two_id' => $otherUserId,
            ]);
        }
        
        return $conversation;
    }

    protected function casts(): array
    {
        return [
            'is_online' => 'boolean',
            'last_seen_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
