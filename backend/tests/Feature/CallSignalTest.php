<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CallSignalTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $name): User
    {
        return User::create([
            'username' => $name,
            'email' => $name . '@example.com',
            'password_hash' => Hash::make('password123'),
            'primary_language_code' => 'fr',
            'is_online' => true,
        ]);
    }

    public function test_conversation_member_can_send_call_signal(): void
    {
        Event::fake();
        $caller = $this->user('caller');
        $receiver = $this->user('receiver');
        $conversation = Conversation::create([
            'user_one_id' => $caller->id,
            'user_two_id' => $receiver->id,
        ]);
        $token = $caller->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/calls/signal', [
            'conversation_id' => $conversation->id,
            'call_id' => 'call-123',
            'call_type' => 'video',
            'action' => 'offer',
            'target_user_id' => $receiver->id,
            'payload' => ['description' => ['type' => 'offer', 'sdp' => 'test']],
        ]);

        $response->assertOk();
        Event::assertDispatched(\App\Events\CallSignal::class);
    }

    public function test_non_member_cannot_send_call_signal(): void
    {
        Event::fake();
        $caller = $this->user('caller');
        $receiver = $this->user('receiver');
        $outsider = $this->user('outsider');
        $conversation = Conversation::create([
            'user_one_id' => $caller->id,
            'user_two_id' => $receiver->id,
        ]);
        $token = $outsider->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/calls/signal', [
            'conversation_id' => $conversation->id,
            'call_id' => 'call-123',
            'call_type' => 'audio',
            'action' => 'offer',
            'target_user_id' => $receiver->id,
        ])->assertForbidden();

        Event::assertNotDispatched(\App\Events\CallSignal::class);
    }
}
