<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Events\BookingApproved;
use App\Events\BookingCancelled;
use App\Events\BookingCompleted;
use App\Events\BookingExpired;
use App\Events\BookingRejected;
use App\Exceptions\InvalidBookingStatusTransitionException;
use App\Models\Booking;
use Illuminate\Support\Facades\Log;

class BookingStatusService
{
    private const TRANSITIONS = [
        BookingStatus::WAITING_CONFIRMATION->value => [
            BookingStatus::CONFIRMED->value,
            BookingStatus::REJECTED->value,
            BookingStatus::EXPIRED->value,
            BookingStatus::CANCELLED->value,
        ],
        BookingStatus::CONFIRMED->value => [
            BookingStatus::COMPLETED->value,
        ],
        BookingStatus::REJECTED->value => [],
        BookingStatus::EXPIRED->value => [],
        BookingStatus::CANCELLED->value => [],
        BookingStatus::COMPLETED->value => [],
    ];

    public function transition(Booking $booking, BookingStatus $newStatus, array $attributes = []): Booking
    {
        $oldStatus = (string) $booking->status;

        if (!$this->canTransition($oldStatus, $newStatus->value)) {
            throw new InvalidBookingStatusTransitionException("Invalid booking status transition from {$oldStatus} to {$newStatus->value}");
        }

        $booking->forceFill(array_merge($attributes, [
            'status' => $newStatus->value,
        ]))->save();

        Log::info('Booking status changed', [
            'booking_id' => $booking->id,
            'old_status' => $oldStatus,
            'new_status' => $newStatus->value,
        ]);

        $booking = $booking->fresh(['field.owner', 'user']);
        $this->dispatchStatusEvent($booking, $oldStatus, $newStatus);

        return $booking;
    }

    public function canTransition(string $oldStatus, string $newStatus): bool
    {
        return in_array($newStatus, self::TRANSITIONS[$oldStatus] ?? [], true);
    }

    private function dispatchStatusEvent(Booking $booking, string $oldStatus, BookingStatus $newStatus): void
    {
        if ($oldStatus === BookingStatus::WAITING_CONFIRMATION->value && $newStatus === BookingStatus::CONFIRMED) {
            event(new BookingApproved($booking));
            return;
        }

        if ($oldStatus === BookingStatus::WAITING_CONFIRMATION->value && $newStatus === BookingStatus::REJECTED) {
            event(new BookingRejected($booking));
            return;
        }

        if ($oldStatus === BookingStatus::WAITING_CONFIRMATION->value && $newStatus === BookingStatus::EXPIRED) {
            event(new BookingExpired($booking));
            return;
        }

        if ($oldStatus === BookingStatus::WAITING_CONFIRMATION->value && $newStatus === BookingStatus::CANCELLED) {
            event(new BookingCancelled($booking));
            return;
        }

        if ($oldStatus === BookingStatus::CONFIRMED->value && $newStatus === BookingStatus::COMPLETED) {
            event(new BookingCompleted($booking));
        }
    }
}
