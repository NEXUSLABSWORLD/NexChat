<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

class SupabaseService
{
    private string $url;
    private string $key;
    private ?string $dbPassword;

    public function __construct()
    {
        $this->url = env('SUPABASE_URL');
        $this->key = env('SUPABASE_ANON_KEY');
        $this->dbPassword = env('SUPABASE_DB_PASSWORD');
    }

    /**
     * Test connection to Supabase database
     */
    public function testConnection(): bool
    {
        try {
            // Test database connection
            DB::connection()->getPdo();
            return true;
        } catch (\Exception $e) {
            logger()->error('Supabase connection failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Make a REST API call to Supabase
     */
    public function apiCall(string $method, string $endpoint, array $data = [])
    {
        $url = $this->url . '/rest/v1/' . $endpoint;
        
        $response = Http::withHeaders([
            'apikey' => $this->key,
            'Authorization' => 'Bearer ' . $this->key,
            'Content-Type' => 'application/json',
            'Prefer' => 'return=representation'
        ])->$method($url, $data);

        return $response;
    }

    /**
     * Get database connection string for direct SQL queries
     */
    public function getDatabaseConnectionString(): string
    {
        return sprintf(
            'pgsql:host=%s;port=%s;dbname=%s;user=%s;password=%s',
            env('DB_HOST'),
            env('DB_PORT'),
            env('DB_DATABASE'),
            env('DB_USERNAME'),
            $this->dbPassword
        );
    }
}
