<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

class SupabaseService
{
    private string $url;
    private string $key;

    public function __construct()
    {
        $this->url = config('services.supabase.url') ?? '';
        $this->key = config('services.supabase.anon_key') ?? '';
    }

    /**
     * Test connection to Supabase database
     */
    public function testConnection(): bool
    {
        try {
            DB::connection()->getPdo();
            return true;
        } catch (\Exception $e) {
            logger()->error('Database connection failed: ' . $e->getMessage());
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
}
