<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\DB;

class SupabaseSafeConnectionTest extends TestCase
{
    /**
     * Test database connection without refreshing
     */
    public function test_can_connect_to_supabase(): void
    {
        try {
            $result = DB::select('SELECT 1 as test');
            $this->assertEquals(1, $result[0]->test);
            echo "\nSuccessfully connected to Supabase!\n";
        } catch (\Exception $e) {
            $this->fail('Failed to connect to Supabase: ' . $e->getMessage());
        }
    }

    /**
     * Test can query users table
     */
    public function test_can_query_users(): void
    {
        $userCount = DB::table('users')->count();
        echo "\nFound $userCount users in Supabase.\n";
        $this->assertGreaterThanOrEqual(0, $userCount);
    }
}
