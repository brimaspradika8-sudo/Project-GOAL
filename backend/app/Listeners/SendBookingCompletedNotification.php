<?php

namespace App\Listeners;

use App\Events\BookingCompleted;
use App\Notifications\BookingCompletedNotification;
use Illuminate\Support\Facades\Log;

class SendBookingCompletedNotification
{
    public function handle(BookingCompleted $event): void
    {
        $booking = $event->booking->loadMissing(['field', 'user']);
        $recipient = $booking->user;

        $recipient->notify(new BookingCompletedNotification($booking));

        Log::info('Notification sent', [
            'notification_type' => BookingCompletedNotification::class,
            'recipient_id' => $recipient->id,
        ]);
    }
}
