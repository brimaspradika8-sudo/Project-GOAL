<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Enums\SlotStatus;
use App\Models\Booking;
use App\Models\Field;

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
     * @param array<int, array{start: string, end: string}> $bookedRanges
     * @return array{field: Field, date: string, slots: array<int, array{start_time: string, end_time: string, price: int|null, status: string}>}
     */
    public function forDate(Field $field, string $date, array $bookedRanges = []): array
    {
        $openTime = $field->open_time ? substr((string) $field->open_time, 0, 5) : null;
        $closeTime = $field->close_time ? substr((string) $field->close_time, 0, 5) : null;
        $sessionMinutes = $field->session_duration_minutes;
        $bufferMinutes = $field->buffer_duration_minutes ?? 0;

        if (!$openTime || !$closeTime || !$sessionMinutes) {
            return [
                'field' => $field,
                'date' => $date,
                'slots' => [],
            ];
        }

        $prices = $field->relationLoaded('prices')
            ? $field->prices
            : $field->prices()->get();

        $slots = collect($this->slotGenerator->generate($openTime, $closeTime, $sessionMinutes, $bufferMinutes))
            ->map(fn (array $slot) => [
                'start_time' => $slot['start_time'],
                'end_time' => $slot['end_time'],
                'price' => $this->pricing->priceForSlot($field, $slot['start_time'], $slot['end_time'], $prices),
                'status' => $this->statusFor($slot, $field, $bookedRanges)->value,
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

        if (!$openTime || !$closeTime || $time < $openTime || $time >= $closeTime) {
            return 'CLOSED';
        }

        $activeStatuses = [
            BookingStatus::APPROVED->value,
            BookingStatus::CONFIRMED->value,
        ];

        $isPlaying = Booking::where('field_id', $field->id)
            ->where('booking_date', $date)
            ->whereIn('status', $activeStatuses)
            ->where('start_time', '<=', $time)
            ->where('end_time', '>', $time)
            ->exists();

        if ($isPlaying) {
            return 'PLAYING';
        }

        $isBooked = Booking::where('field_id', $field->id)
            ->where('booking_date', $date)
            ->whereIn('status', $activeStatuses)
            ->exists();

        return $isBooked ? 'BOOKED' : 'AVAILABLE';
    }

    /**
     * @param array{start_time: string, end_time: string} $slot
     * @param array<int, array{start: string, end: string}> $bookedRanges
     */
    private function statusFor(array $slot, Field $field, array $bookedRanges): SlotStatus
    {
        $slotStart = $this->slotGenerator->toMinutes($slot['start_time']);
        $slotEnd = $this->slotGenerator->toMinutes($slot['end_time']);

        if ($slotStart < $this->slotGenerator->toMinutes(substr((string) $field->open_time, 0, 5))
            || $slotEnd > $this->slotGenerator->toMinutes(substr((string) $field->close_time, 0, 5))) {
            return SlotStatus::CLOSED;
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
