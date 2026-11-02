<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\GroupMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GroupTranslationTest extends TestCase
{
    use RefreshDatabase;

    private function createUser(string $language, string $name): User
    {
        return User::create([
            'username' => $name,
            'email' => $name . '@example.com',
            'password_hash' => Hash::make('password123'),
            'primary_language_code' => $language,
            'is_online' => true,
        ]);
    }

    private function createGroup(User $creator, User ...$members): Group
    {
        $group = Group::create([
            'name' => 'Multilingual group',
            'created_by' => $creator->id,
        ]);

        GroupMember::create([
            'group_id' => $group->id,
            'user_id' => $creator->id,
            'role' => 'admin',
        ]);

        foreach ($members as $member) {
            GroupMember::create([
                'group_id' => $group->id,
                'user_id' => $member->id,
            ]);
        }

        return $group;
    }

    public function test_group_message_is_translated_and_cached_for_each_member_language(): void
    {
        config(['services.deepl.key' => null]);
        Http::fake([
            'https://api.mymemory.translated.net/*' => Http::response([
                'responseData' => ['translatedText' => 'Translated message'],
            ]),
        ]);

        $sender = $this->createUser('fr', 'sender');
        $englishUser = $this->createUser('en', 'english');
        $spanishUser = $this->createUser('es', 'spanish');
        $group = $this->createGroup($sender, $englishUser, $spanishUser);
        $token = $sender->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)->postJson("/api/groups/{$group->id}/messages", [
            'content_original' => 'Bonjour monde',
        ]);

        $response->assertCreated()
            ->assertJsonPath('group_message.translations.0.language_code', 'en')
            ->assertJsonPath('group_message.translations.1.language_code', 'es');

        $messageId = $response->json('group_message.id');
        $this->assertDatabaseHas('group_message_translations', [
            'group_message_id' => $messageId,
            'language_code' => 'en',
            'translated_content' => 'Translated message',
        ]);
        $this->assertDatabaseHas('group_message_translations', [
            'group_message_id' => $messageId,
            'language_code' => 'es',
            'translated_content' => 'Translated message',
        ]);
        $this->assertSame(4, $sender->fresh()->ai_words_translated_count);
        Http::assertSentCount(2);
    }

    public function test_group_show_uses_cached_translation_for_current_member_language(): void
    {
        config(['services.deepl.key' => null]);
        Http::fake([
            'https://api.mymemory.translated.net/*' => Http::response([
                'responseData' => ['translatedText' => 'Cached translation'],
            ]),
        ]);

        $sender = $this->createUser('fr', 'sender');
        $englishUser = $this->createUser('en', 'english');
        $group = $this->createGroup($sender, $englishUser);
        $senderToken = $sender->createToken('sender')->plainTextToken;

        $sendResponse = $this->withHeader('Authorization', 'Bearer ' . $senderToken)->postJson("/api/groups/{$group->id}/messages", [
            'content_original' => 'Bonjour',
        ]);
        $sendResponse->assertCreated();

        $response = $this->actingAs($englishUser, 'sanctum')
            ->getJson("/api/groups/{$group->id}");

        $response->assertOk()
            ->assertJsonPath('messages.0.content_translated', 'Cached translation')
            ->assertJsonPath('messages.0.target_lang', 'en');
        Http::assertSentCount(1);
    }
}
