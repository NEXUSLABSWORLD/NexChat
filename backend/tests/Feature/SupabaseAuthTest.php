<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SupabaseAuthTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test registration endpoint creates user and returns proper structure
     */
    public function test_registration_endpoint(): void
    {
        $userData = [
            'username' => 'testuser_' . time(),
            'email' => 'test' . time() . '@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'primary_language_code' => 'fr',
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'message',
                    'user' => [
                        'id',
                        'username',
                        'email',
                        'primary_language_code',
                        'is_online',
                    ]
                ]);
    }

    /**
     * Test registration validation
     */
    public function test_registration_validation(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'username' => '',
            'email' => 'invalid-email',
            'password' => '123',
            'primary_language_code' => '',
        ]);

        $response->assertStatus(422)
                ->assertJsonStructure([
                    'message',
                    'errors'
                ]);
    }

    /**
     * Test that login endpoint works
     */
    public function test_login_endpoint(): void
    {
        User::create([
            'username' => 'logintest',
            'email' => 'logintest@example.com',
            'password_hash' => Hash::make('password123'),
            'primary_language_code' => 'en',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'logintest@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
                ->assertJsonStructure(['message', 'user', 'token']);
    }

    /**
     * Test login with wrong credentials
     */
    public function test_login_wrong_credentials(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(401);
    }
}
