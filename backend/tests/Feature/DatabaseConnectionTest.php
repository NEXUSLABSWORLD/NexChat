<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseConnectionTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test database connection works
     */
    public function test_database_connection(): void
    {
        $result = \DB::select('SELECT 1 as test');

        $this->assertNotEmpty($result);
        $this->assertEquals(1, $result[0]->test);
    }

    /**
     * Test that required tables exist
     */
    public function test_required_tables_exist(): void
    {
        $this->assertTrue(\Schema::hasTable('users'));
        $this->assertTrue(\Schema::hasTable('conversations'));
        $this->assertTrue(\Schema::hasTable('messages'));
        $this->assertTrue(\Schema::hasTable('personal_access_tokens'));
    }

    /**
     * Test users table has correct columns
     */
    public function test_users_table_structure(): void
    {
        $this->assertTrue(\Schema::hasColumns('users', [
            'id', 'username', 'email', 'password_hash',
            'primary_language_code', 'is_online', 'last_seen_at',
            'created_at', 'updated_at',
        ]));
    }

    /**
     * Test conversations table has correct columns
     */
    public function test_conversations_table_structure(): void
    {
        $this->assertTrue(\Schema::hasColumns('conversations', [
            'id', 'user_one_id', 'user_two_id', 'last_message_at',
            'created_at', 'updated_at',
        ]));
    }

    /**
     * Test messages table has correct columns
     */
    public function test_messages_table_structure(): void
    {
        $this->assertTrue(\Schema::hasColumns('messages', [
            'id', 'conversation_id', 'sender_id',
            'content_original', 'content_translated',
            'source_lang', 'target_lang', 'is_read',
            'created_at', 'updated_at',
        ]));
    }
}
