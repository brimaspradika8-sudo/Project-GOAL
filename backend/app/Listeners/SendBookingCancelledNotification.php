<?php

namespace App\Listeners;

use App\Events\BookingCancelled;
use App\Notifications\BookingCancelledNotification;
use Illuminate\Support\Facades\Log;

class SendBookingCancelledNotification
{
    public function handle(BookingCancelled $event): void
    {
        $booking = $event->booking->loadMissing(['field.owner', 'user']);
        $recipient = $booking->field?->owner;

        if (!$recipient) {
            return;
        }

        $recipient->notify(new BookingCancelledNotification($booking));

        Log::info('Notification sent', [
            'notification_type' => BookingCancelledNotification::class,
            'recipient_id' => $recipient->id,
        ]);
    }
}
