<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;

class SupabaseUserService
{
    private string $url;
    private string $key;

    public function __construct()
    {
        $this->url = env('SUPABASE_URL');
        $this->key = env('SUPABASE_ANON_KEY');
    }

    /**
     * Create a new user via Supabase API
     */
    public function createUser(array $userData): array
    {
        $response = Http::withHeaders([
            'apikey' => $this->key,
            'Authorization' => 'Bearer ' . $this->key,
            'Content-Type' => 'application/json',
            'Prefer' => 'return=representation'
        ])->withoutVerifying()->post($this->url . '/rest/v1/users', [
            'username' => $userData['username'],
            'email' => $userData['email'],
            'password_hash' => Hash::make($userData['password']),
            'primary_language_code' => strtolower($userData['primary_language_code']),
            'is_online' => false,
        ]);

        if (!$response->successful()) {
            throw new \Exception('Failed to create user: ' . $response->body());
        }

        return $response->json()[0];
    }

    /**
     * Find user by email
     */
    public function findUserByEmail(string $email): ?array
    {
        $response = Http::withHeaders([
            'apikey' => $this->key,
            'Authorization' => 'Bearer ' . $this->key,
        ])->withoutVerifying()->get($this->url . '/rest/v1/users?email=eq.' . $email);

        if (!$response->successful() || empty($response->json())) {
            return null;
        }

        return $response->json()[0];
    }

    /**
     * Update user status
     */
    public function updateUserStatus(int $userId, bool $isOnline): bool
    {
        $response = Http::withHeaders([
            'apikey' => $this->key,
            'Authorization' => 'Bearer ' . $this->key,
            'Content-Type' => 'application/json',
        ])->withoutVerifying()->patch($this->url . '/rest/v1/users?id=eq.' . $userId, [
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
        $response = Http::withHeaders([
            'apikey' => $this->key,
            'Authorization' => 'Bearer ' . $this->key,
        ])->withoutVerifying()->get($this->url . '/rest/v1/users?id=eq.' . $userId);

        if (!$response->successful() || empty($response->json())) {
            return null;
        }

        return $response->json()[0];
    }

    /**
     * Update user profile
     */
    public function updateUser(int $userId, array $data): array
    {
        $response = Http::withHeaders([
            'apikey' => $this->key,
            'Authorization' => 'Bearer ' . $this->key,
            'Content-Type' => 'application/json',
            'Prefer' => 'return=representation'
        ])->withoutVerifying()->patch($this->url . '/rest/v1/users?id=eq.' . $userId, $data);

        if (!$response->successful()) {
            throw new \Exception('Failed to update user: ' . $response->body());
        }

        return $response->json()[0];
    }

    /**
     * Search users by username
     */
    public function searchUsers(string $query): array
    {
        $response = Http::withHeaders([
            'apikey' => $this->key,
            'Authorization' => 'Bearer ' . $this->key,
        ])->withoutVerifying()->get($this->url . '/rest/v1/users?username=ilike.*' . $query . '*&limit=10');

        if (!$response->successful()) {
            throw new \Exception('Failed to search users: ' . $response->body());
        }

        return $response->json();
    }
}
