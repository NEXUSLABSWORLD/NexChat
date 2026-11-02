<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProfilePasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_update_password(): void
    {
        $user = User::create([
            'username' => 'password-user',
            'email' => 'password@example.com',
            'password_hash' => Hash::make('old-password'),
            'primary_language_code' => 'fr',
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/profile/update-password', [
            'current_password' => 'old-password',
            'new_password' => 'new-password',
            'new_password_confirmation' => 'new-password',
        ]);

        $response->assertOk();
        $this->assertTrue(Hash::check('new-password', $user->fresh()->password_hash));
    }
}
