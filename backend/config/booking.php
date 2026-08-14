<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Auto-cancel window before slot start (minutes)
    |--------------------------------------------------------------------------
    |
    | A WAITING_CONFIRMATION booking is cancelled automatically this many
    | minutes before the slot starts. The AutoCancelBooking job checks it.
    |
    */

    'auto_cancel_minutes_before' => (int) env('BOOKING_AUTO_CANCEL_MINUTES_BEFORE', 30),

    /*
    |--------------------------------------------------------------------------
    | Booking statuses that lock a slot
    |--------------------------------------------------------------------------
    |
    | Slots covered by a booking with any of these statuses are considered
    | unavailable when creating a new booking or rendering availability.
    |
    */

    'lock_statuses' => [
        'WAITING_CONFIRMATION',
        'CONFIRMED',
    ],
];
