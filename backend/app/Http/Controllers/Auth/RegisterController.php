<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\SupabaseUserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RegisterController extends Controller
{
    private SupabaseUserService $supabaseService;

    public function __construct(SupabaseUserService $supabaseService)
    {
        $this->supabaseService = $supabaseService;
    }

    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'password' => 'required|string|min:8|confirmed',
            'primary_language_code' => 'required|string|size:2', // ex: 'fr', 'en', 'es'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = $this->supabaseService->createUser([
                'username' => $request->username,
                'email' => $request->email,
                'password' => $request->password,
                'primary_language_code' => $request->primary_language_code,
            ]);

            return response()->json([
                'message' => 'User registered successfully',
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'primary_language_code' => $user['primary_language_code'],
                    'is_online' => $user['is_online'],
                    'created_at' => $user['created_at'],
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
