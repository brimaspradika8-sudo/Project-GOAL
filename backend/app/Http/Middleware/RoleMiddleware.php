<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $profile = $user->profile;

        if (!$profile) {
            return response()->json([
                'message' => 'Profil tidak ditemukan. Silakan lengkapi profil terlebih dahulu.',
            ], 403);
        }

        if (!in_array($profile->role, $roles)) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses untuk melakukan ini.',
                'required' => $roles,
                'current'  => $profile->role,
            ], 403);
        }

        $request->attributes->set('profile', $profile);

        return $next($request);
    }
}
