<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "=== LISTE DES UTILISATEURS EN BD ===\n";
$users = User::all();

if ($users->isEmpty()) {
    echo "Aucun utilisateur dans la BD locale.\nCréation d'utilisateurs de test...\n";

    $user1 = User::create([
        'username' => 'Sam Frontend',
        'email' => 'sam.frontend@example.com',
        'password_hash' => Hash::make('password123'),
        'primary_language_code' => 'fr',
        'email_verified_at' => now(),
        'is_online' => true,
    ]);
    echo "✅ Créé : Sam Frontend (sam.frontend@example.com / password123)\n";

    $user2 = User::create([
        'username' => 'Alice Dev',
        'email' => 'alice@example.com',
        'password_hash' => Hash::make('password123'),
        'primary_language_code' => 'en',
        'email_verified_at' => now(),
        'is_online' => false,
    ]);
    echo "✅ Créé : Alice Dev (alice@example.com / password123)\n";

    $user3 = User::create([
        'username' => 'Carlos Translator',
        'email' => 'carlos@example.com',
        'password_hash' => Hash::make('password123'),
        'primary_language_code' => 'es',
        'email_verified_at' => now(),
        'is_online' => false,
    ]);
    echo "✅ Créé : Carlos Translator (carlos@example.com / password123)\n";
} else {
    foreach ($users as $u) {
        echo "ID={$u->id} | {$u->username} | Email={$u->email} | Verified=" . ($u->email_verified_at ? 'Oui' : 'Non') . "\n";
    }
}
