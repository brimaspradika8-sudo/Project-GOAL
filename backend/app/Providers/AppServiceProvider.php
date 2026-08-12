<?php

namespace App\Providers;

use App\Events\BookingApproved;
use App\Events\BookingCancelled;
use App\Events\BookingCreated;
use App\Events\BookingExpired;
use App\Events\BookingRejected;
use App\Listeners\LogFailedBookingNotification;
use App\Listeners\SendBookingApprovedNotification;
use App\Listeners\SendBookingCancelledNotification;
use App\Listeners\SendBookingCreatedNotification;
use App\Listeners\SendBookingExpiredNotification;
use App\Listeners\SendBookingRejectedNotification;
use Illuminate\Notifications\Events\NotificationFailed;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Event::listen(BookingCreated::class, SendBookingCreatedNotification::class);
        Event::listen(BookingApproved::class, SendBookingApprovedNotification::class);
        Event::listen(BookingRejected::class, SendBookingRejectedNotification::class);
        Event::listen(BookingExpired::class, SendBookingExpiredNotification::class);
        Event::listen(BookingCancelled::class, SendBookingCancelledNotification::class);
        Event::listen(NotificationFailed::class, LogFailedBookingNotification::class);
    }
}
