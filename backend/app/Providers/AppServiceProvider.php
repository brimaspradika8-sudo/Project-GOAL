<?php

namespace App\Providers;

use App\Events\BookingApproved;
use App\Events\BookingCancelled;
use App\Events\BookingCreated;
use App\Events\BookingExpired;
use App\Events\BookingRejected;
use App\Listeners\LogFailedBookingNotification;
use App\Listeners\LogFailedQueuedNotificationJob;
use App\Listeners\SendBookingApprovedNotification;
use App\Listeners\SendBookingCancelledNotification;
use App\Listeners\SendBookingCreatedNotification;
use App\Listeners\SendBookingExpiredNotification;
use App\Listeners\SendBookingRejectedNotification;
use App\Models\Booking;
use App\Models\Field;
use App\Policies\BookingPolicy;
use App\Policies\FieldPolicy;
use Illuminate\Notifications\Events\NotificationFailed;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::policy(Booking::class, BookingPolicy::class);
        Gate::policy(Field::class, FieldPolicy::class);

        RateLimiter::for('auth-sensitive', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('booking-sensitive', function (Request $request) {
            return Limit::perMinute(10)->by(optional($request->user())->id ?: $request->ip());
        });

        Event::listen(BookingCreated::class, SendBookingCreatedNotification::class);
        Event::listen(BookingApproved::class, SendBookingApprovedNotification::class);
        Event::listen(BookingRejected::class, SendBookingRejectedNotification::class);
        Event::listen(BookingExpired::class, SendBookingExpiredNotification::class);
        Event::listen(BookingCancelled::class, SendBookingCancelledNotification::class);
        Event::listen(NotificationFailed::class, LogFailedBookingNotification::class);
        Event::listen(JobFailed::class, LogFailedQueuedNotificationJob::class);
    }
}
