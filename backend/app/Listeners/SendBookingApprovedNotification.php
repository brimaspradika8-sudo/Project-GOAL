<?php

namespace App\Listeners;

use App\Events\BookingApproved;
use App\Notifications\BookingApprovedNotification;
use Illuminate\Support\Facades\Log;

class SendBookingApprovedNotification
{
    public function handle(BookingApproved $event): void
    {
        $booking = $event->booking->loadMissing(['field', 'user']);
        $recipient = $booking->user;

        $recipient->notify(new BookingApprovedNotification($booking));

        Log::info('Notification sent', [
            'notification_type' => BookingApprovedNotification::class,
            'recipient_id' => $recipient->id,
        ]);
    }
}
