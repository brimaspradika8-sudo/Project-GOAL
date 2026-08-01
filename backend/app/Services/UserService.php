<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class UserService
{
    public function __construct(
        private NotificationService $notifications
    ) {}

    public function listUsers(?string $search = null, ?string $role = null): LengthAwarePaginator
    {
        return User::with('profile')
            ->when($search, function ($query, $value) {
                $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $value);
                $query->where('name', 'like', "%{$escaped}%")
                    ->orWhere('email', 'like', "%{$escaped}%");
            })
            ->when($role, function ($query, $value) {
                $query->whereHas('profile', function ($profileQuery) use ($value) {
                    $profileQuery->where('role', $value);
                });
            })
            ->latest()
            ->paginate(20);
    }

    public function createUser(array $data): User
    {
        return DB::transaction(function () use ($data): User {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
            ]);

            Profile::create([
                'user_id' => $user->id,
                'email' => $data['email'],
                'full_name' => $data['name'],
                'role' => $data['role'] ?? 'player',
                'username' => 'user_' . $user->id,
            ]);

            return $user->load('profile');
        });
    }

    public function updateUser(User $user, array $data): User
    {
        if (array_key_exists('name', $data)) {
            $user->name = $data['name'];
        }

        if (array_key_exists('email', $data)) {
            $user->email = $data['email'];
        }

        if (!empty($data['password'] ?? null)) {
            $user->password = $data['password'];
        }

        $user->save();

        if ($user->profile) {
            $profileUpdate = [];

            if (array_key_exists('name', $data)) {
                $profileUpdate['full_name'] = $data['name'];
            }

            if (array_key_exists('email', $data)) {
                $profileUpdate['email'] = $data['email'];
            }

            if (!empty($profileUpdate)) {
                $user->profile->update($profileUpdate);
            }
        }

        return $user->fresh('profile');
    }

    public function updateRole(User $user, string $role, User $currentUser): void
    {
        $validRoles = [Profile::ROLE_PLAYER, Profile::ROLE_OWNER, Profile::ROLE_SUPER_ADMIN];

        if (!in_array($role, $validRoles)) {
            throw new \RuntimeException('Role tidak valid.');
        }

        $currentUserRole = $currentUser->profile?->role;

        if (($user->profile?->role === 'super_admin' || $role === 'super_admin') && $currentUserRole !== 'super_admin') {
            throw new \RuntimeException('Hanya Super Admin yang dapat mengelola role Super Admin.');
        }

        $user->profile?->forceFill(['role' => $role])->save();

        $this->notifications->create(
            $user,
            Notification::TYPE_ROLE_CHANGED,
            'Role Akun Diubah',
            "Role akun Anda diubah menjadi {$role}.",
            ['role' => $role]
        );
    }

    public function deleteUser(User $user, User $currentUser): void
    {
        if ($user->id === $currentUser->id) {
            throw new \RuntimeException('Anda tidak bisa menghapus akun Anda sendiri.');
        }

        $currentUserRole = $currentUser->profile?->role;

        if ($user->profile && $user->profile->role === 'super_admin' && $currentUserRole !== 'super_admin') {
            throw new \RuntimeException('Hanya Super Admin yang dapat menghapus akun Super Admin.');
        }

        $user->profile?->delete();
        $user->delete();
    }

    public function deleteUsers(array $ids, User $currentUser): int
    {
        $currentUserRole = $currentUser->profile?->role;
        $deleted = 0;

        User::with('profile')
            ->whereIn('id', $ids)
            ->get()
            ->each(function (User $user) use ($currentUser, $currentUserRole, &$deleted) {
                if ($user->id === $currentUser->id) {
                    return;
                }

                if ($user->profile && $user->profile->role === 'super_admin' && $currentUserRole !== 'super_admin') {
                    return;
                }

                $user->profile?->delete();
                $user->delete();
                $deleted++;
            });

        return $deleted;
    }
}
