<?php

namespace App\Listeners;

use Illuminate\Notifications\Events\NotificationFailed;
use Illuminate\Support\Facades\Log;

class LogFailedBookingNotification
{
    public function handle(NotificationFailed $event): void
    {
        $exception = $event->data['exception'] ?? null;

        Log::error('notification_failed', [
            'notification_type' => $event->notification::class,
            'user_id' => $event->notifiable->id ?? null,
            'channel' => $event->channel,
            'error_message' => $exception instanceof \Throwable ? $exception->getMessage() : null,
        ]);
    }
}
