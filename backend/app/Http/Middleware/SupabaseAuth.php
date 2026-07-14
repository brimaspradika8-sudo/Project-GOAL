<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\JWK;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class SupabaseAuth
{
    private const ALLOWED_ALGORITHMS = ['HS256', 'RS256', 'ES256'];

    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        if (!$token) {
            return response()->json(['error' => 'Missing authorization token.'], 401);
        }

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return response()->json(['error' => 'Invalid token format.'], 401);
        }

        $header = json_decode(base64_decode(strtr($parts[0], '-_', '+/')), true);
        $alg = $header['alg'] ?? null;
        $kid = $header['kid'] ?? null;

        if (!$alg || !in_array($alg, self::ALLOWED_ALGORITHMS, true)) {
            return response()->json(['error' => 'Unsupported or missing algorithm in token header.'], 401);
        }

        try {
            if ($alg === 'HS256') {
                $decoded = $this->decodeHS256($token);
            } else {
                $decoded = $this->decodeWithJwks($token, $alg, $kid);
            }

            $userId = $decoded->sub ?? null;
            if (!$userId) {
                return response()->json(['error' => 'Invalid token payload.'], 401);
            }

            if (isset($decoded->exp) && $decoded->exp < time()) {
                return response()->json(['error' => 'Token has expired.'], 401);
            }

            $request->attributes->set('auth_user', $decoded);
            $request->attributes->set('auth_user_id', $userId);
            $request->attributes->set('user_id', $userId);

        } catch (Exception $e) {
            Log::warning('JWT verification failed', ['alg' => $alg, 'kid' => $kid, 'error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Invalid or expired token.',
            ], 401);
        }

        return $next($request);
    }

    private function decodeHS256(string $token): object
    {
        $jwtSecret = env('SUPABASE_JWT_SECRET');
        if (!$jwtSecret || $jwtSecret === '[YOUR-JWT-SECRET]') {
            throw new \RuntimeException('SUPABASE_JWT_SECRET is not properly set.');
        }
        return JWT::decode($token, new Key($jwtSecret, 'HS256'));
    }

    private function decodeWithJwks(string $token, string $alg, ?string $kid): object
    {
        $jwks = $this->fetchJwks();
        $keys = JWK::parseKeySet($jwks, $alg);

        $key = null;
        if ($kid && isset($keys[$kid])) {
            $key = $keys[$kid];
        } else {
            if ($kid) {
                Cache::pull('supabase_jwks');
                $jwks = $this->fetchJwks();
                $keys = JWK::parseKeySet($jwks, $alg);
                if ($kid && isset($keys[$kid])) {
                    $key = $keys[$kid];
                }
            }
        }

        if (!$key) {
            throw new \RuntimeException("No matching key in JWKS for alg={$alg}, kid={$kid}");
        }

        return JWT::decode($token, $key);
    }

    private function fetchJwks(): array
    {
        $cacheKey = 'supabase_jwks';
        $cached = Cache::get($cacheKey);
        if ($cached) {
            return $cached;
        }

        $supabaseUrl = env('SUPABASE_URL');
        if (!$supabaseUrl) {
            throw new \RuntimeException('SUPABASE_URL is not set.');
        }

        $response = Http::timeout(5)->get("{$supabaseUrl}/auth/v1/.well-known/jwks.json");

        if (!$response->successful()) {
            throw new \RuntimeException("Failed to fetch JWKS: {$response->status()}");
        }

        $jwks = $response->json();
        Cache::put($cacheKey, $jwks, now()->addHours(6));

        return $jwks;
    }
}
