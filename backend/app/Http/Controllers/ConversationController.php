<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ConversationController extends Controller
{
    /**
     * Get all conversations for the authenticated user.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        try {
            $conversations = Conversation::where('user_one_id', $user->id)
                ->orWhere('user_two_id', $user->id)
                ->orderBy('last_message_at', 'desc')
                ->get();

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
     * Create a new conversation or retrieve an existing one between the authenticated user and another.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'other_user_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if ($request->other_user_id == $user->id) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => ['other_user_id' => ['Cannot create conversation with yourself']]
            ], 422);
        }

        try {
            $otherUser = User::find($request->other_user_id);
            if (!$otherUser) {
                return response()->json([
                    'message' => 'Other user not found'
                ], 404);
            }

            $conversation = Conversation::where(function ($query) use ($user, $request) {
                    $query->where('user_one_id', $user->id)
                          ->where('user_two_id', $request->other_user_id);
                })
                ->orWhere(function ($query) use ($user, $request) {
                    $query->where('user_one_id', $request->other_user_id)
                          ->where('user_two_id', $user->id);
                })
                ->first();

            if (!$conversation) {
                $conversation = Conversation::create([
                    'user_one_id' => $user->id,
                    'user_two_id' => $request->other_user_id,
                ]);
            }

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
     */
    public function show(Request $request, $conversationId)
    {
        $user = $request->user();

        try {
            $conversation = Conversation::find($conversationId);

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

            $messages = $conversation->messages()->orderBy('created_at', 'asc')->get();

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
     * Mark all messages as read in a specific conversation for the authenticated user.
     */
    public function markAsRead(Request $request, $conversationId)
    {
        $user = $request->user();

        try {
            $conversation = Conversation::find($conversationId);

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

            $markedCount = $conversation->markAsRead($user->id);

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
