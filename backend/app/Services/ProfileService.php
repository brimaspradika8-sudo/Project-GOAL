<?php

namespace App\Services;

use App\Models\Profile;
use App\Models\User;
use App\Models\UserSportPreference;
use Illuminate\Support\Facades\DB;

class ProfileService
{
    public function getPayload(User $user): array
    {
        $profile = Profile::where('user_id', $user->id)->first();

        if (!$profile) {
            return [
                'onboarding_completed' => false,
                'role'                 => Profile::ROLE_PLAYER,
                'is_owner_verified'    => false,
                'username'             => null,
                'region'               => null,
                'avatar_url'           => null,
                'age'                  => null,
                'sports'               => [],
                'full_name'            => $user->name,
                'email'                => $user->email,
            ];
        }

        $sports = $profile->sportPreferences()
            ->orderBy('created_at')
            ->pluck('sport_type')
            ->toArray();

        return [
            'onboarding_completed' => $profile->onboarding_completed,
            'role'                 => $profile->role,
            'is_owner_verified'    => $profile->is_owner_verified,
            'username'             => $profile->username,
            'region'               => $profile->region,
            'avatar_url'           => $profile->avatar_url,
            'age'                  => $profile->age ?? null,
            'sports'               => $sports,
            'full_name'            => $profile->full_name ?? $user->name,
            'email'                => $profile->email ?? $user->email,
        ];
    }

    public function isUsernameAvailable(string $username, ?int $exceptUserId = null): bool
    {
        $query = Profile::whereRaw('LOWER(username) = LOWER(?)', [$username]);

        if ($exceptUserId) {
            $query->where('user_id', '!=', $exceptUserId);
        }

        return !$query->exists();
    }

    public function isUsernameValid(string $username): ?string
    {
        $length = strlen($username);
        if ($length < 3) return 'too_short';
        if ($length > 20) return 'too_long';
        return null;
    }

    public function submitOnboarding(User $user, array $data): array|false
    {
        return DB::transaction(function () use ($user, $data) {
            if (!$this->isUsernameAvailable($data['username'], $user->id)) {
                return false;
            }

            $profile = Profile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'username'             => $data['username'],
                    'email'                => $user->email,
                    'full_name'            => $user->name,
                    'region'               => $data['region'] ?? null,
                    'avatar_url'           => $data['avatar_url'] ?? null,
                    'onboarding_completed' => true,
                ]
            );

            UserSportPreference::where('user_id', $user->id)->delete();

            foreach ($data['sports'] as $sport) {
                UserSportPreference::create([
                    'user_id'    => $user->id,
                    'sport_type' => strtolower($sport),
                ]);
            }

            return $this->getPayload($user);
        });
    }
}
