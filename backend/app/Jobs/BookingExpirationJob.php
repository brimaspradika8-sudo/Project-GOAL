<?php

namespace App\Jobs;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class BookingExpirationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(public int $bookingId) {}

    public function handle(NotificationService $notifications): void
    {
        $booking = Booking::with(['field:id,name,owner_id', 'user:id,name'])->find($this->bookingId);

        if (!$booking || $booking->status !== BookingStatus::WAITING_OWNER_APPROVAL->value) {
            return;
        }

        if (!$booking->expired_at || $booking->expired_at->isFuture()) {
            return;
        }

        $booking->update(['status' => BookingStatus::EXPIRED->value]);

        $notifications->create(
            $booking->user,
            Notification::TYPE_BOOKING_EXPIRED,
            'Booking Kedaluwarsa',
            "Booking untuk {$booking->field->name} pada {$booking->booking_date->format('Y-m-d')} pukul {$booking->start_time}-{$booking->end_time} kedaluwarsa karena tidak disetujui.",
            ['booking_id' => $booking->id, 'field_id' => $booking->field_id]
        );
    }
}
