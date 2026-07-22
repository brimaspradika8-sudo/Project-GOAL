<?php

namespace App\Enums;

class SportType
{
    public const FUTSAL = 'Futsal';
    public const BADMINTON = 'Badminton';
    public const BASKET = 'Basket';
    public const MINI_SOCCER = 'Mini Soccer';
    public const TENIS = 'Tenis';

    /**
     * Return all allowed sport type values.
     *
     * @return string[]
     */
    public static function values(): array
    {
        return [
            self::FUTSAL,
            self::BADMINTON,
            self::BASKET,
            self::MINI_SOCCER,
            self::TENIS,
        ];
    }
}
