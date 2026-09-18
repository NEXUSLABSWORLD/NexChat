<?php

namespace Tests\Feature;

use App\Services\SupabaseService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupabaseConnectionTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test database connection via service
     */
    public function test_database_connection(): void
    {
        if (env('TEST_SUPABASE_CONNECTION', false) !== true) {
            $this->markTestSkipped('Supabase integration tests require TEST_SUPABASE_CONNECTION=true.');
        }

        $supabase = new SupabaseService();
        $this->assertTrue($supabase->testConnection());
    }

    /**
     * Test basic database operations
     */
    public function test_basic_database_operations(): void
    {
        if (env('TEST_SUPABASE_CONNECTION', false) !== true) {
            $this->markTestSkipped('Supabase integration tests require TEST_SUPABASE_CONNECTION=true.');
        }

        $result = \DB::select('SELECT 1 as test');

        $this->assertNotEmpty($result);
        $this->assertEquals(1, $result[0]->test);
    }
}
