<?php

namespace App\Enums;

enum BookingStatus: string
{
    case WAITING_CONFIRMATION = 'WAITING_CONFIRMATION';
    case REJECTED = 'REJECTED';
    case EXPIRED = 'EXPIRED';
    case CANCELLED = 'CANCELLED';
    case CONFIRMED = 'CONFIRMED';
    case COMPLETED = 'COMPLETED';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
