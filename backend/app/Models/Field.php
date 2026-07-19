<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Field extends Model
{
    use SoftDeletes;
    protected $table = 'fields';
    protected $fillable = [
        'owner_id',
        'name',
        'sport_type',
        'location',
        'description',
        'price_per_hour',
        'image_url',
        'status',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'price_per_hour' => 'integer',
        'approved_at'    => 'datetime',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}
