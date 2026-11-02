<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$users = \App\Models\User::all();
foreach ($users as $u) {
    echo "ID: {$u->id} | Email: {$u->email} | Username: {$u->username} | Verified: " . ($u->email_verified_at ? $u->email_verified_at : 'NON') . " | Lang: {$u->primary_language_code}\n";
}
