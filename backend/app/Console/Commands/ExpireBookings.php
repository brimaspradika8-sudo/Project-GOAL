<?php

namespace App\Console\Commands;

use App\Jobs\BookingExpirationJob;
use App\Models\Booking;
use App\Enums\BookingStatus;
use Illuminate\Console\Command;

class ExpireBookings extends Command
{
    protected $signature = 'booking:expire';

    protected $description = 'Expire waiting owner approval bookings whose expiry time has passed.';

    public function handle(): int
    {
        $bookings = Booking::where('status', BookingStatus::WAITING_OWNER_APPROVAL->value)
            ->whereNotNull('expired_at')
            ->where('expired_at', '<=', now())
            ->get();

        foreach ($bookings as $booking) {
            BookingExpirationJob::dispatchSync($booking->id);
        }

        $this->info('Expired ' . $bookings->count() . ' booking(s).');

        return self::SUCCESS;
    }
}
