<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FieldHoliday extends Model
{
    protected $table = 'field_holidays';

    protected $fillable = [
        'field_id',
        'date',
        'reason',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];

    public function field(): BelongsTo
    {
        return $this->belongsTo(Field::class);
    }
}
