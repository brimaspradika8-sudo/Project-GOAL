<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FieldValidationSetting extends Model
{
    protected $fillable = [
        'max_name_length',
        'max_description_length',
        'min_price',
        'max_price',
        'max_image_mb',
    ];

    protected $casts = [
        'max_name_length'        => 'integer',
        'max_description_length' => 'integer',
        'min_price'               => 'integer',
        'max_price'               => 'integer',
        'max_image_mb'            => 'integer',
    ];

    /**
     * This table is a singleton: there is only ever one active rule set.
     * Always fetch (or lazily create, in case the seed row is ever missing)
     * the row with id = 1.
     */
    public static function current(): self
    {
        return static::firstOrCreate(
            ['id' => 1],
            [
                'max_name_length'        => 50,
                'max_description_length' => 1000,
                'min_price'               => 10000,
                'max_price'               => 5000000,
                'max_image_mb'            => 2,
            ]
        );
    }
}
