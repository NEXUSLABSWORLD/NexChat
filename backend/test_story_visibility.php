<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

// Create token for user 1
$user = User::find(1);
$token = $user->createToken('test')->plainTextToken;

// 1. Test creating a story
$ch = curl_init('http://localhost:8000/api/stories');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Accept: application/json',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'text_content' => 'Ceci est un statut test visible par tous ! 🚀'
]));

$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "POST /stories => HTTP $httpcode\n";
echo "Response: $response\n\n";

// 2. Test fetching all stories (as another user)
$user2 = User::find(3); // Try another user
if ($user2) {
    $token2 = $user2->createToken('test2')->plainTextToken;
    
    $ch2 = curl_init('http://localhost:8000/api/stories');
    curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch2, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token2,
        'Accept: application/json',
    ]);
    
    $response2 = curl_exec($ch2);
    $httpcode2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
    curl_close($ch2);
    
    echo "GET /stories (as user {$user2->username}) => HTTP $httpcode2\n";
    echo "Response: $response2\n";
} else {
    echo "No second user found to test visibility.\n";
}
