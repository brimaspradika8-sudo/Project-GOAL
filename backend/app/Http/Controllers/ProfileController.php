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

    private function profilePayload(Request $request, ?object $profile): object
    {
        $authUser = $request->attributes->get('auth_user');
        $fullName = null;

        if (is_object($authUser)) {
            $userMetadata = $authUser->user_metadata ?? null;
            if (is_object($userMetadata)) {
                $fullName = $userMetadata->full_name ?? null;
            } elseif (is_array($userMetadata)) {
                $fullName = $userMetadata['full_name'] ?? null;
            }
        }

        if (!$profile) {
            return (object) [
                'onboarding_completed' => false,
                'role'                 => 'player',
                'is_owner_verified'    => false,
                'sports'               => [],
                'full_name'            => $fullName,
            ];
        }

        $sports = DB::table('user_sport_preferences')
            ->where('user_id', $profile->id)
            ->orderBy('created_at')
            ->pluck('sport_type')
            ->all();

        return (object) array_merge((array) $profile, [
            'sports' => $sports,
            'full_name' => $fullName ?? ($profile->full_name ?? null),
        ]);
    }

    public function checkUsername(Request $request)
    {
        $username = $request->query('username', '');

        if (strlen($username) < 3) {
            return response()->json(['available' => false, 'reason' => 'too_short']);
        }

        if (strlen($username) > 20) {
            return response()->json(['available' => false, 'reason' => 'too_long']);
        }

        $exists = DB::table('profiles')
            ->whereRaw('LOWER(username) = LOWER(?)', [$username])
            ->exists();

        return response()->json(['available' => !$exists]);
    }

    public function submitOnboarding(Request $request)
    {
        $validated = $request->validate([
            'username' => [
                'required', 'string', 'min:3', 'max:20',
                'regex:/^[a-zA-Z0-9_]+$/',
            ],
            'sports'     => 'required|array|min:1',
            'sports.*'   => 'string|max:100',
            'region'     => 'nullable|string|max:100',
            'avatar_url' => 'nullable|string|max:2048',
        ]);

        $userId = $this->authUserId($request);
        $usernameLower = strtolower($validated['username']);

        $usernameTaken = DB::table('profiles')
            ->whereRaw('LOWER(username) = ?', [$usernameLower])
            ->where('id', '!=', $userId)
            ->exists();

        if ($usernameTaken) {
            return response()->json([
                'errors' => ['username' => ['Username sudah digunakan.']],
            ], 422);
        }

        DB::transaction(function () use ($userId, $validated) {
            $existing = DB::table('profiles')->where('id', $userId)->first();

            if ($existing) {
                DB::table('profiles')->where('id', $userId)->update([
                    'username'             => $validated['username'],
                    'region'               => $validated['region'] ?? null,
                    'avatar_url'           => $validated['avatar_url'] ?? null,
                    'onboarding_completed' => true,
                    'updated_at'           => now(),
                ]);
            } else {
                DB::table('profiles')->insert([
                    'id'                   => $userId,
                    'username'             => $validated['username'],
                    'region'               => $validated['region'] ?? null,
                    'avatar_url'           => $validated['avatar_url'] ?? null,
                    'onboarding_completed' => true,
                    'role'                 => 'player',
                    'is_owner_verified'    => false,
                    'created_at'           => now(),
                    'updated_at'           => now(),
                ]);
            }

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
        });

        $profile = DB::table('profiles')->where('id', $userId)->first();

        return response()->json($this->profilePayload($request, $profile));
    }

    public function me(Request $request)
    {
        $userId = $this->authUserId($request);

        $profile = DB::table('profiles')->where('id', $userId)->first();

        return response()->json($this->profilePayload($request, $profile));
    }
}
