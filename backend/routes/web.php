<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json(['service' => 'PesoMatch profile API', 'frontend' => 'http://localhost:8443']));
Route::prefix('api/auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware(['guest:web', 'throttle:register']);
    Route::post('/login', [AuthController::class, 'login'])->middleware(['guest:web', 'throttle:login']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
});
