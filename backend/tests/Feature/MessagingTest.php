<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class MessagingTest extends TestCase
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

    private function createConversation(User $userOne, User $userTwo): Conversation
    {
        return Conversation::create([
            'user_one_id' => $userOne->id,
            'user_two_id' => $userTwo->id,
        ]);
    }

    /**
     * Test conversation creation
     */
    public function test_create_conversation(): void
    {
        [$userOne, $token] = $this->createAuthenticatedUser(['primary_language_code' => 'fr']);
        [$userTwo, $_] = $this->createAuthenticatedUser(['primary_language_code' => 'en']);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                        ->postJson('/api/conversations', [
                            'other_user_id' => $userTwo->id,
                        ]);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'message',
                    'conversation' => [
                        'id',
                        'user_one_id',
                        'user_two_id',
                        'created_at',
                    ]
                ])
                ->assertJson([
                    'message' => 'Conversation ready',
                ]);

        $this->assertDatabaseHas('conversations', [
            'user_one_id' => $userOne->id,
            'user_two_id' => $userTwo->id,
        ]);
    }

    /**
     * Test conversation creation validation
     */
    public function test_create_conversation_validation(): void
    {
        [$user, $token] = $this->createAuthenticatedUser();

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                        ->postJson('/api/conversations', [
                            'other_user_id' => '',
                        ]);

        $response->assertStatus(422)
                ->assertJsonStructure([
                    'message',
                    'errors'
                ]);
    }

    /**
     * Test cannot create conversation with yourself
     */
    public function test_cannot_create_conversation_with_self(): void
    {
        [$user, $token] = $this->createAuthenticatedUser();

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                        ->postJson('/api/conversations', [
                            'other_user_id' => $user->id,
                        ]);

        $response->assertStatus(422);
    }

    /**
     * Test getting user conversations
     */
    public function test_get_user_conversations(): void
    {
        [$userOne, $token] = $this->createAuthenticatedUser();
        [$userTwo, $_] = $this->createAuthenticatedUser();

        $this->createConversation($userOne, $userTwo);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                        ->getJson('/api/conversations');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'conversations' => [
                        '*' => [
                            'id',
                            'user_one_id',
                            'user_two_id',
                        ]
                    ]
                ]);

        $this->assertCount(1, $response->json('conversations'));
    }

    /**
     * Test getting conversations requires authentication
     */
    public function test_get_conversations_requires_auth(): void
    {
        $response = $this->getJson('/api/conversations');
        $response->assertStatus(401);
    }

    /**
     * Test sending a message
     */
    public function test_send_message(): void
    {
        [$userOne, $token] = $this->createAuthenticatedUser(['primary_language_code' => 'fr']);
        [$userTwo, $_] = $this->createAuthenticatedUser(['primary_language_code' => 'en']);
        $conversation = $this->createConversation($userOne, $userTwo);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                        ->postJson('/api/messages', [
                            'conversation_id' => $conversation->id,
                            'content' => 'Bonjour, comment ça va?',
                        ]);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'message',
                    'data' => [
                        'id',
                        'conversation_id',
                        'sender_id',
                        'content_original',
                        'source_lang',
                        'target_lang',
                        'is_read',
                        'created_at',
                    ]
                ])
                ->assertJson([
                    'message' => 'Message sent successfully',
                    'data' => [
                        'content_original' => 'Bonjour, comment ça va?',
                        'source_lang' => 'fr',
                        'target_lang' => 'en',
                        'is_read' => false,
                    ]
                ]);
    }

    /**
     * Test sending message validation
     */
    public function test_send_message_validation(): void
    {
        [$user, $token] = $this->createAuthenticatedUser();

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                        ->postJson('/api/messages', [
                            'conversation_id' => '',
                            'content' => '',
                        ]);

        $response->assertStatus(422)
                ->assertJsonStructure([
                    'message',
                    'errors'
                ]);
    }

    /**
     * Test getting messages in conversation
     */
    public function test_get_conversation_messages(): void
    {
        [$userOne, $token] = $this->createAuthenticatedUser(['primary_language_code' => 'fr']);
        [$userTwo, $_] = $this->createAuthenticatedUser(['primary_language_code' => 'en']);
        $conversation = $this->createConversation($userOne, $userTwo);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $userOne->id,
            'content_original' => 'Hello!',
            'source_lang' => 'fr',
            'target_lang' => 'en',
            'is_read' => false,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                        ->getJson('/api/messages?conversation_id=' . $conversation->id);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'messages',
                    'total'
                ]);

        $this->assertEquals(1, $response->json('total'));
    }

    /**
     * Test getting messages validation
     */
    public function test_get_messages_validation(): void
    {
        [$user, $token] = $this->createAuthenticatedUser();

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                        ->getJson('/api/messages');

        $response->assertStatus(422)
                ->assertJsonStructure([
                    'message',
                    'errors'
                ]);
    }

    /**
     * Test marking message as read
     */
    public function test_mark_message_as_read(): void
    {
        [$userOne, $_] = $this->createAuthenticatedUser(['primary_language_code' => 'fr']);
        [$userTwo, $tokenTwo] = $this->createAuthenticatedUser(['primary_language_code' => 'en']);
        $conversation = $this->createConversation($userOne, $userTwo);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $userOne->id,
            'content_original' => 'Hello!',
            'source_lang' => 'fr',
            'target_lang' => 'en',
            'is_read' => false,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $tokenTwo)
                        ->patchJson('/api/messages/' . $message->id . '/read');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'message',
                    'updated'
                ]);

        $this->assertDatabaseHas('messages', [
            'id' => $message->id,
            'is_read' => true,
        ]);
    }

    /**
     * Test cannot mark own message as read
     */
    public function test_cannot_mark_own_message_as_read(): void
    {
        [$userOne, $tokenOne] = $this->createAuthenticatedUser(['primary_language_code' => 'fr']);
        [$userTwo, $_] = $this->createAuthenticatedUser(['primary_language_code' => 'en']);
        $conversation = $this->createConversation($userOne, $userTwo);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $userOne->id,
            'content_original' => 'Hello!',
            'source_lang' => 'fr',
            'target_lang' => 'en',
            'is_read' => false,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $tokenOne)
                        ->patchJson('/api/messages/' . $message->id . '/read');

        $response->assertStatus(400)
                ->assertJson(['message' => 'Cannot mark own message as read']);
    }

    /**
     * Test access denied for non-participant
     */
    public function test_message_access_denied_for_non_participant(): void
    {
        [$userOne, $_] = $this->createAuthenticatedUser(['primary_language_code' => 'fr']);
        [$userTwo, $_] = $this->createAuthenticatedUser(['primary_language_code' => 'en']);
        [$userThree, $tokenThree] = $this->createAuthenticatedUser(['primary_language_code' => 'es']);

        $conversation = $this->createConversation($userOne, $userTwo);

        $response = $this->withHeader('Authorization', 'Bearer ' . $tokenThree)
                        ->getJson('/api/messages?conversation_id=' . $conversation->id);

        $response->assertStatus(403);
    }
}
