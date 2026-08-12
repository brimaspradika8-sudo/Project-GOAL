<?php

namespace App\Policies;

use App\Models\Booking;
use App\Models\Profile;
use App\Models\User;

class BookingPolicy
{
    public function view(User $user, Booking $booking): bool
    {
        return $this->isSuperAdmin($user)
            || $booking->user_id === $user->id
            || $booking->field?->owner_id === $user->id;
    }

    public function cancel(User $user, Booking $booking): bool
    {
        return $booking->user_id === $user->id;
    }

    public function confirm(User $user, Booking $booking): bool
    {
        return $this->isSuperAdmin($user)
            || $booking->field?->owner_id === $user->id;
    }

    public function approve(User $user, Booking $booking): bool
    {
        return $this->confirm($user, $booking);
    }

    public function reject(User $user, Booking $booking): bool
    {
        return $this->confirm($user, $booking);
    }

    private function isSuperAdmin(User $user): bool
    {
        return $user->profile?->role === Profile::ROLE_SUPER_ADMIN;
    }
}
