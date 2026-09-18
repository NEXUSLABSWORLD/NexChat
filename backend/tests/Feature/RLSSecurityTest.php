<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RLSSecurityTest extends TestCase
{
    use RefreshDatabase;

    private function createAuthenticatedUser(array $attributes = []): array
    {
        $user = User::create(array_merge([
            'username' => 'user_' . uniqid(),
            'email' => uniqid() . '@example.com',
            'password_hash' => Hash::make('password123'),
            'primary_language_code' => 'fr',
            'is_online' => true,
        ], $attributes));

        $token = $user->createToken('auth-token')->plainTextToken;

        return [$user, $token];
    }

    /**
     * Test unauthenticated access is blocked
     */
    public function test_unauthenticated_access_blocked(): void
    {
        $response = $this->getJson('/api/conversations');
        $this->assertEquals(401, $response->status());

        $response = $this->getJson('/api/profile/show');
        $this->assertEquals(401, $response->status());

        $response = $this->getJson('/api/messages?conversation_id=1');
        $this->assertEquals(401, $response->status());
    }

    /**
     * Test user data isolation - cannot access other users' conversations
     */
    public function test_user_data_isolation(): void
    {
        [$userOne, $_] = $this->createAuthenticatedUser();
        [$userTwo, $_] = $this->createAuthenticatedUser();
        [$userThree, $tokenThree] = $this->createAuthenticatedUser();

        $conversation = Conversation::create([
            'user_one_id' => $userOne->id,
            'user_two_id' => $userTwo->id,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $tokenThree)
                        ->getJson('/api/conversations/' . $conversation->id);

        $response->assertStatus(403);
    }

    /**
     * Test message access is restricted to conversation participants
     */
    public function test_message_access_restriction(): void
    {
        [$userOne, $_] = $this->createAuthenticatedUser();
        [$userTwo, $_] = $this->createAuthenticatedUser();
        [$userThree, $tokenThree] = $this->createAuthenticatedUser();

        $conversation = Conversation::create([
            'user_one_id' => $userOne->id,
            'user_two_id' => $userTwo->id,
        ]);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $userOne->id,
            'content_original' => 'Private message',
            'source_lang' => 'fr',
            'target_lang' => 'en',
            'is_read' => false,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $tokenThree)
                        ->getJson('/api/messages?conversation_id=' . $conversation->id);

        $response->assertStatus(403);
    }

    /**
     * Test user can only access their own conversations
     */
    public function test_user_can_access_own_conversations(): void
    {
        [$userOne, $tokenOne] = $this->createAuthenticatedUser();
        [$userTwo, $_] = $this->createAuthenticatedUser();

        $conversation = Conversation::create([
            'user_one_id' => $userOne->id,
            'user_two_id' => $userTwo->id,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $tokenOne)
                        ->getJson('/api/conversations');

        $response->assertStatus(200)
                ->assertJsonStructure(['conversations']);

        $this->assertCount(1, $response->json('conversations'));
    }
}
