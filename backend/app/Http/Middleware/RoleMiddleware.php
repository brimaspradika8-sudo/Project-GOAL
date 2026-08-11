<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
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

        $allowedRoles = array_intersect($roles, UserRole::values());

        if (count($allowedRoles) !== count($roles)) {
            return response()->json([
                'message' => 'Konfigurasi role tidak valid.',
                'errors' => ['role' => ['Role route tidak dikenali.']],
            ], 500);
        }

        if (!in_array($profile->role, $allowedRoles, true)) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses untuk melakukan ini.',
                'errors' => ['role' => ['Role Anda tidak memiliki izin untuk route ini.']],
            ], 403);
        }

        $request->attributes->set('profile', $profile);

        return $next($request);
    }
}
