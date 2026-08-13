<?php

namespace App\Console\Commands;

use App\Jobs\BookingExpirationJob;
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
        $bookings = Booking::where('status', BookingStatus::WAITING_CONFIRMATION->value)
            ->whereNotNull('expired_at')
            ->where('expired_at', '<=', now())
            ->get();

        foreach ($bookings as $booking) {
            Log::info('Dispatching booking expiration job', ['booking_id' => $booking->id]);
            BookingExpirationJob::dispatch($booking->id);
        }

        $this->info('Dispatched expiration jobs for ' . $bookings->count() . ' booking(s).');

        return self::SUCCESS;
    }
}
