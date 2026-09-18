<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;

class SupabaseUserService
{
    private string $url;
    private string $serviceRoleKey;

    public function __construct()
    {
        $this->url = config('services.supabase.url') ?? '';
        $this->serviceRoleKey = config('services.supabase.service_role_key')
            ?? config('services.supabase.anon_key') ?? '';
    }

    /**
     * Build standard headers for Supabase REST API calls
     */
    private function headers(bool $withPrefer = false): array
    {
        $headers = [
            'apikey' => $this->serviceRoleKey,
            'Authorization' => 'Bearer ' . $this->serviceRoleKey,
            'Content-Type' => 'application/json',
        ];

        if ($withPrefer) {
            $headers['Prefer'] = 'return=representation';
        }

        return $headers;
    }

    /**
     * Create a new user via Supabase API
     */
    public function createUser(array $userData): array
    {
        $response = Http::withHeaders($this->headers(true))
            ->post($this->url . '/rest/v1/users', [
                'username' => $userData['username'],
                'email' => $userData['email'],
                'password_hash' => Hash::make($userData['password']),
                'primary_language_code' => strtolower($userData['primary_language_code']),
                'is_online' => false,
            ]);

        if (!$response->successful()) {
            throw new \Exception('Failed to create user: ' . $response->body());
        }

        $data = $response->json();
        return $data[0] ?? [];
    }

    /**
     * Find user by email
     */
    public function findUserByEmail(string $email): ?array
    {
        $response = Http::withHeaders($this->headers())
            ->get($this->url . '/rest/v1/users?email=eq.' . $email);

        if (!$response->successful() || empty($response->json())) {
            return null;
        }

        $data = $response->json();
        return $data[0] ?? null;
    }

    /**
     * Update user status
     */
    public function updateUserStatus(int $userId, bool $isOnline): bool
    {
        $response = Http::withHeaders($this->headers())
            ->patch($this->url . '/rest/v1/users?id=eq.' . $userId, [
                'is_online' => $isOnline,
                'last_seen_at' => now()->toISOString(),
            ]);

        return $response->successful();
    }

    /**
     * Find user by ID
     */
    public function findUserById(int $userId): ?array
    {
        $response = Http::withHeaders($this->headers())
            ->get($this->url . '/rest/v1/users?id=eq.' . $userId);

        if (!$response->successful() || empty($response->json())) {
            return null;
        }

        $data = $response->json();
        return $data[0] ?? null;
    }

    /**
     * Update user profile
     */
    public function updateUser(int $userId, array $data): array
    {
        $response = Http::withHeaders($this->headers(true))
            ->patch($this->url . '/rest/v1/users?id=eq.' . $userId, $data);

        if (!$response->successful()) {
            throw new \Exception('Failed to update user: ' . $response->body());
        }

        $data = $response->json();
        return $data[0] ?? [];
    }

    /**
     * Search users by username
     */
    public function searchUsers(string $query): array
    {
        $response = Http::withHeaders($this->headers())
            ->get($this->url . '/rest/v1/users?username=ilike.*' . $query . '*&limit=10');

        if (!$response->successful()) {
            throw new \Exception('Failed to search users: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * Get all conversations for a user
     */
    public function getUserConversations(int $userId): array
    {
        $response = Http::withHeaders($this->headers())
            ->get($this->url . '/rest/v1/conversations?or=(user_one_id.eq.' . $userId . ',user_two_id.eq.' . $userId . ')&order=last_message_at.desc');

        if (!$response->successful()) {
            throw new \Exception('Failed to fetch conversations: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * Get or create conversation between two users
     */
    public function getOrCreateConversation(int $userId, int $otherUserId): array
    {
        $response = Http::withHeaders($this->headers())
            ->get($this->url . '/rest/v1/conversations?or=(and(user_one_id.eq.' . $userId . ',user_two_id.eq.' . $otherUserId . '),and(user_one_id.eq.' . $otherUserId . ',user_two_id.eq.' . $userId . '))');

        if ($response->successful() && !empty($response->json())) {
            $data = $response->json();
            return $data[0] ?? [];
        }

        $createResponse = Http::withHeaders($this->headers(true))
            ->post($this->url . '/rest/v1/conversations', [
                'user_one_id' => $userId,
                'user_two_id' => $otherUserId,
            ]);

        if (!$createResponse->successful()) {
            throw new \Exception('Failed to create conversation: ' . $createResponse->body());
        }

        return $createResponse->json()[0];
    }

    /**
     * Get conversation by ID
     */
    public function getConversation(int $conversationId): ?array
    {
        $response = Http::withHeaders($this->headers())
            ->get($this->url . '/rest/v1/conversations?id=eq.' . $conversationId);

        if (!$response->successful() || empty($response->json())) {
            return null;
        }

        $data = $response->json();
        return $data[0] ?? null;
    }

    /**
     * Get messages in a conversation
     */
    public function getConversationMessages(int $conversationId, int $limit = 50, int $offset = 0): array
    {
        $response = Http::withHeaders($this->headers())
            ->get($this->url . '/rest/v1/messages?conversation_id=eq.' . $conversationId . '&order=created_at.asc&limit=' . $limit . '&offset=' . $offset);

        if (!$response->successful()) {
            throw new \Exception('Failed to fetch messages: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * Create a new message
     */
    public function createMessage(array $data): array
    {
        $response = Http::withHeaders($this->headers(true))
            ->post($this->url . '/rest/v1/messages', $data);

        if (!$response->successful()) {
            throw new \Exception('Failed to create message: ' . $response->body());
        }

        $result = $response->json();
        return $result[0] ?? [];
    }

    /**
     * Get message by ID
     */
    public function getMessage(int $messageId): ?array
    {
        $response = Http::withHeaders($this->headers())
            ->get($this->url . '/rest/v1/messages?id=eq.' . $messageId);

        if (!$response->successful() || empty($response->json())) {
            return null;
        }

        $data = $response->json();
        return $data[0] ?? null;
    }

    /**
     * Mark message as read
     */
    public function markMessageAsRead(int $messageId): bool
    {
        $response = Http::withHeaders($this->headers())
            ->patch($this->url . '/rest/v1/messages?id=eq.' . $messageId, [
                'is_read' => true,
            ]);

        return $response->successful();
    }

    /**
     * Mark all messages in conversation as read for a user
     */
    public function markConversationAsRead(int $conversationId, int $userId): int
    {
        $response = Http::withHeaders($this->headers())
            ->patch($this->url . '/rest/v1/messages?conversation_id=eq.' . $conversationId . '&sender_id=neq.' . $userId . '&is_read=eq.false', [
                'is_read' => true,
            ]);

        if (!$response->successful()) {
            throw new \Exception('Failed to mark messages as read: ' . $response->body());
        }

        return count($response->json());
    }

    /**
     * Update conversation's last_message_at timestamp
     */
    public function updateConversationLastMessage(int $conversationId): bool
    {
        $response = Http::withHeaders($this->headers())
            ->patch($this->url . '/rest/v1/conversations?id=eq.' . $conversationId, [
                'last_message_at' => now()->toISOString(),
            ]);

        return $response->successful();
    }
}
