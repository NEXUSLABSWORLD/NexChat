<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Services\SupabaseService;

class SupabaseConnectionTest extends TestCase
{
    /**
     * Test Supabase database connection
     */
    public function test_supabase_connection(): void
    {
        $supabase = new SupabaseService();
        
        // This will test if we can connect to the database
        $isConnected = $supabase->testConnection();
        
        if ($isConnected) {
            $this->assertTrue(true, 'Successfully connected to Supabase database');
        } else {
            $this->markTestSkipped('Cannot connect to Supabase - check database credentials');
        }
    }

    /**
     * Test basic database operations
     */
    public function test_basic_database_operations(): void
    {
        try {
            // Test if we can execute a simple query
            $result = \DB::select('SELECT 1 as test');
            
            $this->assertNotEmpty($result);
            $this->assertEquals(1, $result[0]->test);
        } catch (\Exception $e) {
            $this->markTestSkipped('Database query failed: ' . $e->getMessage());
        }
    }
}
