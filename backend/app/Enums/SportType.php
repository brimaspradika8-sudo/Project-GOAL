<?php

namespace App\Enums;

class SportType
{
<<<<<<< HEAD
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
=======
    public const FUTSAL = 'Futsal';
    public const BADMINTON = 'Badminton';
    public const BASKET = 'Basket';
    public const MINI_SOCCER = 'Mini Soccer';
    public const TENIS = 'Tenis';
    public const VOLI = 'Voli';
    public const LAINNYA = 'Lainnya';

    /**
     * Return all allowed sport type values from config.
>>>>>>> 80644d4 (fix backend)
     *
     * @return string[]
     */
    public static function values(): array
    {
<<<<<<< HEAD
        return [
            'futsal',
            'badminton',
            'basketball',
            'basket',
            'mini_soccer',
            'tennis',
            'tenis',
            'volleyball',
            'voli',
            'other',
            'lainnya',
            'Futsal',
            'Badminton',
            'Basket',
            'Mini Soccer',
            'Tenis',
            'Voli',
            'Lainnya',
        ];
=======
        return config('goal.sport_types', []);
>>>>>>> 80644d4 (fix backend)
    }
}
