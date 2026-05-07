<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
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

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
