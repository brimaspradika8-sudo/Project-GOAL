<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class Authenticate
{
    public function __construct(
        protected AuthFactory $auth
    ) {}

    public function handle(Request $request, Closure $next, ...$guards): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $accessToken = PersonalAccessToken::findToken($token);

        if (!$accessToken) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        if ($accessToken->expires_at && $accessToken->expires_at->isPast()) {
            $accessToken->delete();
            return response()->json(['message' => 'Token sudah kedaluwarsa.'], 401);
        }

        $user = $accessToken->tokenable;

        if (!$user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $this->auth->guard('sanctum')->setUser($user);

        $request->setUserResolver(fn () => $user);
        $request->attributes->set('sanctum.access_token', $accessToken);

        return $next($request);
    }
}
