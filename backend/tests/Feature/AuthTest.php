<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class AuthTest extends TestCase
{
    /**
     * Test user registration
     */
    public function test_user_registration(): void
    {
        $userData = [
            'username' => 'testuser',
            'email' => 'test@example.com',
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
                        'created_at',
                    ]
                ])
                ->assertJson([
                    'message' => 'User registered successfully',
                    'user' => [
                        'username' => 'testuser',
                        'email' => 'test@example.com',
                        'primary_language_code' => 'fr',
                        'is_online' => false,
                    ]
                ]);
    }

    /**
     * Test user registration validation
     */
    public function test_user_registration_validation(): void
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
     * Test user login
     */
    public function test_user_login(): void
    {
        // First register a user
        $this->postJson('/api/auth/register', [
            'username' => 'loginuser',
            'email' => 'login@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'primary_language_code' => 'en',
        ]);

        // Then login
        $response = $this->postJson('/api/auth/login', [
            'email' => 'login@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'message',
                    'user' => [
                        'id',
                        'username',
                        'email',
                        'primary_language_code',
                        'is_online',
                        'last_seen_at',
                    ],
                    'token'
                ])
                ->assertJson([
                    'message' => 'Login successful',
                    'user' => [
                        'username' => 'loginuser',
                        'email' => 'login@example.com',
                        'primary_language_code' => 'en',
                        'is_online' => true,
                    ]
                ]);
    }

    /**
     * Test user login with invalid credentials
     */
    public function test_user_login_invalid_credentials(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
                ->assertJson([
                    'message' => 'Invalid credentials'
                ]);
    }
}
