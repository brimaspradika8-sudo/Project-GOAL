<?php

namespace App\Listeners;

use App\Events\BookingExpired;
use App\Notifications\BookingExpiredNotification;
use Illuminate\Support\Facades\Log;

class SendBookingExpiredNotification
{
    public function handle(BookingExpired $event): void
    {
        $booking = $event->booking->loadMissing(['field', 'user']);
        $recipient = $booking->user;

        $recipient->notify(new BookingExpiredNotification($booking));

        Log::info('Notification sent', [
            'notification_type' => BookingExpiredNotification::class,
            'recipient_id' => $recipient->id,
        ]);
    }
}
