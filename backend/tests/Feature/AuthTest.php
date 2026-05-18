<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

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

        $this->assertDatabaseHas('users', [
            'username' => 'testuser',
            'email' => 'test@example.com',
            'primary_language_code' => 'fr',
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
     * Test duplicate email registration
     */
    public function test_duplicate_email_registration(): void
    {
        User::create([
            'username' => 'existing',
            'email' => 'test@example.com',
            'password_hash' => Hash::make('password123'),
            'primary_language_code' => 'fr',
        ]);

        $response = $this->postJson('/api/auth/register', [
            'username' => 'newuser',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'primary_language_code' => 'en',
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test user login
     */
    public function test_user_login(): void
    {
        User::create([
            'username' => 'loginuser',
            'email' => 'login@example.com',
            'password_hash' => Hash::make('password123'),
            'primary_language_code' => 'en',
        ]);

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

        $this->assertNotEmpty($response->json('token'));
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

    /**
     * Test user logout
     */
    public function test_user_logout(): void
    {
        $user = User::create([
            'username' => 'logoutuser',
            'email' => 'logout@example.com',
            'password_hash' => Hash::make('password123'),
            'primary_language_code' => 'fr',
            'is_online' => true,
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                        ->postJson('/api/auth/logout');

        $response->assertStatus(200)
                ->assertJson(['message' => 'Logout successful']);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'is_online' => false,
        ]);
    }

    /**
     * Test protected routes require authentication
     */
    public function test_protected_routes_require_auth(): void
    {
        $response = $this->getJson('/api/profile/show');
        $response->assertStatus(401);

        $response = $this->getJson('/api/conversations');
        $response->assertStatus(401);

        $response = $this->getJson('/api/messages?conversation_id=1');
        $response->assertStatus(401);
    }
}
