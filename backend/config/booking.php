<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Booking expiration window (minutes)
    |--------------------------------------------------------------------------
    |
    | WAITING_OWNER_APPROVAL bookings expire after this many minutes.
    | The BookingExpirationJob checks this window.
    |
    */

    'expiration_minutes' => (int) env('BOOKING_EXPIRATION_MINUTES', 15),

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
        'WAITING_OWNER_APPROVAL',
        'APPROVED',
        'CONFIRMED', // future
    ],
];
