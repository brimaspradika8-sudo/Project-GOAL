<?php

namespace App\Services;

use App\Models\Field;
use App\Models\FieldPrice;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class FieldBookingConfigurationService
{
    public function canManageField(User $user, Field $field): bool
    {
        return $user->profile?->role === Profile::ROLE_SUPER_ADMIN || $field->owner_id === $user->id;
    }

    public function updateSchedule(Field $field, array $data): Field
    {
        $field->update([
            'open_time' => $data['open_time'],
            'close_time' => $data['close_time'],
            'session_duration_minutes' => $data['session_duration_minutes'],
            'buffer_duration_minutes' => $data['buffer_duration_minutes'],
        ]);

        return $field->fresh(['owner:id,name', 'prices']);
    }

    public function createPrice(Field $field, array $data): FieldPrice
    {
        $this->ensureNoOverlap($field, $data['start_time'], $data['end_time']);

        return $field->prices()->create([
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'price' => $data['price'],
        ]);
    }

    public function updatePrice(FieldPrice $price, array $data): FieldPrice
    {
        $this->ensureNoOverlap($price->field, $data['start_time'], $data['end_time'], $price->id);

        $price->update([
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'price' => $data['price'],
        ]);

        return $price->fresh('field');
    }

    public function deletePrice(FieldPrice $price): void
    {
        $price->delete();
    }

    private function ensureNoOverlap(Field $field, string $startTime, string $endTime, ?int $exceptId = null): void
    {
        $overlapExists = $field->prices()
            ->when($exceptId, fn ($query) => $query->whereKeyNot($exceptId))
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime)
            ->exists();

        if ($overlapExists) {
            throw ValidationException::withMessages([
                'start_time' => ['Rentang harga tidak boleh overlap dengan harga lain.'],
            ]);
        }
    }
}
