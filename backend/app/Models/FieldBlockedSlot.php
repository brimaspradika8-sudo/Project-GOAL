<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FieldBlockedSlot extends Model
{
    protected $table = 'field_blocked_slots';

    protected $fillable = [
        'field_id',
        'date',
        'start_time',
        'end_time',
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
