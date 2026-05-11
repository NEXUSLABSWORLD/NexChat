<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\SupabaseUserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class LoginController extends Controller
{
    private SupabaseUserService $supabaseService;

    public function __construct(SupabaseUserService $supabaseService)
    {
        $this->supabaseService = $supabaseService;
    }

    /**
     * Login user and return token
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $this->supabaseService->findUserByEmail($request->email);

        if (!$user || !Hash::check($request->password, $user['password_hash'])) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        // Update user status to online
        $this->supabaseService->updateUserStatus($user['id'], true);

        // Generate simple token (in production, use Laravel Sanctum)
        $token = Str::random(60);

        return response()->json([
            'message' => 'Login successful',
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'primary_language_code' => $user['primary_language_code'],
                'is_online' => $user['is_online'],
                'last_seen_at' => $user['last_seen_at'],
            ],
            'token' => $token
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        // In a real app, you would invalidate the token here
        // For now, we'll just update the user status
        
        // This would normally come from the authenticated user
        $userId = $request->input('user_id');
        
        if ($userId) {
            $this->supabaseService->updateUserStatus($userId, false);
        }

        return response()->json([
            'message' => 'Logout successful'
        ]);
    }
}
