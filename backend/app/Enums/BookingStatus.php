<?php

namespace App\Enums;

enum BookingStatus: string
{
    case WAITING_OWNER_APPROVAL = 'WAITING_OWNER_APPROVAL';
    case APPROVED = 'APPROVED';
    case REJECTED = 'REJECTED';
    case EXPIRED = 'EXPIRED';
    case CANCELLED = 'CANCELLED';
    case COMPLETED = 'COMPLETED';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
