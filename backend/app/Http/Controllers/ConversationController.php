<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\User;
use App\Events\MessagesRead;
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
            $conversations = Conversation::with(['userOne', 'userTwo', 'latestMessageRel'])
                ->withCount(['messages as unread_count' => function ($query) use ($user) {
                    $query->where('sender_id', '!=', $user->id)
                          ->where('is_read', false);
                }])
                ->where('user_one_id', $user->id)
                ->orWhere('user_two_id', $user->id)
                ->orderBy('last_message_at', 'desc')
                ->get()
                ->map(function ($conversation) use ($user) {
                    $otherUser = $conversation->getOtherUser($user->id);
                    return [
                        'id' => $conversation->id,
                        'other_user' => [
                            'id' => $otherUser->id,
                            'username' => $otherUser->username,
                            'primary_language_code' => $otherUser->primary_language_code,
                            'avatar_url' => $otherUser->avatar_url,
                            'is_online' => $otherUser->is_online,
                            'last_seen_at' => $otherUser->last_seen_at,
                        ],
                        'latest_message' => $conversation->latestMessageRel,
                        'unread_count' => $conversation->unread_count,
                        'last_message_at' => $conversation->last_message_at,
                        'created_at' => $conversation->created_at,
                    ];
                });

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

            // Load relations for the response
            $conversation->load(['userOne', 'userTwo', 'latestMessageRel']);
            $conversation->loadCount(['messages as unread_count' => function ($query) use ($user) {
                $query->where('sender_id', '!=', $user->id)->where('is_read', false);
            }]);
            $otherUser = $conversation->getOtherUser($user->id);

            return response()->json([
                'message' => 'Conversation ready',
                'conversation' => [
                    'id' => $conversation->id,
                    'other_user' => [
                        'id' => $otherUser->id,
                        'username' => $otherUser->username,
                        'primary_language_code' => $otherUser->primary_language_code,
                        'avatar_url' => $otherUser->avatar_url,
                        'is_online' => $otherUser->is_online,
                        'last_seen_at' => $otherUser->last_seen_at,
                    ],
                    'latest_message' => $conversation->latestMessageRel,
                    'unread_count' => $conversation->unread_count,
                    'last_message_at' => $conversation->last_message_at,
                    'created_at' => $conversation->created_at,
                ]
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

            if ($markedCount > 0) {
                try {
                    broadcast(new MessagesRead($conversation->id, $user->id));
                } catch (\Exception $broadcastErr) {
                    \Illuminate\Support\Facades\Log::warning('Broadcast failed: ' . $broadcastErr->getMessage());
                }
            }

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
