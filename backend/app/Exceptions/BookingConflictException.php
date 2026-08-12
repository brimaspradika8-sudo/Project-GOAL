<?php

namespace App\Exceptions;

use RuntimeException;

class BookingConflictException extends RuntimeException
{
    public function __construct(string $message = 'Slot sudah dibooking pada waktu tersebut.', int $code = 409)
    {
        parent::__construct($message, $code);
    }
}
