<?php

namespace App\Services;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function listUsers(?string $search = null, ?string $role = null): LengthAwarePaginator
    {
        return User::with('profile')
            ->when($search, function ($query, $value) {
                $query->where('name', 'like', "%{$value}%")
                    ->orWhere('email', 'like', "%{$value}%");
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
                'password' => Hash::make($data['password']),
            ]);

            Profile::create([
                'user_id' => $user->id,
                'email' => $data['email'],
                'full_name' => $data['name'],
                'role' => $data['role'] ?? 'owner',
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
            $user->password = Hash::make($data['password']);
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
        $currentUserRole = $currentUser->profile?->role;

        if (($user->profile?->role === 'super_admin' || $role === 'super_admin') && $currentUserRole !== 'super_admin') {
            throw new \RuntimeException('Hanya Super Admin yang dapat mengelola role Super Admin.');
        }

        $user->profile?->update(['role' => $role]);
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
}
