<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Events\MessagesRead;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MessageController extends Controller
{
    /**
     * Send a message in a conversation.
     */
    public function store(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('Message store attempt', [
            'user_id' => $request->user()?->id,
            'conversation_id' => $request->input('conversation_id'),
            'has_content' => $request->filled('content'),
            'has_file' => $request->filled('file_url'),
        ]);
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'conversation_id' => 'required|integer',
            'content'         => 'nullable|string|max:2000',
            'file_url'        => 'nullable|url|max:1000',
            'file_name'       => 'nullable|string|max:255',
            'file_type'       => 'nullable|string|max:100',
            'file_size'       => 'nullable|integer',
        ]);

        // Au moins content ou file_url est requis
        if (!$request->filled('content') && !$request->filled('file_url')) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => ['content' => ['Un message ou un fichier est requis.']]
            ], 422);
        }

        try {
            $conversation = Conversation::find($request->conversation_id);
            if (!$conversation) {
                \Illuminate\Support\Facades\Log::warning('Conversation not found', ['id' => $request->conversation_id]);
                return response()->json([
                    'message' => 'Conversation not found'
                ], 404);
            }

            if (!$conversation->hasUser($user->id)) {
                \Illuminate\Support\Facades\Log::warning('Access denied to conversation', ['user' => $user->id, 'conv' => $conversation->id]);
                return response()->json([
                    'message' => 'Access denied'
                ], 403);
            }

            $recipientId = $conversation->user_one_id == $user->id
                ? $conversation->user_two_id
                : $conversation->user_one_id;

            $recipient = User::find($recipientId);

            $sourceLang = $user->primary_language_code ?? 'fr';
            $targetLang = $recipient?->primary_language_code ?? 'fr';
            $contentOriginal = $request->input('content', '');
            $message = Message::create([
                'conversation_id'   => $request->conversation_id,
                'sender_id'         => $user->id,
                'content_original'  => $contentOriginal,
                'content_translated'=> null,
                'source_lang'       => $sourceLang,
                'target_lang'       => $targetLang,
                'is_read'           => false,
                'file_url'          => $request->input('file_url'),
                'file_name'         => $request->input('file_name'),
                'file_type'         => $request->input('file_type'),
                'file_size'         => $request->input('file_size'),
            ]);

            $conversation->update(['last_message_at' => now()]);

            // Diffuser l'événement en temps réel via Reverb
            try {
                broadcast(new MessageSent($message, $conversation->id));
            } catch (\Exception $broadcastErr) {
                \Illuminate\Support\Facades\Log::warning('Broadcast failed (Reverb may be down): ' . $broadcastErr->getMessage());
            }

            if ($contentOriginal && $sourceLang !== $targetLang && $user->canUseAiTranslation()) {
                try {
                    $translationService = app(\App\Services\TranslationService::class);
                    $translated = $translationService->translate($contentOriginal, $targetLang, $sourceLang);
                    if ($translated) {
                        $message->update(['content_translated' => $translated['text']]);
                        $user->increment('ai_words_translated_count', str_word_count($contentOriginal));

                        try {
                            broadcast(new MessageSent($message->fresh(), $conversation->id));
                        } catch (\Exception $broadcastErr) {
                            \Illuminate\Support\Facades\Log::warning('Translation update broadcast failed: ' . $broadcastErr->getMessage());
                        }
                    }
                } catch (\Throwable $translationErr) {
                    \Illuminate\Support\Facades\Log::warning('Message translation failed after delivery: ' . $translationErr->getMessage());
                }
            }

            if (
                str_starts_with((string) $message->file_type, 'audio/')
                && !$message->content_original
            ) {
                $transcript = app(\App\Services\GroqTranscriptionService::class)->transcribe(
                    $message->file_url,
                    $message->file_name,
                    $sourceLang,
                );

                if ($transcript) {
                    $message->update(['content_original' => $transcript]);

                    if ($sourceLang !== $targetLang && $user->canUseAiTranslation()) {
                        $translated = app(\App\Services\TranslationService::class)
                            ->translate($transcript, $targetLang, $sourceLang);
                        if ($translated) {
                            $message->update(['content_translated' => $translated['text']]);
                            $user->increment('ai_words_translated_count', str_word_count($transcript));
                        }
                    }

                    try {
                        broadcast(new MessageSent($message->fresh(), $conversation->id));
                    } catch (\Throwable $broadcastErr) {
                        \Illuminate\Support\Facades\Log::warning('Voice update broadcast failed: ' . $broadcastErr->getMessage());
                    }
                }
            }

            return response()->json([
                'message' => 'Message sent successfully',
                'data' => $message
            ], 201);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Message store failed', [
                'user_id' => $user->id,
                'conversation_id' => $request->input('conversation_id'),
                'exception' => $e,
            ]);
            return response()->json([
                'message' => 'Failed to send message'
            ], 500);
        }
    }

    /**
     * Get paginated messages in a conversation.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'conversation_id' => 'required|integer',
            'limit' => 'sometimes|integer|min:1|max:100',
            'offset' => 'sometimes|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $conversation = Conversation::find($request->conversation_id);
            if (!$conversation) {
                return response()->json([
                    'message' => 'Conversation not found'
                ], 404);
            }

            if (!$conversation->hasUser($user->id)) {
                return response()->json([
                    'message' => 'Access denied'
                ], 403);
            }

            $limit = $request->input('limit', 50);

            $messages = $conversation->messages()
                ->orderBy('created_at', 'asc')
                ->paginate($limit);

            return response()->json($messages);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch messages',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark a specific message as read by the authenticated user.
     */
    public function markAsRead(Request $request, $messageId)
    {
        $user = $request->user();

        try {
            $message = Message::find($messageId);

            if (!$message) {
                return response()->json([
                    'message' => 'Message not found'
                ], 404);
            }

            if ($message->sender_id == $user->id) {
                return response()->json([
                    'message' => 'Cannot mark own message as read'
                ], 400);
            }

            $conversation = Conversation::find($message->conversation_id);
            if (!$conversation || !$conversation->hasUser($user->id)) {
                return response()->json([
                    'message' => 'Access denied'
                ], 403);
            }

            $message->markAsRead();

            try {
                broadcast(new MessagesRead($conversation->id, $user->id));
            } catch (\Exception $broadcastErr) {
                \Illuminate\Support\Facades\Log::warning('Broadcast failed: ' . $broadcastErr->getMessage());
            }

            return response()->json([
                'message' => 'Message marked as read',
                'updated' => true
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to mark message as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Delete a message for everyone.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        try {
            $message = Message::findOrFail($id);

            if ($message->sender_id !== $user->id) {
                return response()->json(['message' => 'Access denied'], 403);
            }

            $message->update([
                'content_original' => 'Ce message a été supprimé',
                'content_translated' => 'This message was deleted',
                'is_deleted' => true
            ]);

            // Broadcast message update
            try {
                broadcast(new MessageSent($message, $message->conversation_id));
            } catch (\Exception $broadcastErr) {
                \Illuminate\Support\Facades\Log::warning('Broadcast failed: ' . $broadcastErr->getMessage());
            }

            return response()->json(['message' => 'Message deleted for everyone', 'data' => $message]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Archive a message.
     */
    public function archive(Request $request, $id)
    {
        $user = $request->user();
        try {
            $message = Message::findOrFail($id);

            if ($message->sender_id !== $user->id) {
                return response()->json(['message' => 'Access denied'], 403);
            }

            $message->update(['is_archived' => true]);

            return response()->json(['message' => 'Message archived', 'data' => $message]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to archive', 'error' => $e->getMessage()], 500);
        }
    }
}
