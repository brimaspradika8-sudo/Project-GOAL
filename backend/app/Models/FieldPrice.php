<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FieldPrice extends Model
{
    protected $fillable = [
        'field_id',
        'start_time',
        'end_time',
        'price',
    ];

    protected $casts = [
        'price' => 'integer',
    ];

    public function field(): BelongsTo
    {
        return $this->belongsTo(Field::class);
    }
}
