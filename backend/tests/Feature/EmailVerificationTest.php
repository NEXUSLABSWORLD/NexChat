<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_verification_link_marks_account_as_verified(): void
    {
        $plainToken = 'verification-token';

        $user = User::create([
            'username' => 'verification-user',
            'email' => 'verification@example.com',
            'password_hash' => Hash::make('password123'),
            'primary_language_code' => 'fr',
            'login_token' => hash('sha256', $plainToken),
            'login_token_expires_at' => now()->addMinutes(15),
        ]);

        $response = $this->postJson('/api/auth/login/verify', [
            'email' => $user->email,
            'token' => $plainToken,
        ]);

        $response->assertOk()
            ->assertJsonStructure(['message', 'user', 'token']);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
        ]);
        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->assertNull($user->fresh()->login_token);
    }
}
