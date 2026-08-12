<?php

namespace App\Enums;

enum SlotStatus: string
{
    case AVAILABLE = 'AVAILABLE';
    case BOOKED = 'BOOKED';
    case BUFFER = 'BUFFER';
    case CLOSED = 'CLOSED';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
