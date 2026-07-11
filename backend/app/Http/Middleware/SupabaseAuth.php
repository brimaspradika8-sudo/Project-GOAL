<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;
use Illuminate\Support\Facades\Log;

class SupabaseAuth
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        if (!$token) {
            return response()->json(['error' => 'Missing authorization token.'], 401);
        }

        try {
            $jwtSecret = env('SUPABASE_JWT_SECRET'); 
            if (!$jwtSecret || $jwtSecret === '[YOUR-JWT-SECRET]') {
                Log::error('SUPABASE_JWT_SECRET is not properly set in .env');
                return response()->json(['error' => 'Server configuration error.'], 500);
            }

            // Supabase uses HS256 to sign user tokens using the project JWT secret
            $decoded = JWT::decode($token, new Key($jwtSecret, 'HS256'));
            
            $userId = $decoded->sub ?? null;

            if (!$userId) {
                return response()->json(['error' => 'Invalid token payload.'], 401);
            }

            // Set the authenticated user ID and data in the request attributes.
            $request->attributes->set('auth_user', $decoded);
            $request->attributes->set('auth_user_id', $userId);
            $request->attributes->set('user_id', $userId);

        } catch (Exception $e) {
            return response()->json([
                'error' => 'Invalid or expired token.', 
                // Don't expose exception details in production
                'message' => config('app.debug') ? $e->getMessage() : 'Unauthorized'
            ], 401);
        }

        return $next($request);
    }
}
