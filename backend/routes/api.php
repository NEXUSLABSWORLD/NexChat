<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\AiFeatureController;
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
    Route::post('/login/verify', [LoginController::class, 'verifyLogin']);
});

// Protected routes (Sanctum authentication required)
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [LoginController::class, 'logout']);

    // Profile
    Route::prefix('profile')->group(function () {
        Route::get('/show', [ProfileController::class, 'show']);
        Route::put('/update', [ProfileController::class, 'update']);
        Route::put('/update-password', [ProfileController::class, 'updatePassword']);
        Route::get('/search', [ProfileController::class, 'search']);
    });

    // Conversations
    Route::prefix('conversations')->group(function () {
        Route::get('/', [ConversationController::class, 'index']);
        Route::post('/', [ConversationController::class, 'store']);
        Route::get('/{id}', [ConversationController::class, 'show']);
        Route::patch('/{id}/read', [ConversationController::class, 'markAsRead']);
    });

    // Groups
    Route::prefix('groups')->group(function () {
        Route::get('/', [GroupController::class, 'index']);
        Route::post('/', [GroupController::class, 'store']);
        Route::get('/{id}', [GroupController::class, 'show']);
        Route::post('/{id}/members', [GroupController::class, 'addMember']);
        Route::delete('/{id}/members/{userId}', [GroupController::class, 'removeMember']);
        Route::patch('/{id}/members/{userId}/role', [GroupController::class, 'setRole']);
        Route::post('/{id}/messages', [GroupController::class, 'sendMessage']);
        Route::post('/{id}/summarize', [GroupController::class, 'summarize']);
    });

    // Messages
    Route::prefix('messages')->group(function () {
        Route::get('/', [MessageController::class, 'index']);
        Route::post('/', [MessageController::class, 'store']);
        Route::patch('/{id}/read', [MessageController::class, 'markAsRead']);
        Route::delete('/{id}', [MessageController::class, 'destroy']);
        Route::post('/{id}/archive', [MessageController::class, 'archive']);
    });

    // Authenticated user info
    Route::get('/user', function (\Illuminate\Http\Request $request) {
        return $request->user();
    });

    // Broadcast channel authentication (Reverb)
    Route::post('/broadcasting/auth', function (\Illuminate\Http\Request $request) {
        return \Illuminate\Support\Facades\Broadcast::auth($request);
    });

    // Moderation & Contacts
    Route::prefix('moderation')->group(function () {
        Route::get('/contacts', [\App\Http\Controllers\ModerationController::class, 'getContacts']);
        Route::post('/contacts/toggle', [\App\Http\Controllers\ModerationController::class, 'toggleContact']);
        Route::get('/blocks', [\App\Http\Controllers\ModerationController::class, 'getBlockedUsers']);
        Route::post('/blocks/toggle', [\App\Http\Controllers\ModerationController::class, 'toggleBlock']);
        Route::post('/report', [\App\Http\Controllers\ModerationController::class, 'reportUser']);
    });

    // Posts / Publications
    Route::prefix('posts')->group(function () {
        Route::get('/', [\App\Http\Controllers\PostController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\PostController::class, 'store']);
        Route::post('/{id}/like', [\App\Http\Controllers\PostController::class, 'toggleLike']);
    });

    // Stories / Statuts
    Route::prefix('stories')->group(function () {
        Route::get('/', [\App\Http\Controllers\StoryController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\StoryController::class, 'store']);
    });

    // AI Features
    Route::prefix('ai')->group(function () {
        Route::post('/chat', [AiFeatureController::class, 'chat']);
        Route::post('/rephrase', [AiFeatureController::class, 'rephrase']);
        Route::post('/smart-replies', [AiFeatureController::class, 'smartReplies']);
        Route::get('/stats', [AiFeatureController::class, 'stats']);
        Route::get('/saved-phrases', [AiFeatureController::class, 'getSavedPhrases']);
        Route::post('/saved-phrases', [AiFeatureController::class, 'savePhrase']);
        Route::delete('/saved-phrases/{id}', [AiFeatureController::class, 'deletePhrase']);
        Route::put('/config', [AiFeatureController::class, 'updateConfig']);
    });
});
