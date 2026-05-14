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
        $supabase = new SupabaseService();
        $this->assertTrue($supabase->testConnection());
    }

    /**
     * Test basic database operations
     */
    public function test_basic_database_operations(): void
    {
        $result = \DB::select('SELECT 1 as test');

        $this->assertNotEmpty($result);
        $this->assertEquals(1, $result[0]->test);
    }
}
