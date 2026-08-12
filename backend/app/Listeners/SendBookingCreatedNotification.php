<?php

namespace App\Listeners;

use App\Events\BookingCreated;
use App\Notifications\BookingCreatedNotification;
use Illuminate\Support\Facades\Log;

class SendBookingCreatedNotification
{
    public function handle(BookingCreated $event): void
    {
        $booking = $event->booking->loadMissing(['field.owner', 'user']);
        $recipient = $booking->field?->owner;

        if (!$recipient) {
            return;
        }

        $recipient->notify(new BookingCreatedNotification($booking));

        Log::info('Notification sent', [
            'notification_type' => BookingCreatedNotification::class,
            'recipient_id' => $recipient->id,
        ]);
    }
}
