<?php

namespace App\Enums;

class SportType
{
    public const FUTSAL = 'futsal';
    public const BADMINTON = 'badminton';
    public const BASKETBALL = 'basketball';
    public const BASKET = 'basket';
    public const MINI_SOCCER = 'mini_soccer';
    public const TENNIS = 'tennis';
    public const TENIS = 'tenis';
    public const VOLLEYBALL = 'volleyball';
    public const VOLI = 'voli';
    public const OTHER = 'other';
    public const LAINNYA = 'lainnya';

    /**
     * Return all allowed sport type values (slugs and title cases).
     *
     * @return string[]
     */
    public static function values(): array
    {
        return [
            self::FUTSAL,
            self::BADMINTON,
            self::BASKETBALL,
            self::BASKET,
            self::MINI_SOCCER,
            self::TENNIS,
            self::TENIS,
            self::VOLLEYBALL,
            self::VOLI,
            self::OTHER,
            self::LAINNYA,
        ];
    }
}