<?php

namespace App\Http\Controllers;

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
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'conversation_id' => 'required|integer',
            'content' => 'required|string|max:2000',
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

            $recipientId = $conversation->user_one_id == $user->id
                ? $conversation->user_two_id
                : $conversation->user_one_id;

            $recipient = User::find($recipientId);

            $message = Message::create([
                'conversation_id' => $request->conversation_id,
                'sender_id' => $user->id,
                'content_original' => $request->content,
                'content_translated' => null,
                'source_lang' => $user->primary_language_code,
                'target_lang' => $recipient->primary_language_code,
                'is_read' => false,
            ]);

            $conversation->update(['last_message_at' => now()]);

            return response()->json([
                'message' => 'Message sent successfully',
                'data' => $message
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send message',
                'error' => $e->getMessage()
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
            $offset = $request->input('offset', 0);

            $messages = $conversation->messages()
                ->orderBy('created_at', 'asc')
                ->skip($offset)
                ->take($limit)
                ->get();

            return response()->json([
                'messages' => $messages,
                'total' => count($messages)
            ]);

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
}
