<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$url = config('services.supabase.url');
$key = config('services.supabase.anon_key');

echo "=== TEST SUPABASE REST API ===\n";
echo "URL: {$url}\n";
echo "Key: " . substr($key, 0, 20) . "...\n\n";

$service = new \App\Services\SupabaseService();
$response = $service->apiCall('get', 'users?select=*');

echo "Status Code: " . $response->status() . "\n";
echo "Response Body: " . $response->body() . "\n";
