<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes (no authentication required)
Route::prefix('auth')->group(function () {
    Route::post('/register', [RegisterController::class, 'register']);
    Route::post('/login', [LoginController::class, 'login']);
});

// Protected routes (Sanctum authentication required)
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [LoginController::class, 'logout']);

    // Profile
    Route::prefix('profile')->group(function () {
        Route::get('/show', [ProfileController::class, 'show']);
        Route::put('/update', [ProfileController::class, 'update']);
        Route::get('/search', [ProfileController::class, 'search']);
    });

    // Conversations
    Route::prefix('conversations')->group(function () {
        Route::get('/', [ConversationController::class, 'index']);
        Route::post('/', [ConversationController::class, 'store']);
        Route::get('/{id}', [ConversationController::class, 'show']);
        Route::patch('/{id}/read', [ConversationController::class, 'markAsRead']);
    });

    // Messages
    Route::prefix('messages')->group(function () {
        Route::get('/', [MessageController::class, 'index']);
        Route::post('/', [MessageController::class, 'store']);
        Route::patch('/{id}/read', [MessageController::class, 'markAsRead']);
    });

    // Authenticated user info
    Route::get('/user', function (\Illuminate\Http\Request $request) {
        return $request->user();
    });
});
