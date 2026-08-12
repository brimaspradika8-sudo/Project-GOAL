<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Models\Notification as GoalNotification;
use App\Notifications\Concerns\StoresGoalNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class BookingRejectedNotification extends Notification implements ShouldQueue
{
    use Queueable, StoresGoalNotification;

    public function __construct(private Booking $booking) {}

    public function type(): string
    {
        return GoalNotification::TYPE_BOOKING_REJECTED;
    }

    public function title(): string
    {
        return 'Booking Ditolak';
    }

    public function body(): string
    {
        return 'Booking ditolak.' . ($this->booking->rejection_reason ? " Alasan: {$this->booking->rejection_reason}" : '');
    }

    public function payload(): array
    {
        return [
            'booking_id' => $this->booking->id,
            'reason' => $this->booking->rejection_reason,
        ];
    }
}
