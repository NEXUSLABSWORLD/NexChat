<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;

try {
    $conversation = Conversation::first();
    if (!$conversation) {
        echo "No conversation found.\n";
        exit;
    }

    $sender = User::find($conversation->user_one_id);
    
    echo "Creating message...\n";
    $message = Message::create([
        'conversation_id' => $conversation->id,
        'sender_id'       => $sender->id,
        'content_original'=> 'Test Eloquent message',
        'source_lang'     => $sender->primary_language_code ?? 'en',
    ]);
    
    echo "Message created: {$message->id}\n";
    
} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
