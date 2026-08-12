<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Models\Notification as GoalNotification;
use App\Notifications\Concerns\StoresGoalNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class BookingExpiredNotification extends Notification implements ShouldQueue
{
    use Queueable, StoresGoalNotification;

    public function __construct(private Booking $booking) {}

    public function type(): string
    {
        return GoalNotification::TYPE_BOOKING_EXPIRED;
    }

    public function title(): string
    {
        return 'Booking Kedaluwarsa';
    }

    public function body(): string
    {
        return 'Booking expired karena tidak diproses owner.';
    }

    public function payload(): array
    {
        return [
            'booking_id' => $this->booking->id,
            'field_id' => $this->booking->field_id,
            'field_name' => $this->booking->field->name,
            'booking_date' => $this->booking->booking_date->format('Y-m-d'),
            'start_time' => $this->booking->start_time,
            'end_time' => $this->booking->end_time,
        ];
    }
}
