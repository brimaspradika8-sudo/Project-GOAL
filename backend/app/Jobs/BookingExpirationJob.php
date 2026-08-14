<?php

namespace App\Jobs;

use App\Enums\BookingStatus;
use App\Exceptions\InvalidBookingStatusTransitionException;
use App\Models\Booking;
use App\Services\BookingStatusService;
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

    public function handle(BookingStatusService $statusService): void
    {
        Log::info('Booking expiration started', ['booking_id' => $this->bookingId]);

        $booking = Booking::with(['field:id,name,owner_id', 'user:id,name'])->find($this->bookingId);

        if (!$booking) {
            Log::info('Booking not found for expiration', ['booking_id' => $this->bookingId]);
            return;
        }

        // Only bookings waiting for owner confirmation may be expired by this job.
        if ($booking->status !== BookingStatus::WAITING_CONFIRMATION->value) {
            Log::info('Booking not expired because status is not waiting confirmation', ['booking_id' => $booking->id, 'status' => $booking->status]);
            return;
        }

        if (!$booking->expired_at || $booking->expired_at->isFuture()) {
            Log::info('Booking not expired because expired_at is not reached', ['booking_id' => $booking->id, 'expired_at' => $booking->expired_at]);
            return;
        }

        try {
            $statusService->transition($booking, BookingStatus::CANCELLED, [
                'cancelled_at' => now(),
                'cancel_reason' => 'Expired',
            ]);
        } catch (InvalidBookingStatusTransitionException $e) {
            Log::info('Booking expiration skipped because transition is invalid', [
                'booking_id' => $booking->id,
                'status' => $booking->status,
            ]);
        }
    }
}
