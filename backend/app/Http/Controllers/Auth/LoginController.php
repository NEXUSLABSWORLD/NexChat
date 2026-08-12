<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Mail\LoginVerificationMail;

class LoginController extends Controller
{
    /**
     * Login user and return Sanctum token
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

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password_hash)) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        // Check if email is verified
        if (is_null($user->email_verified_at)) {
            $tokenStr = Str::random(32);
            
            $user->update([
                'login_token' => hash('sha256', $tokenStr),
                'login_token_expires_at' => now()->addMinutes(15),
            ]);

            Mail::to($user->email)->send(new LoginVerificationMail($user, $tokenStr));

            return response()->json([
                'message' => 'verification_required',
                'email' => $user->email,
            ]);
        }

        // If already verified, log them in normally
        $user->update([
            'is_online' => true,
            'last_seen_at' => now(),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'primary_language_code' => $user->primary_language_code,
                'is_online' => true,
                'last_seen_at' => $user->last_seen_at,
            ],
            'token' => $token
        ]);
    }

    /**
     * Verify login token and return Sanctum token
     */
    public function verifyLogin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !$user->login_token || hash('sha256', $request->token) !== $user->login_token) {
            return response()->json([
                'message' => 'Invalid or expired token'
            ], 401);
        }

        if (now()->greaterThan($user->login_token_expires_at)) {
            return response()->json([
                'message' => 'Token expired'
            ], 401);
        }

        $user->update([
            'login_token' => null,
            'login_token_expires_at' => null,
            'email_verified_at' => now(),
            'is_online' => true,
            'last_seen_at' => now(),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'primary_language_code' => $user->primary_language_code,
                'is_online' => true,
                'last_seen_at' => $user->last_seen_at,
            ],
            'token' => $token
        ]);
    }

    /**
     * Logout user and revoke token
     */
    public function logout(Request $request)
    {
        $user = $request->user();

        if ($user) {
            $user->update([
                'is_online' => false,
                'last_seen_at' => now(),
            ]);

            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'message' => 'Logout successful'
        ]);
    }
}
