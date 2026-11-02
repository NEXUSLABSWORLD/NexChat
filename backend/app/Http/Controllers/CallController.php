<?php

namespace App\Http\Controllers;

use App\Events\CallSignal;
use App\Models\Conversation;
use App\Models\Group;
use App\Models\GroupMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CallController extends Controller
{
    public function signal(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'conversation_id' => 'nullable|integer',
            'group_id' => 'nullable|integer',
            'call_id' => 'required|string|max:100',
            'call_type' => 'required|in:audio,video',
            'action' => 'required|in:offer,answer,ice-candidate,join,reject,hangup',
            'target_user_id' => 'nullable|integer',
            'payload' => 'nullable|array',
        ]);

        $validator->after(function ($validator) use ($request) {
            if (!$request->filled('conversation_id') && !$request->filled('group_id')) {
                $validator->errors()->add('scope', 'conversation_id ou group_id est requis.');
            }
            if ($request->filled('conversation_id') && $request->filled('group_id')) {
                $validator->errors()->add('scope', 'Un seul contexte d’appel est autorisé.');
            }
        });

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        $channelName = null;
        $memberIds = [];

        if ($request->filled('conversation_id')) {
            $conversation = Conversation::find($request->integer('conversation_id'));
            if (!$conversation || !$conversation->hasUser($user->id)) {
                return response()->json(['message' => 'Access denied'], 403);
            }
            $channelName = 'conversation.' . $conversation->id;
            $memberIds = [$conversation->user_one_id, $conversation->user_two_id];
        } else {
            $group = Group::find($request->integer('group_id'));
            if (!$group || !GroupMember::where('group_id', $group->id)->where('user_id', $user->id)->exists()) {
                return response()->json(['message' => 'Access denied'], 403);
            }
            $channelName = 'group.' . $group->id;
            $memberIds = GroupMember::where('group_id', $group->id)->pluck('user_id')->all();
        }

        $targetUserId = $request->input('target_user_id');
        if ($targetUserId !== null && !in_array((int) $targetUserId, $memberIds, true)) {
            return response()->json(['message' => 'Invalid call target'], 422);
        }

        broadcast(new CallSignal(
            $channelName,
            $user->id,
            $request->string('call_id')->toString(),
            $request->string('call_type')->toString(),
            $request->string('action')->toString(),
            $targetUserId !== null ? (int) $targetUserId : null,
            $request->input('payload', []),
        ))->toOthers();

        return response()->json(['message' => 'Call signal sent']);
    }
}
