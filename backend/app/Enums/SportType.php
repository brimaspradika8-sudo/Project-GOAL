<?php

namespace App\Enums;

class SportType
{
    public const FUTSAL = 'futsal';
    public const BADMINTON = 'badminton';
    public const BASKETBALL = 'basketball';
    public const MINI_SOCCER = 'mini_soccer';
    public const TENNIS = 'tennis';
    public const VOLLEYBALL = 'volleyball';
    public const PADEL = 'padel';
    public const OTHER = 'other';

    public static function values(): array
    {
        return [
            self::FUTSAL,
            self::BADMINTON,
            self::BASKETBALL,
            self::MINI_SOCCER,
            self::TENNIS,
            self::VOLLEYBALL,
            self::PADEL,
            self::OTHER,
        ];
    }
}