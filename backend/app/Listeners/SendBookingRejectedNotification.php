<?php

namespace App\Listeners;

use App\Events\BookingRejected;
use App\Notifications\BookingRejectedNotification;
use Illuminate\Support\Facades\Log;

class SendBookingRejectedNotification
{
    public function handle(BookingRejected $event): void
    {
        $booking = $event->booking->loadMissing(['field', 'user']);
        $recipient = $booking->user;

        $recipient->notify(new BookingRejectedNotification($booking));

        Log::info('Notification sent', [
            'notification_type' => BookingRejectedNotification::class,
            'recipient_id' => $recipient->id,
        ]);
    }
}
