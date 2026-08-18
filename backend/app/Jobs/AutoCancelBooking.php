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

class AutoCancelBooking implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(public int $bookingId) {}

    public function handle(BookingStatusService $statusService): void
    {
        $booking = Booking::with(['field:id,name,owner_id', 'user:id,name'])->find($this->bookingId);

        if (!$booking) {
            Log::info('AutoCancelBooking: booking not found', ['booking_id' => $this->bookingId]);
            return;
        }

        if ($booking->status !== BookingStatus::WAITING_CONFIRMATION->value) {
            Log::info('AutoCancelBooking: booking not waiting for confirmation', ['booking_id' => $booking->id, 'status' => $booking->status]);
            return;
        }

        $paymentExpired = $booking->payment_expired_at && !$booking->payment_expired_at->isFuture();
        $slotExpired = $booking->expired_at && !$booking->expired_at->isFuture();

        if (!$paymentExpired && !$slotExpired) {
            Log::info('AutoCancelBooking: deadline not reached', [
                'booking_id' => $booking->id,
                'payment_expired_at' => $booking->payment_expired_at,
                'expired_at' => $booking->expired_at,
            ]);
            return;
        }

        $reason = $paymentExpired ? 'PAYMENT_TIMEOUT' : 'Expired';

        try {
            $statusService->transition($booking, BookingStatus::CANCELLED, [
                'cancelled_at' => now(),
                'cancel_reason' => $reason,
            ]);
        } catch (InvalidBookingStatusTransitionException $e) {
            Log::info('AutoCancelBooking: transition skipped', [
                'booking_id' => $booking->id,
                'status' => $booking->status,
            ]);
        }
    }
}
