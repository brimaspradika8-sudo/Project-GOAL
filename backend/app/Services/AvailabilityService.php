<?php

namespace App\Services;

use App\Enums\SlotStatus;
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
}
