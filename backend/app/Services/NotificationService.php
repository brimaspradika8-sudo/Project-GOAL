<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class NotificationService
{
    public function create(User $user, string $type, string $title, string $body, array $data = []): Notification
    {
        return Notification::create([
            'id' => (string) Str::uuid(),
            'notifiable_type' => User::class,
            'notifiable_id' => $user->id,
            'user_id' => $user->id,
            'type'    => $type,
            'title'   => $title,
            'body'    => $body,
            'data'    => $data,
        ]);
    }

    public function createForRole(string $role, string $type, string $title, string $body, array $data = []): int
    {
        $users = User::whereHas('profile', function ($query) use ($role) {
            $query->where('role', $role);
        })->get();

        foreach ($users as $user) {
            Notification::create([
                'id' => (string) Str::uuid(),
                'notifiable_type' => User::class,
                'notifiable_id' => $user->id,
                'user_id' => $user->id,
                'type'    => $type,
                'title'   => $title,
                'body'    => $body,
                'data'    => $data,
            ]);
        }

        return $users->count();
    }

    public function listForUser(User $user, int $page = 1): LengthAwarePaginator
    {
        return Notification::where('user_id', $user->id)
            ->latest()
            ->paginate(20, ['*'], 'page', $page);
    }

    public function unreadCount(User $user): int
    {
        return Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();
    }

    public function markAsRead(User $user, string $id): bool
    {
        return Notification::where('user_id', $user->id)
            ->where('id', $id)
            ->update(['read_at' => now()]) > 0;
    }

    public function markAllAsRead(User $user): int
    {
        return Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    public function deleteAll(User $user): int
    {
        return Notification::where('user_id', $user->id)->delete();
    }
}
