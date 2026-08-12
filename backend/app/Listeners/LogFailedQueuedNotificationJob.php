<?php

namespace App\Listeners;

use Illuminate\Notifications\SendQueuedNotifications;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Support\Facades\Log;

class LogFailedQueuedNotificationJob
{
    public function handle(JobFailed $event): void
    {
        $command = $event->job->payload()['data']['commandName'] ?? null;

        if ($command !== SendQueuedNotifications::class) {
            return;
        }

        Log::error('notification_failed', [
            'notification_type' => $command,
            'user_id' => null,
            'error_message' => $event->exception->getMessage(),
        ]);
    }
}
