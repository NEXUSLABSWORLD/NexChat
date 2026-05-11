<?php

namespace App\Http\Controllers;

use App\Services\SupabaseUserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    private SupabaseUserService $supabaseService;

    public function __construct(SupabaseUserService $supabaseService)
    {
        $this->supabaseService = $supabaseService;
    }

    /**
     * Get user profile
     */
    public function show(Request $request)
    {
        // In a real app, get user ID from authenticated token
        $userId = $request->input('user_id');
        
        if (!$userId) {
            return response()->json([
                'message' => 'User ID required'
            ], 400);
        }

        $user = $this->supabaseService->findUserById($userId);
        
        if (!$user) {
            return response()->json([
                'message' => 'User not found'
            ], 404);
        }

        return response()->json([
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'primary_language_code' => $user['primary_language_code'],
                'is_online' => $user['is_online'],
                'last_seen_at' => $user['last_seen_at'],
                'created_at' => $user['created_at'],
            ]
        ]);
    }

    /**
     * Update user profile
     */
    public function update(Request $request)
    {
        $userId = $request->input('user_id');
        
        if (!$userId) {
            return response()->json([
                'message' => 'User ID required'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'username' => 'sometimes|string|max:255',
            'primary_language_code' => 'sometimes|string|size:2', // ex: 'fr', 'en', 'es'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $updateData = [];
            
            if ($request->has('username')) {
                $updateData['username'] = $request->username;
            }
            
            if ($request->has('primary_language_code')) {
                $updateData['primary_language_code'] = strtolower($request->primary_language_code);
            }

            $user = $this->supabaseService->updateUser($userId, $updateData);
            
            return response()->json([
                'message' => 'Profile updated successfully',
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'primary_language_code' => $user['primary_language_code'],
                    'is_online' => $user['is_online'],
                    'updated_at' => $user['updated_at'],
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Update failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search users by username
     */
    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|min:2|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $users = $this->supabaseService->searchUsers($request->query('query'));
            
            return response()->json([
                'users' => collect($users)->map(function ($user) {
                    return [
                        'id' => $user['id'],
                        'username' => $user['username'],
                        'primary_language_code' => $user['primary_language_code'],
                        'is_online' => $user['is_online'],
                    ];
                })
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Search failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
