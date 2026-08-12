<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Exceptions\BookingConflictException;
use App\Jobs\BookingExpirationJob;
use App\Models\Booking;
use App\Models\Field;
use App\Models\Notification;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingService
{
    public function __construct(
        private SlotGeneratorService $slotGenerator,
        private PricingService $pricing,
        private NotificationService $notifications,
    ) {}

    public function create(User $user, array $data): Booking
    {
        $field = Field::approved()->with('owner:id,name')->find($data['field_id']);

        if (!$field) {
            throw ValidationException::withMessages([
                'field_id' => 'Lapangan tidak ditemukan atau belum disetujui.',
            ]);
        }

        $slots = $this->normalizeSlots($data['slots']);
        $this->validateSlotsAgainstSchedule($field, $slots);
        $this->assertSlotsContiguous($slots);

        $startTime = $slots[0]['start_time'];
        $endTime = $slots[count($slots) - 1]['end_time'];

        $this->assertNoConflict($field->id, $data['booking_date'], $startTime, $endTime);

        $duration = $this->slotGenerator->toMinutes($endTime) - $this->slotGenerator->toMinutes($startTime);
        $totalPrice = collect($slots)->sum(fn (array $slot) => $this->pricing->priceForSlot(
            $field,
            $slot['start_time'],
            $slot['end_time']
        ));

        if ($totalPrice <= 0) {
            throw ValidationException::withMessages([
                'slots' => 'Harga tidak tersedia untuk slot yang dipilih.',
            ]);
        }

        $expiresAt = now()->addMinutes((int) config('booking.expiration_minutes', 15));

        $booking = DB::transaction(function () use ($user, $field, $data, $startTime, $endTime, $duration, $totalPrice, $expiresAt) {
            $booking = Booking::create([
                'user_id'          => $user->id,
                'field_id'         => $field->id,
                'booking_date'     => $data['booking_date'],
                'start_time'       => $startTime,
                'end_time'         => $endTime,
                'duration_minutes' => $duration,
                'total_price'      => $totalPrice,
                'status'           => BookingStatus::WAITING_OWNER_APPROVAL->value,
                'expired_at'       => $expiresAt,
            ]);

            BookingExpirationJob::dispatch($booking->id)->delay($expiresAt);

            if ($field->owner) {
                $this->notifications->create(
                    $field->owner,
                    Notification::TYPE_BOOKING_REQUESTED,
                    'Permintaan Booking Baru',
                    "Booking baru untuk {$field->name} pada {$booking->booking_date->format('Y-m-d')} pukul {$startTime}-{$endTime}.",
                    [
                        'booking_id'   => $booking->id,
                        'field_id'     => $field->id,
                        'field_name'   => $field->name,
                        'total_price'  => $totalPrice,
                    ]
                );
            }

            return $booking;
        });

        return $booking->load(['field:id,name,sport_type,location,image_url,price_per_hour,owner_id', 'user:id,name']);
    }

    public function cancel(User $user, int $id, ?string $reason): Booking
    {
        $booking = Booking::with('field:id,name,owner_id')->find($id);

        if (!$booking || $booking->user_id !== $user->id) {
            throw ValidationException::withMessages(['id' => 'Booking tidak ditemukan.']);
        }

        if (!in_array($booking->status, [
            BookingStatus::WAITING_OWNER_APPROVAL->value,
            BookingStatus::APPROVED->value,
        ], true)) {
            throw ValidationException::withMessages([
                'status' => 'Booking tidak dapat dibatalkan pada status ' . $booking->status . '.',
            ]);
        }

        $booking->update([
            'status'        => BookingStatus::CANCELLED->value,
            'cancelled_at'  => now(),
            'cancel_reason' => $reason,
        ]);

        $fieldOwner = $booking->field?->owner;
        if ($fieldOwner) {
            $this->notifications->create(
                $fieldOwner,
                Notification::TYPE_BOOKING_CANCELLED,
                'Booking Dibatalkan',
                "Booking untuk {$booking->field->name} pada {$booking->booking_date->format('Y-m-d')} pukul {$booking->start_time}-{$booking->end_time} dibatalkan." . ($reason ? " Alasan: {$reason}" : ''),
                ['booking_id' => $booking->id, 'field_id' => $booking->field_id]
            );
        }

        return $booking->load(['field:id,name,sport_type,location,image_url,price_per_hour,owner_id', 'user:id,name']);
    }

    public function forUser(User $user, int $page = 1): LengthAwarePaginator
    {
        return Booking::with(['field:id,name,sport_type,location,image_url,price_per_hour,owner_id', 'user:id,name'])
            ->where('user_id', $user->id)
            ->latest()
            ->paginate(10, ['*'], 'page', $page);
    }

    public function findForUser(User $user, int $id): ?Booking
    {
        return Booking::with(['field:id,name,sport_type,location,image_url,price_per_hour,owner_id', 'user:id,name'])
            ->where('user_id', $user->id)
            ->find($id);
    }

    public function ownerBookings(User $owner, int $page = 1): LengthAwarePaginator
    {
        $query = Booking::with(['field:id,name,sport_type,location,image_url,price_per_hour,owner_id', 'user:id,name'])
            ->whereHas('field', fn ($q) => $q->where('owner_id', $owner->id))
            ->latest();

        if ($owner->profile?->role === Profile::ROLE_SUPER_ADMIN) {
            $query = Booking::with(['field:id,name,sport_type,location,image_url,price_per_hour,owner_id', 'user:id,name'])
                ->latest();
        }

        return $query->paginate(10, ['*'], 'page', $page);
    }

    public function ownerFieldBookings(User $owner, int $fieldId, int $page = 1): LengthAwarePaginator
    {
        $query = Booking::with(['field:id,name,sport_type,location,image_url,price_per_hour,owner_id', 'user:id,name'])
            ->where('field_id', $fieldId)
            ->whereHas('field', fn ($q) => $q->where('owner_id', $owner->id))
            ->latest();

        if ($owner->profile?->role === Profile::ROLE_SUPER_ADMIN) {
            $query = Booking::with(['field:id,name,sport_type,location,image_url,price_per_hour,owner_id', 'user:id,name'])
                ->where('field_id', $fieldId)
                ->latest();
        }

        return $query->paginate(10, ['*'], 'page', $page);
    }

    /**
     * Ranges already locked (statuses in lock_statuses) for a field+date.
     *
     * @return array<int, array{start: string, end: string}>
     */
    public function bookedRangesForDate(int $fieldId, string $date): array
    {
        return Booking::lockingSlot()
            ->where('field_id', $fieldId)
            ->where('booking_date', $date)
            ->get(['start_time', 'end_time'])
            ->map(fn (Booking $b) => [
                'start' => substr((string) $b->start_time, 0, 5),
                'end'   => substr((string) $b->end_time, 0, 5),
            ])
            ->values()
            ->all();
    }

    public function isViewableBy(User $user, Booking $booking): bool
    {
        if ($booking->user_id === $user->id) {
            return true;
        }

        if ($user->profile?->role === Profile::ROLE_SUPER_ADMIN) {
            return true;
        }

        return $booking->field?->owner_id === $user->id;
    }

    /**
     * @param array<int, array{start_time: string, end_time: string}> $slots
     * @return array<int, array{start_time: string, end_time: string}>
     */
    private function normalizeSlots(array $slots): array
    {
        return collect($slots)
            ->map(fn (array $slot) => [
                'start_time' => $this->normalizeTime($slot['start_time']),
                'end_time'   => $this->normalizeTime($slot['end_time']),
            ])
            ->sortBy('start_time')
            ->values()
            ->all();
    }

    private function normalizeTime(string $time): string
    {
        $time = trim($time);

        return strlen($time) === 5 ? $time : substr($time, 0, 5);
    }

    /**
     * Every selected slot must match one of the field's generated bookable
     * slots (same boundaries), and must fall inside operating hours.
     *
     * @param array<int, array{start_time: string, end_time: string}> $slots
     */
    private function validateSlotsAgainstSchedule(Field $field, array $slots): void
    {
        $openTime = $field->open_time ? substr((string) $field->open_time, 0, 5) : null;
        $closeTime = $field->close_time ? substr((string) $field->close_time, 0, 5) : null;

        if (!$openTime || !$closeTime || !$field->session_duration_minutes) {
            throw ValidationException::withMessages([
                'slots' => 'Lapangan belum memiliki jadwal operasional.',
            ]);
        }

        $valid = collect($this->slotGenerator->generate(
            $openTime,
            $closeTime,
            (int) $field->session_duration_minutes,
            (int) ($field->buffer_duration_minutes ?? 0)
        ))->mapWithKeys(fn (array $slot) => [
            $slot['start_time'] => $slot['end_time'],
        ]);

        foreach ($slots as $slot) {
            $expectedEnd = $valid[$slot['start_time']] ?? null;
            if ($expectedEnd === null || $expectedEnd !== $slot['end_time']) {
                throw ValidationException::withMessages([
                    'slots' => 'Slot ' . $slot['start_time'] . '-' . $slot['end_time'] . ' tidak tersedia pada jadwal lapangan.',
                ]);
            }
        }
    }

    /**
     * Selected slots must be consecutive (each starts where the previous ends)
     * so they form a single continuous booking.
     *
     * @param array<int, array{start_time: string, end_time: string}> $slots
     */
    private function assertSlotsContiguous(array $slots): void
    {
        $start = $slots[0]['start_time'];
        $end = $slots[0]['end_time'];

        foreach (array_slice($slots, 1) as $slot) {
            if ($slot['start_time'] !== $end) {
                throw ValidationException::withMessages([
                    'slots' => 'Slot yang dipilih harus berurutan tanpa jeda.',
                ]);
            }
            $end = $slot['end_time'];
        }

        if ($start === $end) {
            throw ValidationException::withMessages([
                'slots' => 'Slot tidak valid.',
            ]);
        }
    }

    private function assertNoConflict(int $fieldId, string $date, string $startTime, string $endTime): void
    {
        $overlap = Booking::lockingSlot()
            ->where('field_id', $fieldId)
            ->where('booking_date', $date)
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime)
            ->exists();

        if ($overlap) {
            throw new BookingConflictException();
        }
    }
}

