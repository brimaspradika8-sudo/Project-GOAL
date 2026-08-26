<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Booking extends Model
{
    protected $table = 'bookings';

    protected static function booted()
    {
        static::saved(function (Booking $booking) {
            if ($booking->start_time && $booking->end_time && $booking->slots()->count() === 0) {
                $booking->slots()->create([
                    'start_time' => $booking->start_time,
                    'end_time' => $booking->end_time,
                ]);
            }
        });
    }

    protected $fillable = [
        'user_id',
        'field_id',
        'booking_date',
        'start_time',
        'end_time',
        'duration_minutes',
        'total_price',
        'payment_method',
        'status',
        'expired_at',
        'payment_expired_at',
        'approved_at',
        'rejected_at',
        'rejection_reason',
        'cancelled_at',
        'cancel_reason',
        'confirmed_at',
        'confirmed_by',
        'completed_at',
    ];

    protected $casts = [
        'booking_date'      => 'date:Y-m-d',
        'expired_at'        => 'datetime',
        'payment_expired_at'=> 'datetime',
        'approved_at'       => 'datetime',
        'rejected_at'       => 'datetime',
        'cancelled_at'      => 'datetime',
        'confirmed_at'      => 'datetime',
        'completed_at'      => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(Field::class);
    }

    public function slots(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(BookingSlot::class, 'booking_id');
    }

    public function confirmer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    /**
     * Bookings that currently lock a slot on the field
     * (statuses from config('booking.lock_statuses')).
     */
    public function scopeLockingSlot(Builder $query): Builder
    {
        return $query->whereIn('status', (array) config('booking.lock_statuses', []))
            ->where(function ($q) {
                $q->where('status', '!=', \App\Enums\BookingStatus::WAITING_CONFIRMATION->value)
                  ->orWhere(function ($sub) {
                      $sub->where(function ($p) {
                          $p->whereNull('payment_expired_at')->orWhere('payment_expired_at', '>', now());
                      })->where(function ($e) {
                          $e->whereNull('expired_at')->orWhere('expired_at', '>', now());
                      });
                  });
            });
    }

    /**
     * Get calculated unique booking code (e.g. GL-20260826-0017)
     */
    public function getBookingCodeAttribute(): string
    {
        $dateStr = $this->booking_date ? $this->booking_date->format('Ymd') : date('Ymd');
        return sprintf('GL-%s-%04d', $dateStr, $this->id);
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
