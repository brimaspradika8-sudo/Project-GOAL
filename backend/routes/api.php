<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AuthCheckController;

Route::post('/auth/check-email', [AuthCheckController::class, 'checkEmail'])
    ->middleware('throttle:10,1');

Route::middleware('supabase')->group(function () {
    // Profile
    Route::get('/me', [ProfileController::class, 'me']);

    // Onboarding
    Route::get('/me/onboarding/check-username', [ProfileController::class, 'checkUsername']);
    Route::post('/me/onboarding', [ProfileController::class, 'submitOnboarding']);
});
