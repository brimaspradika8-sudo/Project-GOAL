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
        Log::info('Booking expiration started', ['booking_id' => $this->bookingId]);

        $booking = Booking::with(['field:id,name,owner_id', 'user:id,name'])->find($this->bookingId);

        if (!$booking) {
            Log::info('Booking not found for expiration', ['booking_id' => $this->bookingId]);
            return;
        }

        // Only bookings waiting for owner approval may be expired by this job.
        if ($booking->status !== BookingStatus::WAITING_OWNER_APPROVAL->value) {
            Log::info('Booking not expired because status is not waiting approval', ['booking_id' => $booking->id, 'status' => $booking->status]);
            return;
        }

        if (!$booking->expired_at || $booking->expired_at->isFuture()) {
            Log::info('Booking not expired because expired_at is not reached', ['booking_id' => $booking->id, 'expired_at' => $booking->expired_at]);
            return;
        }

        $previous = $booking->status;

        $booking->update(['status' => BookingStatus::EXPIRED->value]);

        Log::info('Booking expired', ['booking_id' => $booking->id, 'previous_status' => $previous, 'new_status' => $booking->status]);

        $notifications->create(
            $booking->user,
            Notification::TYPE_BOOKING_EXPIRED,
            'Booking Kedaluwarsa',
            "Booking untuk {$booking->field->name} pada {$booking->booking_date->format('Y-m-d')} pukul {$booking->start_time}-{$booking->end_time} kedaluwarsa karena tidak disetujui.",
            ['booking_id' => $booking->id, 'field_id' => $booking->field_id]
        );
    }
}
