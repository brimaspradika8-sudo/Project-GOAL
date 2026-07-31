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

    protected $table = 'notifications';

    protected $fillable = [
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

    public function isRead(): bool
    {
        return $this->read_at !== null;
    }
}
