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
<<<<<<< HEAD
     * Return all allowed sport type values (slugs and title cases).
=======
     * Return all allowed sport type values.
>>>>>>> aff232dc93cf2184e6d170adfe3b9a684f69fe38
     *
     * @return string[]
     */
    public static function values(): array
    {
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
    }
}