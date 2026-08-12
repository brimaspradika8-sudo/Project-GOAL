<?php

namespace App\Listeners;

use Illuminate\Notifications\Events\NotificationFailed;
use Illuminate\Support\Facades\Log;

class LogFailedBookingNotification
{
    public function handle(NotificationFailed $event): void
    {
        Log::error('Notification failed', [
            'notification_type' => $event->notification::class,
            'user_id' => $event->notifiable->id ?? null,
            'channel' => $event->channel,
        ]);
    }
}
