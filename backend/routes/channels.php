<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Canal privé par conversation : seuls les deux participants peuvent s'abonner.
|
*/

Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    $conversation = \App\Models\Conversation::find($conversationId);

    if (!$conversation) {
        return false;
    }

    return $conversation->hasUser($user->id);
});

Broadcast::channel('group.{groupId}', function ($user, $groupId) {
    return \App\Models\GroupMember::where('group_id', $groupId)
        ->where('user_id', $user->id)
        ->exists();
});
