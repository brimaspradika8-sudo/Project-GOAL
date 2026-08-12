<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Booking extends Model
{
    protected $table = 'bookings';

    protected $fillable = [
        'user_id',
        'field_id',
        'booking_date',
        'start_time',
        'end_time',
        'duration_minutes',
        'total_price',
        'status',
        'expired_at',
        'approved_at',
        'rejected_at',
        'rejection_reason',
        'cancelled_at',
        'cancel_reason',
        'completed_at',
    ];

    protected $casts = [
        'booking_date' => 'date:Y-m-d',
        'expired_at'   => 'datetime',
        'approved_at'  => 'datetime',
        'rejected_at'  => 'datetime',
        'cancelled_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(Field::class);
    }

    /**
     * Bookings that currently lock a slot on the field
     * (statuses from config('booking.lock_statuses')).
     */
    public function scopeLockingSlot(Builder $query): Builder
    {
        return $query->whereIn('status', (array) config('booking.lock_statuses', []));
    }

    /**
     * Apply common listing filters: status, date, field_id.
     *
     * @param array{status?: string, date?: string, field_id?: int|string} $filters
     */
    public function scopeApplyFilters(Builder $query, array $filters = []): Builder
    {
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['date'])) {
            $query->where('booking_date', $filters['date']);
        }

        if (!empty($filters['field_id'])) {
            $query->where('field_id', $filters['field_id']);
        }

        return $query;
    }
}
