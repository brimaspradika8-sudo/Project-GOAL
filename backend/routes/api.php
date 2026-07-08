<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// This is an example of a route protected by Supabase Auth middleware
Route::middleware('supabase')->group(function () {
    Route::get('/me', function (Request $request) {
        $authUser = $request->attributes->get('auth_user');
        
        return response()->json([
            'message' => 'You are authenticated with Supabase!',
            'user' => $authUser
        ]);
    });
});
