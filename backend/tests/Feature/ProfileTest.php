<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    private function createAuthenticatedUser(array $attributes = []): array
    {
        $user = User::create(array_merge([
            'username' => 'testuser',
            'email' => 'test@example.com',
            'password_hash' => Hash::make('password123'),
            'primary_language_code' => 'fr',
            'is_online' => true,
        ], $attributes));

        $token = $user->createToken('auth-token')->plainTextToken;

        return [$user, $token];
    }

    /**
     * Test profile show endpoint
     */
    public function test_profile_show(): void
    {
        [$user, $token] = $this->createAuthenticatedUser();

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                        ->getJson('/api/profile/show');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'user' => [
                        'id',
                        'username',
                        'email',
                        'primary_language_code',
                        'is_online',
                        'last_seen_at',
                        'created_at',
                    ]
                ])
                ->assertJson([
                    'user' => [
                        'username' => 'testuser',
                        'email' => 'test@example.com',
                        'primary_language_code' => 'fr',
                    ]
                ]);
    }

    /**
     * Test profile show requires authentication
     */
    public function test_profile_show_requires_auth(): void
    {
        $response = $this->getJson('/api/profile/show');
        $response->assertStatus(401);
    }

    /**
     * Test profile update endpoint
     */
    public function test_profile_update(): void
    {
        [$user, $token] = $this->createAuthenticatedUser();

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                        ->putJson('/api/profile/update', [
                            'username' => 'newusername',
                            'primary_language_code' => 'en',
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
                        'updated_at',
                    ]
                ])
                ->assertJson([
                    'message' => 'Profile updated successfully',
                    'user' => [
                        'username' => 'newusername',
                        'primary_language_code' => 'en',
                    ]
                ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'username' => 'newusername',
            'primary_language_code' => 'en',
        ]);
    }

    /**
     * Test profile update validation
     */
    public function test_profile_update_validation(): void
    {
        [$user, $token] = $this->createAuthenticatedUser();

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                        ->putJson('/api/profile/update', [
                            'primary_language_code' => 'invalid',
                        ]);

        $response->assertStatus(422)
                ->assertJsonStructure([
                    'message',
                    'errors'
                ]);
    }

    /**
     * Test user search endpoint
     */
    public function test_user_search(): void
    {
        [$user, $token] = $this->createAuthenticatedUser();

        User::create([
            'username' => 'searchable_user',
            'email' => 'search@example.com',
            'password_hash' => Hash::make('password123'),
            'primary_language_code' => 'en',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                        ->getJson('/api/profile/search?query=searchable');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'users' => [
                        '*' => [
                            'id',
                            'username',
                            'primary_language_code',
                            'is_online',
                        ]
                    ]
                ]);

        $this->assertCount(1, $response->json('users'));
        $this->assertEquals('searchable_user', $response->json('users.0.username'));
    }

    /**
     * Test user search validation
     */
    public function test_user_search_validation(): void
    {
        [$user, $token] = $this->createAuthenticatedUser();

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                        ->getJson('/api/profile/search?query=a');

        $response->assertStatus(422)
                ->assertJsonStructure([
                    'message',
                    'errors'
                ]);
    }

    /**
     * Test user search without query
     */
    public function test_user_search_without_query(): void
    {
        [$user, $token] = $this->createAuthenticatedUser();

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                        ->getJson('/api/profile/search');

        $response->assertStatus(422)
                ->assertJsonStructure([
                    'message',
                    'errors'
                ]);
    }
}
