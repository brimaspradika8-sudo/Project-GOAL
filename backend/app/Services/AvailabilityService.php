<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Enums\SlotStatus;
use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\Field;
use App\Models\FieldBlockedSlot;
use App\Models\FieldHoliday;
use App\Models\FieldSchedule;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AvailabilityService
{
    public function __construct(
        private SlotGeneratorService $slotGenerator,
        private PricingService $pricing,
    ) {}

    /**
     * Build the availability for a field on a given date.
     *
     * Statuses are computed dynamically from booked ranges; nothing is
     * persisted. bookedRanges is empty until booking exists (Sprint 3).
     *
     * @param  array<int, array{start: string, end: string}>  $bookedRanges
     * @return array{field: Field, date: string, slots: array<int, array{start_time: string, end_time: string, price: int|null, status: string}>}
     */
    public function forDate(Field $field, string $date, array $bookedRanges = []): array
    {
        $openTime = $field->open_time ? substr((string) $field->open_time, 0, 5) : null;
        $closeTime = $field->close_time ? substr((string) $field->close_time, 0, 5) : null;
        $sessionMinutes = $field->session_duration_minutes;
        $bufferMinutes = $field->buffer_duration_minutes ?? 0;

        if (! $openTime || ! $closeTime || ! $sessionMinutes) {
            return [
                'field' => $field,
                'date' => $date,
                'slots' => [],
            ];
        }

        $prices = $field->relationLoaded('prices')
            ? $field->prices
            : $field->prices()->get();

        $isToday = $date === now()->toDateString();
        $currentTime = now()->format('H:i');

        // Check if the entire date is closed
        $isHoliday = FieldHoliday::where('field_id', $field->id)->where('date', $date)->exists();
        $dayOfWeek = Carbon::parse($date)->dayOfWeek;
        $daySchedule = FieldSchedule::where('field_id', $field->id)->where('day_of_week', $dayOfWeek)->first();
        $isClosedDay = $daySchedule && $daySchedule->is_closed;

        // Pre-fetch blocked slots for this date
        $blockedRanges = FieldBlockedSlot::where('field_id', $field->id)
            ->where('date', $date)
            ->get(['start_time', 'end_time'])
            ->map(fn ($b) => [
                'start' => $this->normalizeTime((string) $b->start_time),
                'end' => $this->normalizeTime((string) $b->end_time),
            ])
            ->all();

        $slots = collect($this->slotGenerator->generate($openTime, $closeTime, $sessionMinutes, $bufferMinutes))
            ->map(fn (array $slot) => [
                'start_time' => $slot['start_time'],
                'end_time' => $slot['end_time'],
                'price' => $this->pricing->priceForSlot($field, $slot['start_time'], $slot['end_time'], $prices),
                'status' => $this->statusFor($slot, $field, $bookedRanges, $isToday, $currentTime, $isHoliday || $isClosedDay, $blockedRanges)->value,
            ])
            ->values()
            ->all();

        return [
            'field' => $field,
            'date' => $date,
            'slots' => $slots,
        ];
    }

    /**
     * Determine live field status without persisting it.
     *
     * @return string AVAILABLE|BOOKED|PLAYING|CLOSED
     */
    public function liveFieldStatus(Field $field, ?string $date = null, ?string $time = null): string
    {
        $date = $date ?? now()->toDateString();
        $time = $this->normalizeTime($time ?? now()->format('H:i'));

        $openTime = $field->open_time ? substr((string) $field->open_time, 0, 5) : null;
        $closeTime = $field->close_time ? substr((string) $field->close_time, 0, 5) : null;

        if (! $openTime || ! $closeTime || $time < $openTime || $time >= $closeTime) {
            return 'CLOSED';
        }

        $activeStatuses = [
            BookingStatus::CONFIRMED->value,
        ];

        try {
            $isPlaying = BookingSlot::whereHas('booking', function ($q) use ($field, $date, $activeStatuses) {
                $q->where('field_id', $field->id)
                    ->where('booking_date', $date)
                    ->whereIn('status', $activeStatuses);
            })
            ->where('start_time', '<=', $time)
            ->where('end_time', '>', $time)
            ->exists();

            if ($isPlaying) {
                return 'PLAYING';
            }

            $isBooked = BookingSlot::whereHas('booking', function ($q) use ($field, $date) {
                $q->where('field_id', $field->id)
                    ->where('booking_date', $date)
                    ->whereIn('status', (array) config('booking.lock_statuses', []));
            })
            ->exists();
        } catch (\Exception $e) {
            // Fallback: query langsung ke tabel bookings jika booking_slots belum di-migrate
            $isPlaying = Booking::where('field_id', $field->id)
                ->where('booking_date', $date)
                ->whereIn('status', $activeStatuses)
                ->where('start_time', '<=', $time)
                ->where('end_time', '>', $time)
                ->exists();

            if ($isPlaying) {
                return 'PLAYING';
            }

            $lockStatuses = array_map(
                fn ($s) => $s instanceof BookingStatus ? $s->value : $s,
                (array) config('booking.lock_statuses', [
                    BookingStatus::WAITING_CONFIRMATION->value,
                    BookingStatus::CONFIRMED->value,
                ])
            );

            $isBooked = Booking::where('field_id', $field->id)
                ->where('booking_date', $date)
                ->whereIn('status', $lockStatuses)
                ->exists();
        }

        return $isBooked ? 'BOOKED' : 'AVAILABLE';
    }

    /**
     * @param  array{start_time: string, end_time: string}  $slot
     * @param  array<int, array{start: string, end: string}>  $bookedRanges
     * @param  array<int, array{start: string, end: string}>  $blockedRanges
     */
    private function statusFor(array $slot, Field $field, array $bookedRanges, bool $isToday = false, string $currentTime = '', bool $isFullyClosed = false, array $blockedRanges = []): SlotStatus
    {
        $slotStart = $this->slotGenerator->toMinutes($slot['start_time']);
        $slotEnd = $this->slotGenerator->toMinutes($slot['end_time']);

        if ($isFullyClosed) {
            return SlotStatus::CLOSED;
        }

        if ($slotStart < $this->slotGenerator->toMinutes(substr((string) $field->open_time, 0, 5))
            || $slotEnd > $this->slotGenerator->toMinutes(substr((string) $field->close_time, 0, 5))) {
            return SlotStatus::CLOSED;
        }

        if ($isToday && $currentTime && $slotEnd <= $this->slotGenerator->toMinutes($currentTime)) {
            return SlotStatus::CLOSED;
        }

        foreach ($blockedRanges as $range) {
            $blockedStart = $this->slotGenerator->toMinutes($range['start']);
            $blockedEnd = $this->slotGenerator->toMinutes($range['end']);

            if ($slotStart < $blockedEnd && $slotEnd > $blockedStart) {
                return SlotStatus::CLOSED;
            }
        }

        $bufferMinutes = $field->buffer_duration_minutes ?? 0;

        foreach ($bookedRanges as $range) {
            $bookedStart = $this->slotGenerator->toMinutes($range['start']);
            $bookedEnd = $this->slotGenerator->toMinutes($range['end']);

            if ($slotStart < $bookedEnd && $slotEnd > $bookedStart) {
                return SlotStatus::BOOKED;
            }
        }

        foreach ($bookedRanges as $range) {
            $bookedEnd = $this->slotGenerator->toMinutes($range['end']);

            $bufferStart = $bookedEnd;
            $bufferEnd = $bookedEnd + $bufferMinutes;

            if ($slotStart < $bufferEnd && $slotEnd > $bufferStart) {
                return SlotStatus::BUFFER;
            }
        }

        return SlotStatus::AVAILABLE;
    }

    private function normalizeTime(string $time): string
    {
        return strlen($time) === 5 ? $time : substr($time, 0, 5);
    }
}
