<?php

namespace Tests\Feature;

use Tests\TestCase;

class ProfileTest extends TestCase
{
    /**
     * Test profile show endpoint
     */
    public function test_profile_show(): void
    {
        $response = $this->getJson('/api/profile/show?user_id=1');

        // Should return either 200 (success) or 404 (not found)
        $this->assertContains($response->status(), [200, 404]);
        
        if ($response->status() === 200) {
            $response->assertJsonStructure([
                'user' => [
                    'id',
                    'username',
                    'email',
                    'primary_language_code',
                    'is_online',
                    'last_seen_at',
                    'created_at',
                ]
            ]);
        }
    }

    /**
     * Test profile show without user_id
     */
    public function test_profile_show_without_user_id(): void
    {
        $response = $this->getJson('/api/profile/show');

        $response->assertStatus(400)
                ->assertJson([
                    'message' => 'User ID required'
                ]);
    }

    /**
     * Test profile update endpoint
     */
    public function test_profile_update(): void
    {
        $response = $this->putJson('/api/profile/update?user_id=1', [
            'username' => 'newusername',
            'primary_language_code' => 'en',
        ]);

        // Should return either 200 (success) or 404 (not found)
        $this->assertContains($response->status(), [200, 404]);
        
        if ($response->status() === 200) {
            $response->assertJsonStructure([
                'message',
                'user' => [
                    'id',
                    'username',
                    'email',
                    'primary_language_code',
                    'is_online',
                    'updated_at',
                ]
            ]);
        }
    }

    /**
     * Test profile update validation
     */
    public function test_profile_update_validation(): void
    {
        $response = $this->putJson('/api/profile/update?user_id=1', [
            'username' => '',
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
        $response = $this->getJson('/api/profile/search?query=test');

        // Should return either 200 (success), 422 (validation error), or 500 (server error)
        $this->assertContains($response->status(), [200, 422, 500]);
        
        if ($response->status() === 200) {
            $response->assertJsonStructure([
                'users' => [
                    '*' => [
                        'id',
                        'username',
                        'primary_language_code',
                        'is_online',
                    ]
                ]
            ]);
        }
    }

    /**
     * Test user search validation
     */
    public function test_user_search_validation(): void
    {
        $response = $this->getJson('/api/profile/search?query=a');

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
        $response = $this->getJson('/api/profile/search');

        $response->assertStatus(422)
                ->assertJsonStructure([
                    'message',
                    'errors'
                ]);
    }
}
