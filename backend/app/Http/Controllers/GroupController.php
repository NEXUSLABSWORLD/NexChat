<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\GroupMember;
use App\Models\GroupMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class GroupController extends Controller
{
    /**
     * Get all groups for the authenticated user.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        try {
            $groups = Group::whereHas('members', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->with(['members.user'])
            ->get()
            ->map(function ($group) {
                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'description' => $group->description,
                    'avatar_url' => $group->avatar_url,
                    'created_by' => $group->created_by,
                    'members_count' => $group->members->count(),
                    'created_at' => $group->created_at,
                ];
            });

            return response()->json([
                'groups' => $groups
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch groups',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new group.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'member_ids' => 'nullable|array',
            'member_ids.*' => 'integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $group = Group::create([
                'name' => $request->name,
                'description' => $request->description,
                'created_by' => $user->id,
            ]);

            // Add creator as admin
            GroupMember::create([
                'group_id' => $group->id,
                'user_id' => $user->id,
                'role' => 'admin',
            ]);

            // Add other members
            if ($request->has('member_ids')) {
                foreach ($request->member_ids as $memberId) {
                    if ($memberId != $user->id) {
                        GroupMember::create([
                            'group_id' => $group->id,
                            'user_id' => $memberId,
                            'role' => 'member',
                        ]);
                    }
                }
            }

            return response()->json([
                'message' => 'Group created successfully',
                'group' => $group->load('members.user')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create group',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific group details including messages.
     */
    public function show(Request $request, $groupId)
    {
        $user = $request->user();

        try {
            $group = Group::find($groupId);

            if (!$group) {
                return response()->json([
                    'message' => 'Group not found'
                ], 404);
            }

            // Check if user is member
            $isMember = GroupMember::where('group_id', $groupId)
                ->where('user_id', $user->id)
                ->exists();

            if (!$isMember) {
                return response()->json([
                    'message' => 'Access denied'
                ], 403);
            }

            $userLang = $user->primary_language_code ?? 'fr';

            $messages = GroupMessage::where('group_id', $groupId)
                ->with('sender')
                ->orderBy('created_at', 'asc')
                ->get()
                ->map(function ($msg) use ($userLang) {
                    if ($msg->source_lang === $userLang) {
                        // No translation needed if user speaks the original language
                        $msg->content_translated = null;
                    } elseif ($msg->target_lang !== $userLang) {
                        // Translate on-the-fly if the stored target language doesn't match the current user
                        $translationService = app(\App\Services\TranslationService::class);
                        $translated = $translationService->translate($msg->content_original, $userLang, $msg->source_lang);
                        if ($translated) {
                            $msg->content_translated = $translated['text'];
                            $msg->target_lang = $userLang;
                        }
                    }
                    return $msg;
                });

            return response()->json([
                'group' => $group->load('members.user'),
                'messages' => $messages
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch group',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add a member to the group.
     */
    public function addMember(Request $request, $groupId)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if requester is admin
            $isAdmin = GroupMember::where('group_id', $groupId)
                ->where('user_id', $user->id)
                ->where('role', 'admin')
                ->exists();

            if (!$isAdmin) {
                return response()->json([
                    'message' => 'Only admins can add members'
                ], 403);
            }

            // Check if already member
            $exists = GroupMember::where('group_id', $groupId)
                ->where('user_id', $request->user_id)
                ->exists();

            if ($exists) {
                return response()->json([
                    'message' => 'User is already a member'
                ], 422);
            }

            GroupMember::create([
                'group_id' => $groupId,
                'user_id' => $request->user_id,
                'role' => 'member',
            ]);

            return response()->json([
                'message' => 'Member added successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to add member',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove a member from the group.
     */
    public function removeMember(Request $request, $groupId, $userId)
    {
        $user = $request->user();

        try {
            // Check if requester is admin or the user themselves leaving
            $isAdmin = GroupMember::where('group_id', $groupId)
                ->where('user_id', $user->id)
                ->where('role', 'admin')
                ->exists();

            if (!$isAdmin && $user->id != $userId) {
                return response()->json([
                    'message' => 'Only admins can remove members'
                ], 403);
            }

            GroupMember::where('group_id', $groupId)
                ->where('user_id', $userId)
                ->delete();

            return response()->json([
                'message' => 'Member removed successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to remove member',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Set role for a member.
     */
    public function setRole(Request $request, $groupId, $userId)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'role' => 'required|string|in:admin,member',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if requester is admin
            $isAdmin = GroupMember::where('group_id', $groupId)
                ->where('user_id', $user->id)
                ->where('role', 'admin')
                ->exists();

            if (!$isAdmin) {
                return response()->json([
                    'message' => 'Only admins can change roles'
                ], 403);
            }

            GroupMember::where('group_id', $groupId)
                ->where('user_id', $userId)
                ->update(['role' => $request->role]);

            return response()->json([
                'message' => 'Role updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update role',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Send a message to the group.
     */
    public function sendMessage(Request $request, $groupId)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'content_original' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if user is member
            $isMember = GroupMember::where('group_id', $groupId)
                ->where('user_id', $user->id)
                ->exists();

            if (!$isMember) {
                return response()->json([
                    'message' => 'Access denied'
                ], 403);
            }

            $sourceLang = $user->primary_language_code ?? 'fr';
            
            // Find other languages in the group
            $otherLanguages = GroupMember::where('group_id', $groupId)
                ->join('users', 'group_members.user_id', '=', 'users.id')
                ->where('users.id', '!=', $user->id)
                ->pluck('users.primary_language_code')
                ->unique()
                ->filter()
                ->toArray();

            $targetLang = $sourceLang;
            $contentTranslated = null;

            if (!empty($otherLanguages)) {
                $targetLang = $otherLanguages[0];
                $translationService = app(\App\Services\TranslationService::class);
                $translated = $translationService->translate($request->content_original, $targetLang, $sourceLang);
                if ($translated) {
                    $contentTranslated = $translated['text'];
                }
            }

            $message = GroupMessage::create([
                'group_id' => $groupId,
                'sender_id' => $user->id,
                'content_original' => $request->content_original,
                'content_translated' => $contentTranslated,
                'source_lang' => $sourceLang,
                'target_lang' => $targetLang,
            ]);

            try {
                broadcast(new \App\Events\GroupMessageSent($message->load('sender')))->toOthers();
            } catch (\Exception $broadcastErr) {
                \Illuminate\Support\Facades\Log::warning('Broadcast failed: ' . $broadcastErr->getMessage());
            }

            return response()->json([
                'message' => 'Message sent successfully',
                'group_message' => $message->load('sender')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send message',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Summarize group messages.
     */
    public function summarize(Request $request, $groupId)
    {
        $user = $request->user();

        try {
            $group = Group::find($groupId);

            if (!$group) {
                return response()->json(['message' => 'Group not found'], 404);
            }

            // Check if user is member
            $isMember = GroupMember::where('group_id', $groupId)
                ->where('user_id', $user->id)
                ->exists();

            if (!$isMember) {
                return response()->json(['message' => 'Access denied'], 403);
            }

            $aiService = app(\App\Services\GenerativeAiService::class);
            $targetLang = $user->primary_language_code ?? 'fr';

            // Pass the group (Conversation model?? Wait, Group model vs Conversation model)
            // Ah! The GenerativeAiService summarizeGroup function takes a Conversation!
            // I should modify GenerativeAiService to take Group instead, or handle it here.
            
            // Let's get the messages here directly instead of relying on the GenerativeAiService method that takes Conversation.
            // Actually, I can just modify the method to accept either or just fetch messages here and pass text to aiService.
            // But since I've already defined summarizeGroup in GenerativeAiService to accept Conversation, I will refactor it to accept an array of messages or a Group instance.
            // Let's change GenerativeAiService's summarizeGroup to accept a string of transcript instead.
            // Oh wait, GenerativeAiService hasn't been modified yet in this chunk.
            
            // Let's construct the transcript here to be safe and avoid touching GenerativeAiService.
            $messages = GroupMessage::where('group_id', $groupId)
                ->with('sender:id,username')
                ->orderBy('created_at', 'desc')
                ->take(50)
                ->get()
                ->reverse();

            if ($messages->isEmpty()) {
                return response()->json(['data' => "Il n'y a pas assez de messages pour générer un résumé."]);
            }

            $transcript = "";
            foreach ($messages as $msg) {
                $senderName = $msg->sender ? $msg->sender->username : "Utilisateur inconnu";
                $content = $msg->content_original ?: "[Fichier partagé]";
                $transcript .= "{$senderName}: {$content}\n";
            }

            // Just use a new generic summarize method or we can call Gemini directly... 
            // Wait, I can't call summarizeGroup with a Group because the signature is (Conversation $group).
            // Let's call a method `summarizeTranscript` that I will add to GenerativeAiService.
            $summary = $aiService->summarizeTranscript($transcript, $targetLang);

            return response()->json(['data' => $summary]);
            
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to summarize group', 'error' => $e->getMessage()], 500);
        }
    }
}
