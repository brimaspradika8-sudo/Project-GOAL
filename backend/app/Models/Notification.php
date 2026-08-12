<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    public const TYPE_FIELD_APPROVED        = 'field_approved';
    public const TYPE_FIELD_REJECTED        = 'field_rejected';
    public const TYPE_OWNER_REQUEST_APPROVED = 'owner_request_approved';
    public const TYPE_OWNER_REQUEST_REJECTED = 'owner_request_rejected';
    public const TYPE_FIELD_SUBMITTED       = 'field_submitted';
    public const TYPE_OWNER_REQUEST_SUBMITTED = 'owner_request_submitted';
    public const TYPE_FIELD_UPDATED         = 'field_updated';
    public const TYPE_FIELD_DELETED         = 'field_deleted';
    public const TYPE_ROLE_CHANGED          = 'role_changed';
    public const TYPE_BOOKING_REQUESTED     = 'booking_requested';
    public const TYPE_BOOKING_APPROVED      = 'booking_approved';
    public const TYPE_BOOKING_REJECTED      = 'booking_rejected';
    public const TYPE_BOOKING_CANCELLED     = 'booking_cancelled';
    public const TYPE_BOOKING_EXPIRED       = 'booking_expired';

    protected $table = 'notifications';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'notifiable_type',
        'notifiable_id',
        'user_id',
        'type',
        'title',
        'body',
        'data',
        'read_at',
    ];

    protected $casts = [
        'data'    => 'array',
        'read_at' => 'datetime',
    ];

    protected $appends = ['read'];

    public function getReadAttribute(): bool
    {
        return $this->read_at !== null;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
