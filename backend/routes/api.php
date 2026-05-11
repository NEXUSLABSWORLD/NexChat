<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::prefix('auth')->group(function () {
    // Registration
    Route::post('/register', [RegisterController::class, 'register']);
    
    // Login
    Route::post('/login', [LoginController::class, 'login']);
    
    // Logout (protected route in real app)
    Route::post('/logout', [LoginController::class, 'logout']);
});

Route::prefix('profile')->group(function () {
    // Get user profile
    Route::get('/show', [ProfileController::class, 'show']);
    
    // Update user profile
    Route::put('/update', [ProfileController::class, 'update']);
    
    // Search users
    Route::get('/search', [ProfileController::class, 'search']);
});

Route::prefix('conversations')->group(function () {
    // Get all conversations for a user
    Route::get('/', [ConversationController::class, 'index']);
    
    // Create or get conversation with another user
    Route::post('/', [ConversationController::class, 'store']);
    
    // Get specific conversation with messages
    Route::get('/{id}', [ConversationController::class, 'show']);
    
    // Mark conversation messages as read
    Route::patch('/{id}/read', [ConversationController::class, 'markAsRead']);
});

Route::prefix('messages')->group(function () {
    // Get messages in a conversation
    Route::get('/', [MessageController::class, 'index']);
    
    // Send a message
    Route::post('/', [MessageController::class, 'store']);
    
    // Mark message as read
    Route::patch('/{id}/read', [MessageController::class, 'markAsRead']);
});

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
