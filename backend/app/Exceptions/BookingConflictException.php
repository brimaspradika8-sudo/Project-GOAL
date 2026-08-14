<?php

namespace App\Exceptions;

use RuntimeException;

class BookingConflictException extends RuntimeException
{
    public function __construct(string $message = 'Slot sudah dibooking', int $code = 409)
    {
        parent::__construct($message, $code);
    }
}
