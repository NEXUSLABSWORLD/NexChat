<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\LoginVerificationMail;

class RegisterController extends Controller
{
    /**
     * Register a new user and send verification email
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string|max:255|unique:users,username',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'primary_language_code' => 'required|string|size:2',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $tokenStr = Str::random(32);

            $user = User::create([
                'username' => $request->username,
                'email' => $request->email,
                'password_hash' => Hash::make($request->password),
                'primary_language_code' => strtolower($request->primary_language_code),
                'is_online' => false,
                'login_token' => hash('sha256', $tokenStr),
                'login_token_expires_at' => now()->addMinutes(15),
            ]);

            try {
                Mail::to($user->email)->send(new LoginVerificationMail($user, $tokenStr));
            } catch (\Exception $mailEx) {
                Log::error("Failed to send validation email during registration: " . $mailEx->getMessage());
            }

            return response()->json([
                'message' => 'verification_required',
                'email' => $user->email,
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'primary_language_code' => $user->primary_language_code,
                    'is_online' => $user->is_online,
                    'created_at' => $user->created_at,
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
