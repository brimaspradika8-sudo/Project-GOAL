<?php

namespace App\Notifications\Channels;

use App\Models\Notification as GoalNotification;
use App\Models\User;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class GoalDatabaseChannel
{
    public function send(object $notifiable, Notification $notification): GoalNotification
    {
        return GoalNotification::create([
            'id' => (string) Str::uuid(),
            'notifiable_type' => User::class,
            'notifiable_id' => $notifiable->id,
            'user_id' => $notifiable->id,
            'type' => $notification->type(),
            'title' => $notification->title(),
            'body' => $notification->body(),
            'data' => $notification->payload(),
        ]);
    }
}
