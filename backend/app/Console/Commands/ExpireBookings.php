<?php

namespace App\Console\Commands;

use App\Jobs\AutoCancelBooking;
use App\Models\Booking;
use App\Enums\BookingStatus;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ExpireBookings extends Command
{
    protected $signature = 'booking:expire';

    protected $description = 'Expire waiting confirmation bookings whose expiry time has passed.';

    public function handle(): int
    {
        $count = 0;
        $bookings = Booking::where('status', BookingStatus::WAITING_CONFIRMATION->value)
            ->where(function ($query) {
                $query->where(function ($q) {
                    $q->whereNotNull('expired_at')
                      ->where('expired_at', '<=', now());
                })->orWhere(function ($q) {
                    $q->whereNotNull('payment_expired_at')
                      ->where('payment_expired_at', '<=', now());
                });
            })
            ->limit(100)
            ->get();

        foreach ($bookings as $booking) {
            Log::info('Dispatching auto cancel booking job', ['booking_id' => $booking->id]);
            AutoCancelBooking::dispatch($booking->id);
            $count++;
        }

        $this->info('Dispatched expiration jobs for ' . $count . ' booking(s).');

        return self::SUCCESS;
    }
}
