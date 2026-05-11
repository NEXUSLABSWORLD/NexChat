<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Services\SupabaseUserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ConversationController extends Controller
{
    private SupabaseUserService $supabaseService;

    public function __construct(SupabaseUserService $supabaseService)
    {
        $this->supabaseService = $supabaseService;
    }

    /**
     * Get all conversations for a specific user.
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     * 
     * @queryParam user_id integer Required. The ID of the authenticated user.
     */
    public function index(Request $request)
    {
        $userId = $request->input('user_id');
        
        if (!$userId) {
            return response()->json([
                'message' => 'User ID required'
            ], 400);
        }

        try {
            $conversations = $this->supabaseService->getUserConversations($userId);
            
            return response()->json([
                'conversations' => $conversations
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch conversations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new conversation or retrieve an existing one between two users.
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     * 
     * @bodyParam user_id integer Required. The ID of the initiator.
     * @bodyParam other_user_id integer Required. The ID of the participant.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer',
            'other_user_id' => 'required|integer|different:user_id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if other user exists
            $otherUser = $this->supabaseService->findUserById($request->other_user_id);
            if (!$otherUser) {
                return response()->json([
                    'message' => 'Other user not found'
                ], 404);
            }

            $conversation = $this->supabaseService->getOrCreateConversation(
                $request->user_id,
                $request->other_user_id
            );

            return response()->json([
                'message' => 'Conversation ready',
                'conversation' => $conversation
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create conversation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific conversation details including messages history.
     * 
     * @param  \Illuminate\Http\Request  $request
     * @param  string  $conversationId
     * @return \Illuminate\Http\JsonResponse
     * 
     * @queryParam user_id integer Required. The ID of the user requesting the view.
     */
    public function show(Request $request, $conversationId)
    {
        $userId = $request->input('user_id');
        
        if (!$userId) {
            return response()->json([
                'message' => 'User ID required'
            ], 400);
        }

        try {
            $conversation = $this->supabaseService->getConversation($conversationId);
            
            if (!$conversation) {
                return response()->json([
                    'message' => 'Conversation not found'
                ], 404);
            }

            // Check if user is part of this conversation
            if (!in_array($userId, [$conversation['user_one_id'], $conversation['user_two_id']])) {
                return response()->json([
                    'message' => 'Access denied'
                ], 403);
            }

            $messages = $this->supabaseService->getConversationMessages($conversationId);

            return response()->json([
                'conversation' => $conversation,
                'messages' => $messages
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch conversation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark all messages as read in a specific conversation for the given user.
     * 
     * @param  \Illuminate\Http\Request  $request
     * @param  string  $conversationId
     * @return \Illuminate\Http\JsonResponse
     * 
     * @queryParam user_id integer Required.
     */
    public function markAsRead(Request $request, $conversationId)
    {
        $userId = $request->input('user_id');
        
        if (!$userId) {
            return response()->json([
                'message' => 'User ID required'
            ], 400);
        }

        try {
            $conversation = $this->supabaseService->getConversation($conversationId);
            
            if (!$conversation) {
                return response()->json([
                    'message' => 'Conversation not found'
                ], 404);
            }

            // Check if user is part of this conversation
            if (!in_array($userId, [$conversation['user_one_id'], $conversation['user_two_id']])) {
                return response()->json([
                    'message' => 'Access denied'
                ], 403);
            }

            $markedCount = $this->supabaseService->markConversationAsRead($conversationId, $userId);

            return response()->json([
                'message' => 'Messages marked as read',
                'marked_count' => $markedCount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to mark messages as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
