<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// 1. Test connection
echo "=== TEST CONNEXION BD ===\n";
try {
    $usersCount = DB::table('users')->count();
    echo "✅ Connexion OK - Nombre d'utilisateurs: {$usersCount}\n";
} catch (\Exception $e) {
    echo "❌ ERREUR DB: " . $e->getMessage() . "\n";
    exit(1);
}

// 2. Check messages table exists and its structure
echo "\n=== TABLE MESSAGES ===\n";
try {
    $msgCount = DB::table('messages')->count();
    echo "✅ Table messages existe - Nombre de messages: {$msgCount}\n";
    
    $cols = DB::select("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'messages' AND table_schema = 'public' ORDER BY ordinal_position");
    echo "Colonnes:\n";
    foreach ($cols as $col) {
        echo "  - {$col->column_name} ({$col->data_type})\n";
    }
} catch (\Exception $e) {
    echo "❌ ERREUR messages: " . $e->getMessage() . "\n";
}

// 3. Check conversations table
echo "\n=== TABLE CONVERSATIONS ===\n";
try {
    $convCount = DB::table('conversations')->count();
    echo "✅ Table conversations existe - Nombre: {$convCount}\n";
    
    if ($convCount > 0) {
        $firstConv = DB::table('conversations')->first();
        echo "Première conversation: ID={$firstConv->id}, user_one={$firstConv->user_one_id}, user_two={$firstConv->user_two_id}\n";
    }
} catch (\Exception $e) {
    echo "❌ ERREUR conversations: " . $e->getMessage() . "\n";
}

// 4. List users
echo "\n=== UTILISATEURS ===\n";
try {
    $users = DB::table('users')->select('id', 'username', 'email', 'primary_language_code')->get();
    foreach ($users as $u) {
        echo "  ID={$u->id} | {$u->username} | {$u->email} | lang={$u->primary_language_code}\n";
    }
} catch (\Exception $e) {
    echo "❌ ERREUR: " . $e->getMessage() . "\n";
}

// 5. Try to create a test message directly
echo "\n=== TEST INSERTION MESSAGE ===\n";
try {
    $conversations = DB::table('conversations')->first();
    if ($conversations) {
        $testMsg = DB::table('messages')->insertGetId([
            'conversation_id' => $conversations->id,
            'sender_id' => $conversations->user_one_id,
            'content_original' => 'TEST_MESSAGE_DB_CHECK',
            'content_translated' => null,
            'source_lang' => 'fr',
            'target_lang' => 'fr',
            'is_read' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        echo "✅ Message test inséré avec ID: {$testMsg}\n";
        
        // Verify it exists
        $verify = DB::table('messages')->where('id', $testMsg)->first();
        echo "✅ Vérifié en BD: content='{$verify->content_original}'\n";
        
        // Clean up
        DB::table('messages')->where('id', $testMsg)->delete();
        echo "✅ Message test supprimé\n";
    } else {
        echo "⚠️ Aucune conversation trouvée pour tester\n";
    }
} catch (\Exception $e) {
    echo "❌ ERREUR insertion: " . $e->getMessage() . "\n";
}

// 6. Check last messages
echo "\n=== DERNIERS MESSAGES ===\n";
try {
    $lastMsgs = DB::table('messages')->orderBy('created_at', 'desc')->limit(5)->get();
    if ($lastMsgs->isEmpty()) {
        echo "Aucun message en BD\n";
    } else {
        foreach ($lastMsgs as $m) {
            echo "  ID={$m->id} | conv={$m->conversation_id} | sender={$m->sender_id} | '{$m->content_original}' | {$m->created_at}\n";
        }
    }
} catch (\Exception $e) {
    echo "❌ ERREUR: " . $e->getMessage() . "\n";
}
