<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class DatabaseConnectionTest extends TestCase
{
    /**
     * Test Supabase API connection
     */
    public function test_supabase_api_connection(): void
    {
        try {
            $supabaseUrl = env('SUPABASE_URL');
            $supabaseKey = env('SUPABASE_ANON_KEY');
            
            // Test API connection by checking if we can access the auth endpoint
            $response = \Http::withHeaders([
                'apikey' => $supabaseKey,
                'Authorization' => 'Bearer ' . $supabaseKey,
            ])->withoutVerifying()->get($supabaseUrl . '/auth/v1/settings');
            
            // Debug information
            if (!$response->successful()) {
                $this->fail('Supabase API failed. Status: ' . $response->status() . ', Body: ' . $response->body());
            }
            
            $this->assertTrue($response->successful(), 'Supabase API should be accessible');
            
        } catch (\Exception $e) {
            $this->fail('Supabase API connection failed: ' . $e->getMessage());
        }
    }

    /**
     * Test basic Laravel configuration
     */
    public function test_laravel_configuration(): void
    {
        // Test that environment variables are set
        $this->assertNotNull(env('SUPABASE_URL'), 'Supabase URL should be configured');
        $this->assertNotNull(env('SUPABASE_ANON_KEY'), 'Supabase anon key should be configured');
        $this->assertEquals('pgsql', env('DB_CONNECTION'), 'Database connection should be PostgreSQL');
        $this->assertEquals('db.vxdsqgrxwyswgyhwolty.supabase.co', env('DB_HOST'), 'Database host should be Supabase');
    }
}
