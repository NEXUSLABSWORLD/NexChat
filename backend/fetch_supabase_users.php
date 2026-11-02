<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$service = new \App\Services\SupabaseService();

echo "=== UTILISATEURS DANS SUPABASE CLOUD ===\n";
$resUsers = $service->apiCall('get', 'users?select=*');
echo "Status: " . $resUsers->status() . "\n";
echo "Users Body: " . $resUsers->body() . "\n\n";

echo "=== UTILISATEURS AUTH DANS SUPABASE ===\n";
$resAuth = $service->apiCall('get', 'auth/users?select=*');
echo "Status Auth: " . $resAuth->status() . "\n";
echo "Auth Body: " . $resAuth->body() . "\n";
