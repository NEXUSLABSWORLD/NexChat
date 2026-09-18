<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PostController extends Controller
{
    public function index(Request $request)
    {
        $posts = DB::table('posts')
            ->join('users', 'posts.user_id', '=', 'users.id')
            ->select(
                'posts.*',
                'users.username as user_name',
                'users.avatar_url as user_avatar'
            )
            ->orderBy('posts.created_at', 'desc')
            ->get();

        // Attach boolean 'is_liked' for current user
        $userId = $request->user()->id;
        $likedPosts = DB::table('post_likes')
            ->where('user_id', $userId)
            ->pluck('post_id')
            ->toArray();

        $posts = $posts->map(function($post) use ($likedPosts) {
            $post->is_liked = in_array($post->id, $likedPosts);
            return $post;
        });

        return response()->json($posts);
    }

    public function store(Request $request)
    {
        $request->validate([
            'content' => 'required|string',
            'media_url' => 'nullable|string'
        ]);

        $postId = DB::table('posts')->insertGetId([
            'user_id' => $request->user()->id,
            'content' => $request->content,
            'media_url' => $request->media_url,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $post = DB::table('posts')
            ->join('users', 'posts.user_id', '=', 'users.id')
            ->select('posts.*', 'users.username as user_name', 'users.avatar_url as user_avatar')
            ->where('posts.id', $postId)
            ->first();
        
        $post->is_liked = false;

        return response()->json($post, 201);
    }

    public function toggleLike(Request $request, $id)
    {
        $userId = $request->user()->id;
        
        $exists = DB::table('post_likes')
            ->where('post_id', $id)
            ->where('user_id', $userId)
            ->first();

        if ($exists) {
            DB::table('post_likes')->where('id', $exists->id)->delete();
            DB::table('posts')->where('id', $id)->decrement('likes_count');
            return response()->json(['status' => 'unliked']);
        } else {
            DB::table('post_likes')->insert([
                'post_id' => $id,
                'user_id' => $userId,
                'created_at' => now()
            ]);
            DB::table('posts')->where('id', $id)->increment('likes_count');
            return response()->json(['status' => 'liked']);
        }
    }
}
