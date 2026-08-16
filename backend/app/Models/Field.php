<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Field extends Model
{
    use SoftDeletes;

    protected static function booted()
    {
        static::saved(function (Field $field) {
            if ($field->image_url) {
                $primary = $field->images()->where('is_primary', true)->first();
                if (!$primary) {
                    $field->images()->create([
                        'image_path' => $field->image_url,
                        'is_primary' => true,
                    ]);
                } else if ($primary->image_path !== $field->image_url) {
                    $primary->update(['image_path' => $field->image_url]);
                }
            }
        });
    }

    protected $table = 'fields';

    protected $fillable = [
        'owner_id',
        'name',
        'sport_type',
        'location',
        'description',
        'price_per_hour',
        'open_time',
        'close_time',
        'session_duration_minutes',
        'buffer_duration_minutes',
        'image_url',
    ];

    protected $hidden = [
        'rejection_reason',
        'approved_by',
    ];

    protected $casts = [
        'price_per_hour' => 'integer',
        'approved_at' => 'datetime',
        'session_duration_minutes' => 'integer',
        'buffer_duration_minutes' => 'integer',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function prices(): HasMany
    {
        return $this->hasMany(FieldPrice::class)->orderBy('start_time');
    }

    public function images(): HasMany
    {
        return $this->hasMany(FieldImage::class)->orderByDesc('is_primary')->orderBy('id');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(FieldSchedule::class)->orderBy('day_of_week');
    }

    public function holidays(): HasMany
    {
        return $this->hasMany(FieldHoliday::class)->orderBy('date');
    }

    public function blockedSlots(): HasMany
    {
        return $this->hasMany(FieldBlockedSlot::class)->orderBy('date')->orderBy('start_time');
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
