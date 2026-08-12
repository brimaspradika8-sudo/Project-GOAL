<?php

namespace App\Notifications\Concerns;

use App\Notifications\Channels\GoalDatabaseChannel;

trait StoresGoalNotification
{
    public function via(object $notifiable): array
    {
        return [GoalDatabaseChannel::class];
    }
}
