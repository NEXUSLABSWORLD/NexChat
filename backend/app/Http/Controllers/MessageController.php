<?php

namespace App\Http\Controllers;

use App\Services\SupabaseUserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MessageController extends Controller
{
    private SupabaseUserService $supabaseService;

    public function __construct(SupabaseUserService $supabaseService)
    {
        $this->supabaseService = $supabaseService;
    }

    /**
     * Send a message in a conversation.
     * Handles language detection and message metadata creation.
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     * 
     * @bodyParam conversation_id integer Required.
     * @bodyParam sender_id integer Required.
     * @bodyParam content string Required. Max: 2000 chars.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'conversation_id' => 'required|integer',
            'sender_id' => 'required|integer',
            'content' => 'required|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if conversation exists and user is participant
            $conversation = $this->supabaseService->getConversation($request->conversation_id);
            if (!$conversation) {
                return response()->json([
                    'message' => 'Conversation not found'
                ], 404);
            }

            if (!in_array($request->sender_id, [$conversation['user_one_id'], $conversation['user_two_id']])) {
                return response()->json([
                    'message' => 'Access denied'
                ], 403);
            }

            // Get recipient user for language detection
            $recipientId = $conversation['user_one_id'] == $request->sender_id 
                ? $conversation['user_two_id'] 
                : $conversation['user_one_id'];
            
            $recipient = $this->supabaseService->findUserById($recipientId);
            $sender = $this->supabaseService->findUserById($request->sender_id);

            // Create message (without translation for now - will be added in Phase 4)
            $message = $this->supabaseService->createMessage([
                'conversation_id' => $request->conversation_id,
                'sender_id' => $request->sender_id,
                'content_original' => $request->content,
                'content_translated' => null, // Will be added in Phase 4
                'source_lang' => $sender['primary_language_code'],
                'target_lang' => $recipient['primary_language_code'],
                'is_read' => false,
            ]);

            // Update conversation's last_message_at
            $this->supabaseService->updateConversationLastMessage($request->conversation_id);

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
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     * 
     * @queryParam conversation_id integer Required.
     * @queryParam user_id integer Required.
     * @queryParam limit integer Optional. Max: 100.
     * @queryParam offset integer Optional.
     */
    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'conversation_id' => 'required|integer',
            'user_id' => 'required|integer',
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
            // Check if conversation exists and user is participant
            $conversation = $this->supabaseService->getConversation($request->conversation_id);
            if (!$conversation) {
                return response()->json([
                    'message' => 'Conversation not found'
                ], 404);
            }

            if (!in_array($request->user_id, [$conversation['user_one_id'], $conversation['user_two_id']])) {
                return response()->json([
                    'message' => 'Access denied'
                ], 403);
            }

            $limit = $request->input('limit', 50);
            $offset = $request->input('offset', 0);

            $messages = $this->supabaseService->getConversationMessages(
                $request->conversation_id,
                $limit,
                $offset
            );

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
     * Mark a specific message as read by the recipient.
     * 
     * @param  \Illuminate\Http\Request  $request
     * @param  string  $messageId
     * @return \Illuminate\Http\JsonResponse
     * 
     * @queryParam user_id integer Required.
     */
    public function markAsRead(Request $request, $messageId)
    {
        $userId = $request->input('user_id');
        
        if (!$userId) {
            return response()->json([
                'message' => 'User ID required'
            ], 400);
        }

        try {
            $message = $this->supabaseService->getMessage($messageId);
            
            if (!$message) {
                return response()->json([
                    'message' => 'Message not found'
                ], 404);
            }

            // Check if user is recipient (not sender)
            if ($message['sender_id'] == $userId) {
                return response()->json([
                    'message' => 'Cannot mark own message as read'
                ], 400);
            }

            // Check if user is part of the conversation
            $conversation = $this->supabaseService->getConversation($message['conversation_id']);
            if (!in_array($userId, [$conversation['user_one_id'], $conversation['user_two_id']])) {
                return response()->json([
                    'message' => 'Access denied'
                ], 403);
            }

            $updated = $this->supabaseService->markMessageAsRead($messageId);

            return response()->json([
                'message' => 'Message marked as read',
                'updated' => $updated
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to mark message as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
