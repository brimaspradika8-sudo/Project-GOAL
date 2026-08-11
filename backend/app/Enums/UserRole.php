<?php

namespace App\Enums;

enum UserRole: string
{
    case PLAYER = 'player';
    case OWNER = 'owner';
    case SUPER_ADMIN = 'super_admin';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function validationRule(): string
    {
        return 'in:' . implode(',', self::values());
    }
}
