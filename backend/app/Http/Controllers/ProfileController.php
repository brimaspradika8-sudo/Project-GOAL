<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProfileController extends Controller
{
    private function authUserId(Request $request): string
    {
        return (string) $request->attributes->get('auth_user_id');
    }

    /**
     * GET /me/onboarding/check-username
     * Live-check username availability (case-insensitive).
     */
    public function checkUsername(Request $request)
    {
        $username = $request->query('username', '');

        if (strlen($username) < 3) {
            return response()->json(['available' => false, 'reason' => 'too_short']);
        }

        $exists = DB::table('profiles')
            ->whereRaw('LOWER(username) = ?', [strtolower($username)])
            ->exists();

        return response()->json(['available' => !$exists]);
    }

    /**
     * POST /me/onboarding
     * Complete the onboarding: set username + sport preferences.
     */
    public function submitOnboarding(Request $request)
    {
        $validated = $request->validate([
            'username' => [
                'required', 'string', 'min:3', 'max:20',
                'regex:/^[a-zA-Z0-9_]+$/',
                'unique:profiles,username',
            ],
            'age'        => 'required|integer|min:10|max:80',
            'sports'     => 'required|array|min:1',
            'sports.*'   => 'string|max:100',
            'region'     => 'nullable|string|max:100',
            'avatar_url' => 'nullable|string',
        ]);

        $userId = $this->authUserId($request);

        // Upsert profile row (creates if doesn't exist yet)
        $existing = DB::table('profiles')->where('id', $userId)->first();

        if ($existing) {
            DB::table('profiles')->where('id', $userId)->update([
                'username'              => $validated['username'],
                'age'                   => $validated['age'],
                'region'                => $validated['region'] ?? null,
                'avatar_url'            => $validated['avatar_url'] ?? null,
                'onboarding_completed'  => true,
                'updated_at'            => now(),
            ]);
        } else {
            DB::table('profiles')->insert([
                'id'                    => $userId,
                'username'              => $validated['username'],
                'age'                   => $validated['age'],
                'region'                => $validated['region'] ?? null,
                'avatar_url'            => $validated['avatar_url'] ?? null,
                'onboarding_completed'  => true,
                'role'                  => 'player',
                'is_owner_verified'     => false,
                'created_at'            => now(),
                'updated_at'            => now(),
            ]);
        }

        // Remove any previous sport prefs, then insert fresh ones
        DB::table('user_sport_preferences')->where('user_id', $userId)->delete();

        foreach ($validated['sports'] as $sport) {
            DB::table('user_sport_preferences')->insert([
                'id'         => Str::uuid()->toString(),
                'user_id'    => $userId,
                'sport_type' => strtolower($sport),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $profile = DB::table('profiles')->where('id', $userId)->first();

        return response()->json($profile);
    }

    /**
     * GET /me
     * Return current user's profile (includes onboarding_completed for route guard).
     */
    public function me(Request $request)
    {
        $userId = $this->authUserId($request);

        $profile = DB::table('profiles')->where('id', $userId)->first();

        if (!$profile) {
            return response()->json([
                'onboarding_completed' => false,
                'role'                 => 'player',
                'is_owner_verified'    => false,
            ]);
        }

        return response()->json($profile);
    }
}
