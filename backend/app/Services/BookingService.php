<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Events\BookingCreated;
use App\Exceptions\BookingAlreadyExpiredException;
use App\Exceptions\BookingAlreadyProcessedException;
use App\Exceptions\BookingCannotBeCancelledException;
use App\Exceptions\BookingConflictException;
use App\Exceptions\InvalidBookingStatusException;
use App\Exceptions\InvalidBookingStatusTransitionException;
use App\Exceptions\UnauthorizedBookingActionException;
use App\Jobs\BookingExpirationJob;
use App\Models\Booking;
use App\Models\BookingSlot;
use App\Models\Field;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class BookingService
{
    public function __construct(
        private SlotGeneratorService $slotGenerator,
        private PricingService $pricing,
        private BookingStatusService $statusService,
    ) {}

    public function create(User $user, array $data): Booking
    {
        $field = Field::approved()->with('owner:id,name')->find($data['field_id']);

        if (! $field) {
            throw ValidationException::withMessages([
                'field_id' => 'Lapangan tidak ditemukan atau belum disetujui.',
            ]);
        }

        $slots = $this->normalizeSlots($data['slots'], $field);
        $this->validateSlotsAgainstSchedule($field, $slots);
        $this->assertSlotsContiguous($field, $slots);

        $startTime = $slots[0]['start_time'];
        $endTime = $slots[count($slots) - 1]['end_time'];

        $bookingDate = $data['booking_date'] ?? $data['date'];

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

        $booking = DB::transaction(function () use ($user, $field, $data, $bookingDate, $startTime, $endTime, $duration, $totalPrice, $expiresAt, $slots) {
            Field::whereKey($field->id)->lockForUpdate()->first();

            $this->assertNoConflict($field->id, $bookingDate, $slots);

            $booking = Booking::create([
                'user_id' => $user->id,
                'field_id' => $field->id,
                'booking_date' => $bookingDate,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'duration_minutes' => $duration,
                'total_price' => $totalPrice,
                'payment_method' => $data['payment_method'] ?? 'cash',
                'status' => BookingStatus::WAITING_CONFIRMATION->value,
                'expired_at' => $expiresAt,
            ]);

            BookingExpirationJob::dispatch($booking->id)->delay($expiresAt);

            event(new BookingCreated($booking->load(['field.owner', 'user', 'slots'])));

            return $booking;
        });

        return $booking->load(['field:id,name,sport_type,location,image_url,price_per_hour,owner_id', 'user:id,name', 'slots']);
    }

    public function cancel(User $user, int $id, ?string $reason): Booking
    {
        $booking = Booking::with('field:id,name,owner_id')->find($id);

        if (! $booking) {
            throw (new ModelNotFoundException)->setModel(Booking::class, $id);
        }

        if ($booking->user_id !== $user->id) {
            throw new AuthorizationException('You do not have permission');
        }

        if ($booking->status !== BookingStatus::WAITING_CONFIRMATION->value) {
            throw new BookingCannotBeCancelledException('Booking cannot be cancelled');
        }

        $booking = $this->statusService->transition($booking, BookingStatus::CANCELLED, [
            'cancelled_at' => now(),
            'cancel_reason' => $reason,
        ]);

        $this->logSecurityAction($user, 'booking.cancelled', $booking->id, [
            'reason' => $reason,
        ]);

        return $booking->load(['field:id,name,sport_type,location,image_url,price_per_hour,owner_id', 'user:id,name']);
    }

    public function forUser(User $user, int $page = 1): LengthAwarePaginator
    {
        return Booking::with(['field:id,name,sport_type,location,image_url,price_per_hour,owner_id', 'user:id,name'])
            ->where('user_id', $user->id)
            ->latest()
            ->paginate(10, ['*'], 'page', $page);
    }

    /**
     * @param  array{status?: string, date?: string, tanggal?: string}  $filters
     */
    public function getUserBookingHistory(User $user, array $filters = [], int $page = 1): LengthAwarePaginator
    {
        $filters = $this->normalizeBookingFilters($filters);

        return Booking::with(['field:id,name,sport_type,location,image_url,price_per_hour,owner_id', 'user:id,name'])
            ->where('user_id', $user->id)
            ->applyFilters($filters)
            ->latest()
            ->paginate(10, ['*'], 'page', $page);
    }

    public function findForUser(User $user, int $id): ?Booking
    {
        return Booking::with(['field:id,name,sport_type,location,image_url,price_per_hour,owner_id', 'user:id,name'])
            ->where('user_id', $user->id)
            ->find($id);
    }

    public function ownerBookings(User $owner, array $filters = [], int $page = 1): LengthAwarePaginator
    {
        $filters = $this->normalizeBookingFilters($filters);
        $query = Booking::with(['field:id,name,sport_type,location,image_url,price_per_hour,owner_id', 'user:id,name']);

        $role = $owner->profile?->role;
        if ($role !== Profile::ROLE_OWNER && $role !== Profile::ROLE_SUPER_ADMIN) {
            throw new AuthorizationException('You do not have permission');
        }

        $isAdmin = $owner->profile?->role === Profile::ROLE_SUPER_ADMIN;

        if (! $isAdmin) {
            if (! empty($filters['field_id']) && ! $this->ownerOwnsField($owner, (int) $filters['field_id'])) {
                $this->logSecurityAction($owner, 'unauthorized_attempt', (int) $filters['field_id'], [
                    'resource_type' => 'field',
                    'attempted_action' => 'owner.bookings.filter',
                ]);

                throw new AuthorizationException('You do not have permission');
            }

            $query->whereHas('field', fn ($q) => $q->where('owner_id', $owner->id));
        }

        $query->applyFilters($filters)
            ->latest();

        $this->logSecurityAction($owner, 'owner.bookings.accessed', null, [
            'is_admin' => $isAdmin,
            'filters' => $filters,
        ]);

        return $query->paginate(10, ['*'], 'page', $page);
    }

    public function ownerFieldBookings(User $owner, int $fieldId, array $filters = [], int $page = 1): LengthAwarePaginator
    {
        $filters = $this->normalizeBookingFilters($filters);
        $query = Booking::with(['field:id,name,sport_type,location,image_url,price_per_hour,owner_id', 'user:id,name'])
            ->where('field_id', $fieldId);

        $role = $owner->profile?->role;
        if ($role !== Profile::ROLE_OWNER && $role !== Profile::ROLE_SUPER_ADMIN) {
            throw new AuthorizationException('You do not have permission');
        }

        if ($owner->profile?->role !== Profile::ROLE_SUPER_ADMIN) {
            $query->whereHas('field', fn ($q) => $q->where('owner_id', $owner->id));
        }

        $query->applyFilters($filters)
            ->latest();

        return $query->paginate(10, ['*'], 'page', $page);
    }

    /**
     * Super admin sees all bookings across all owners.
     *
     * @param  array{status?: string, date?: string, field_id?: int, owner_id?: int}  $filters
     */
    public function adminBookings(User $admin, array $filters = [], int $page = 1): LengthAwarePaginator
    {
        $filters = $this->normalizeBookingFilters($filters);

        if ($admin->profile?->role !== Profile::ROLE_SUPER_ADMIN) {
            throw new AuthorizationException('You do not have permission');
        }

        $query = Booking::with(['field:id,name,sport_type,location,image_url,price_per_hour,owner_id', 'user:id,name']);

        if (! empty($filters['owner_id'])) {
            $query->whereHas('field', fn ($q) => $q->where('owner_id', $filters['owner_id']));
        }

        $query->applyFilters($filters)
            ->latest();

        Log::info('Admin monitored bookings', [
            'user_id' => $admin->id,
            'filters' => $filters,
        ]);

        return $query->paginate(10, ['*'], 'page', $page);
    }

    public function approveBooking(User $owner, Booking $booking): Booking
    {
        if ($booking->field?->owner_id !== $owner->id && $owner->profile?->role !== Profile::ROLE_SUPER_ADMIN) {
            $this->logSecurityAction($owner, 'unauthorized_attempt', $booking->id, [
                'attempted_action' => 'booking.approve',
            ]);

            throw new AuthorizationException('You do not have permission');
        }

        if ($booking->status !== BookingStatus::WAITING_CONFIRMATION->value) {
            throw new BookingAlreadyProcessedException('Booking already processed');
        }

        if ($booking->expired_at && $booking->expired_at->isPast()) {
            throw new BookingAlreadyExpiredException('Booking already expired');
        }

        try {
            $booking = $this->statusService->transition($booking, BookingStatus::CONFIRMED, [
                'approved_at' => now(),
                'confirmed_at' => now(),
                'confirmed_by' => $owner->id,
                'rejected_at' => null,
                'rejection_reason' => null,
            ]);
        } catch (InvalidBookingStatusTransitionException $e) {
            throw new BookingAlreadyProcessedException('Booking already processed', 0, $e);
        }

        $this->logSecurityAction($owner, 'booking.approved', $booking->id);

        return $booking;
    }

    public function rejectBooking(User $owner, Booking $booking, ?string $reason = null): Booking
    {
        if ($booking->field?->owner_id !== $owner->id && $owner->profile?->role !== Profile::ROLE_SUPER_ADMIN) {
            $this->logSecurityAction($owner, 'unauthorized_attempt', $booking->id, [
                'attempted_action' => 'booking.reject',
            ]);

            throw new AuthorizationException('You do not have permission');
        }

        if ($booking->status !== BookingStatus::WAITING_CONFIRMATION->value) {
            throw new BookingAlreadyProcessedException('Booking already processed');
        }

        if ($booking->expired_at && $booking->expired_at->isPast()) {
            throw new BookingAlreadyExpiredException('Booking already expired');
        }

        try {
            $booking = $this->statusService->transition($booking, BookingStatus::REJECTED, [
                'rejected_at' => now(),
                'rejection_reason' => $reason,
            ]);
        } catch (InvalidBookingStatusTransitionException $e) {
            throw new BookingAlreadyProcessedException('Booking already processed', 0, $e);
        }

        $this->logSecurityAction($owner, 'booking.rejected', $booking->id);

        return $booking;
    }

    public function completeBooking(User $owner, Booking $booking): Booking
    {
        if ($booking->field?->owner_id !== $owner->id && $owner->profile?->role !== Profile::ROLE_SUPER_ADMIN) {
            $this->logSecurityAction($owner, 'unauthorized_attempt', $booking->id, [
                'attempted_action' => 'booking.complete',
            ]);

            throw new UnauthorizedBookingActionException('You do not have permission');
        }

        if ($booking->status !== BookingStatus::CONFIRMED->value) {
            throw new InvalidBookingStatusException('Booking must be confirmed before completion');
        }

        try {
            $booking = $this->statusService->transition($booking, BookingStatus::COMPLETED, [
                'completed_at' => now(),
            ]);

            $this->logSecurityAction($owner, 'booking.completed', $booking->id);

            return $booking;
        } catch (InvalidBookingStatusTransitionException $e) {
            throw new InvalidBookingStatusException('Booking must be confirmed before completion', 0, $e);
        }
    }

    /**
     * Ranges already locked (statuses in lock_statuses) for a field+date.
     *
     * @return array<int, array{start: string, end: string}>
     */
    public function bookedRangesForDate(int $fieldId, string $date): array
    {
        try {
            return BookingSlot::whereHas('booking', function ($query) use ($fieldId, $date) {
                $query->lockingSlot()
                    ->where('field_id', $fieldId)
                    ->where('booking_date', $date);
            })
            ->get(['start_time', 'end_time'])
            ->map(fn (BookingSlot $slot) => [
                'start' => substr((string) $slot->start_time, 0, 5),
                'end' => substr((string) $slot->end_time, 0, 5),
            ])
            ->values()
            ->all();
        } catch (\Exception $e) {
            // Fallback: query langsung ke tabel bookings jika booking_slots belum di-migrate
            return Booking::lockingSlot()
                ->where('field_id', $fieldId)
                ->where('booking_date', $date)
                ->get(['start_time', 'end_time'])
                ->map(fn (Booking $b) => [
                    'start' => substr((string) $b->start_time, 0, 5),
                    'end' => substr((string) $b->end_time, 0, 5),
                ])
                ->values()
                ->all();
        }
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
     * @param  array  $slots
     * @return array<int, array{start_time: string, end_time: string}>
     */
    private function normalizeSlots(array $slots, Field $field): array
    {
        $openTime = $field->open_time ? substr((string) $field->open_time, 0, 5) : null;
        $closeTime = $field->close_time ? substr((string) $field->close_time, 0, 5) : null;
        if (! $openTime || ! $closeTime || ! $field->session_duration_minutes) {
            throw ValidationException::withMessages([
                'slots' => 'Lapangan belum memiliki jadwal operasional.',
            ]);
        }

        $generatedSlots = $this->slotGenerator->generate(
            $openTime,
            $closeTime,
            (int) $field->session_duration_minutes,
            (int) ($field->buffer_duration_minutes ?? 0)
        );

        $validSlotsMap = collect($generatedSlots)->mapWithKeys(fn (array $slot) => [
            $slot['start_time'] => $slot['end_time'],
        ]);

        $normalized = [];

        foreach ($slots as $slotItem) {
            if (is_string($slotItem)) {
                $startTime = $this->normalizeTime($slotItem);
                $endTime = $validSlotsMap[$startTime] ?? null;
                if (! $endTime) {
                    throw ValidationException::withMessages([
                        'slots' => "Slot {$startTime} tidak tersedia pada jadwal lapangan.",
                    ]);
                }
                $normalized[] = [
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                ];
            } elseif (is_array($slotItem) && isset($slotItem['start_time'])) {
                $startTime = $this->normalizeTime($slotItem['start_time']);
                $rawEnd = ! empty($slotItem['end_time']) ? $this->normalizeTime($slotItem['end_time']) : null;
                $endTime = $rawEnd ?: ($validSlotsMap[$startTime] ?? null);

                if ($endTime && ($validSlotsMap[$startTime] ?? null) === $endTime) {
                    $normalized[] = [
                        'start_time' => $startTime,
                        'end_time'   => $endTime,
                    ];
                } elseif ($endTime) {
                    $matchingSlots = collect($generatedSlots)->filter(function ($gSlot) use ($startTime, $endTime) {
                        return $gSlot['start_time'] >= $startTime && $gSlot['end_time'] <= $endTime;
                    })->values()->all();

                    if (empty($matchingSlots)) {
                        throw ValidationException::withMessages([
                            'slots' => "Slot {$startTime}-{$endTime} tidak tersedia pada jadwal lapangan.",
                        ]);
                    }

                    foreach ($matchingSlots as $mSlot) {
                        $normalized[] = [
                            'start_time' => $mSlot['start_time'],
                            'end_time'   => $mSlot['end_time'],
                        ];
                    }
                } else {
                    throw ValidationException::withMessages([
                        'slots' => "Slot {$startTime} tidak tersedia pada jadwal lapangan.",
                    ]);
                }
            }
        }

        return collect($normalized)
            ->unique(fn ($s) => $s['start_time'])
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
     * @param  array<int, array{start_time: string, end_time: string}>  $slots
     */
    private function validateSlotsAgainstSchedule(Field $field, array $slots): void
    {
        $openTime = $field->open_time ? substr((string) $field->open_time, 0, 5) : null;
        $closeTime = $field->close_time ? substr((string) $field->close_time, 0, 5) : null;

        if (! $openTime || ! $closeTime || ! $field->session_duration_minutes) {
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
                    'slots' => 'Slot '.$slot['start_time'].'-'.$slot['end_time'].' tidak tersedia pada jadwal lapangan.',
                ]);
            }
        }
    }

    /**
     * Selected slots must be consecutive in the field's generated slot
     * sequence (buffer-aware: e.g. 07:00-08:00 + 08:30-09:30 on a field
     * with a 30-minute buffer) so they form a single continuous booking.
     *
     * @param  array<int, array{start_time: string, end_time: string}>  $slots
     */
    private function assertSlotsContiguous(Field $field, array $slots): void
    {
        $openTime = $field->open_time ? substr((string) $field->open_time, 0, 5) : null;
        $closeTime = $field->close_time ? substr((string) $field->close_time, 0, 5) : null;

        if (! $openTime || ! $closeTime || ! $field->session_duration_minutes) {
            throw ValidationException::withMessages([
                'slots' => 'Lapangan belum memiliki jadwal operasional.',
            ]);
        }

        $generatedStarts = collect($this->slotGenerator->generate(
            $openTime,
            $closeTime,
            (int) $field->session_duration_minutes,
            (int) ($field->buffer_duration_minutes ?? 0)
        ))->pluck('start_time')->values()->all();

        $positions = collect($slots)
            ->map(fn (array $slot) => array_search($slot['start_time'], $generatedStarts, true))
            ->values();

        if ($positions->contains(fn ($position) => $position === false)) {
            throw ValidationException::withMessages([
                'slots' => 'Slot tidak tersedia pada jadwal lapangan.',
            ]);
        }

        for ($i = 1; $i < $positions->count(); $i++) {
            if ($positions[$i] !== $positions[$i - 1] + 1) {
                throw ValidationException::withMessages([
                    'slots' => 'Slot yang dipilih harus berurutan tanpa jeda.',
                ]);
            }
        }
    }

    private function assertNoConflict(int $fieldId, string $date, array $slots): void
    {
        foreach ($slots as $slot) {
            try {
                $overlap = BookingSlot::whereHas('booking', function ($query) use ($fieldId, $date) {
                    $query->lockingSlot()
                        ->where('field_id', $fieldId)
                        ->where('booking_date', $date);
                })
                ->where('start_time', '<', $slot['end_time'])
                ->where('end_time', '>', $slot['start_time'])
                ->exists();
            } catch (\Exception $e) {
                // Fallback: cek conflict langsung di tabel bookings jika booking_slots belum di-migrate
                $overlap = Booking::lockingSlot()
                    ->where('field_id', $fieldId)
                    ->where('booking_date', $date)
                    ->where('start_time', '<', $slot['end_time'])
                    ->where('end_time', '>', $slot['start_time'])
                    ->exists();
            }

            if ($overlap) {
                throw new BookingConflictException;
            }
        }
    }

    private function normalizeBookingFilters(array $filters): array
    {
        if (! empty($filters['tanggal']) && empty($filters['date'])) {
            $filters['date'] = $filters['tanggal'];
        }

        if (! empty($filters['field']) && empty($filters['field_id'])) {
            $filters['field_id'] = $filters['field'];
        }

        unset($filters['tanggal'], $filters['field']);

        return $filters;
    }

    private function ownerOwnsField(User $owner, int $fieldId): bool
    {
        return Field::whereKey($fieldId)
            ->where('owner_id', $owner->id)
            ->exists();
    }

    private function logSecurityAction(User $user, string $action, ?int $resourceId, array $context = []): void
    {
        Log::info('Security action', array_merge([
            'user_id' => $user->id,
            'action' => $action,
            'resource_id' => $resourceId,
            'timestamp' => now()->toISOString(),
        ], $context));
    }
}
