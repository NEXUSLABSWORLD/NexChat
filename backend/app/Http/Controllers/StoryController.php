<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StoryController extends Controller
{
    // Retrieve active stories grouped by user
    public function index(Request $request)
    {
        $now = Carbon::now();

        $stories = DB::table('stories')
            ->join('users', 'stories.user_id', '=', 'users.id')
            ->select(
                'stories.*',
                'users.username as user_name',
                'users.avatar_url as user_avatar'
            )
            ->where('stories.expires_at', '>', $now)
            ->orderBy('stories.created_at', 'asc')
            ->get();

        // Group stories by user
        $grouped = [];
        foreach ($stories as $story) {
            if (!isset($grouped[$story->user_id])) {
                $grouped[$story->user_id] = [
                    'user_id' => $story->user_id,
                    'user_name' => $story->user_name,
                    'user_avatar' => $story->user_avatar,
                    'stories' => []
                ];
            }
            $grouped[$story->user_id]['stories'][] = [
                'id' => $story->id,
                'media_url' => $story->media_url,
                'text_content' => $story->text_content,
                'created_at' => $story->created_at,
                'expires_at' => $story->expires_at,
            ];
        }

        return response()->json(array_values($grouped));
    }

    public function store(Request $request)
    {
        $request->validate([
            'media_url' => 'nullable|string',
            'text_content' => 'nullable|string'
        ]);

        if (empty($request->media_url) && empty($request->text_content)) {
            return response()->json(['message' => 'Cannot create empty story'], 422);
        }

        $now = Carbon::now();
        $expires = $now->copy()->addHours(24);

        $storyId = DB::table('stories')->insertGetId([
            'user_id' => $request->user()->id,
            'media_url' => $request->media_url,
            'text_content' => $request->text_content,
            'created_at' => $now,
            'expires_at' => $expires
        ]);

        $story = DB::table('stories')->where('id', $storyId)->first();

        return response()->json($story, 201);
    }
}
