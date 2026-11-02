<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ContactByEmailTest extends TestCase
{
    use RefreshDatabase;

    private function createUser(string $username, string $email): User
    {
        return User::create([
            'username' => $username,
            'email' => $email,
            'password_hash' => Hash::make('password123'),
            'primary_language_code' => 'fr',
            'is_online' => true,
        ]);
    }

    public function test_user_can_add_contact_by_email(): void
    {
        $user = $this->createUser('owner', 'owner@example.com');
        $contact = $this->createUser('contact', 'Contact@Example.com');
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/moderation/contacts/by-email', [
            'email' => ' contact@example.com ',
        ]);

        $response->assertCreated()
            ->assertJsonPath('status', 'added')
            ->assertJsonPath('contact.id', $contact->id);

        $this->assertDatabaseHas('user_contacts', [
            'user_id' => $user->id,
            'contact_id' => $contact->id,
        ]);
    }

    public function test_adding_unknown_email_returns_not_found(): void
    {
        $user = $this->createUser('owner', 'owner@example.com');
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/moderation/contacts/by-email', ['email' => 'missing@example.com'])
            ->assertNotFound();
    }
}
