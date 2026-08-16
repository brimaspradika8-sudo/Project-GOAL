<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Field;
use App\Models\FieldBlockedSlot;
use App\Models\FieldHoliday;
use App\Models\FieldSchedule;
use App\Models\Profile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FieldScheduleController extends Controller
{
    private function canManageField(Request $request, Field $field): bool
    {
        $user = $request->user();
        if ($user->profile?->role === Profile::ROLE_SUPER_ADMIN) {
            return true;
        }

        return $field->owner_id === $user->id;
    }

    // --- Operational Schedules ---

    public function getSchedules(Request $request, int $id): JsonResponse
    {
        $field = Field::find($id);
        if (! $field) {
            return $this->errorResponse('Lapangan tidak ditemukan.', [], 404);
        }

        if (! $this->canManageField($request, $field)) {
            return $this->errorResponse('Anda bukan pemilik lapangan ini.', [], 403);
        }

        $schedules = FieldSchedule::where('field_id', $field->id)
            ->orderBy('day_of_week')
            ->get();

        return $this->successResponse('Jadwal operasional berhasil dimuat.', [
            'schedules' => $schedules,
        ]);
    }

    public function updateSchedules(Request $request, int $id): JsonResponse
    {
        $field = Field::find($id);
        if (! $field) {
            return $this->errorResponse('Lapangan tidak ditemukan.', [], 404);
        }

        if (! $this->canManageField($request, $field)) {
            return $this->errorResponse('Anda bukan pemilik lapangan ini.', [], 403);
        }

        $data = $request->validate([
            'schedules' => ['required', 'array', 'min:1', 'max:7'],
            'schedules.*.day_of_week' => ['required', 'integer', 'between:0,6'],
            'schedules.*.open_time' => ['required', 'string'],
            'schedules.*.close_time' => ['required', 'string'],
            'schedules.*.is_closed' => ['required', 'boolean'],
        ]);

        foreach ($data['schedules'] as $item) {
            FieldSchedule::updateOrCreate(
                [
                    'field_id' => $field->id,
                    'day_of_week' => $item['day_of_week'],
                ],
                [
                    'open_time' => $item['open_time'],
                    'close_time' => $item['close_time'],
                    'is_closed' => $item['is_closed'],
                ]
            );
        }

        $schedules = FieldSchedule::where('field_id', $field->id)
            ->orderBy('day_of_week')
            ->get();

        return $this->successResponse('Jadwal operasional berhasil diperbarui.', [
            'schedules' => $schedules,
        ]);
    }

    // --- Holidays ---

    public function getHolidays(Request $request, int $id): JsonResponse
    {
        $field = Field::find($id);
        if (! $field) {
            return $this->errorResponse('Lapangan tidak ditemukan.', [], 404);
        }

        if (! $this->canManageField($request, $field)) {
            return $this->errorResponse('Anda bukan pemilik lapangan ini.', [], 403);
        }

        $holidays = FieldHoliday::where('field_id', $field->id)
            ->orderBy('date')
            ->get();

        return $this->successResponse('Daftar hari libur berhasil dimuat.', [
            'holidays' => $holidays,
        ]);
    }

    public function storeHoliday(Request $request, int $id): JsonResponse
    {
        $field = Field::find($id);
        if (! $field) {
            return $this->errorResponse('Lapangan tidak ditemukan.', [], 404);
        }

        if (! $this->canManageField($request, $field)) {
            return $this->errorResponse('Anda bukan pemilik lapangan ini.', [], 403);
        }

        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $holiday = FieldHoliday::updateOrCreate(
            [
                'field_id' => $field->id,
                'date' => $data['date'],
            ],
            [
                'reason' => $data['reason'] ?? null,
            ]
        );

        return $this->successResponse('Hari libur berhasil ditambahkan.', [
            'holiday' => $holiday,
        ], 201);
    }

    public function destroyHoliday(Request $request, int $holidayId): JsonResponse
    {
        $holiday = FieldHoliday::with('field')->find($holidayId);
        if (! $holiday) {
            return $this->errorResponse('Hari libur tidak ditemukan.', [], 404);
        }

        if (! $this->canManageField($request, $holiday->field)) {
            return $this->errorResponse('Anda bukan pemilik lapangan ini.', [], 403);
        }

        $holiday->delete();

        return $this->successResponse('Hari libur berhasil dihapus.');
    }

    // --- Blocked Slots ---

    public function getBlockedSlots(Request $request, int $id): JsonResponse
    {
        $field = Field::find($id);
        if (! $field) {
            return $this->errorResponse('Lapangan tidak ditemukan.', [], 404);
        }

        if (! $this->canManageField($request, $field)) {
            return $this->errorResponse('Anda bukan pemilik lapangan ini.', [], 403);
        }

        $blockedSlots = FieldBlockedSlot::where('field_id', $field->id)
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        return $this->successResponse('Daftar blocked slot berhasil dimuat.', [
            'blocked_slots' => $blockedSlots,
        ]);
    }

    public function storeBlockedSlot(Request $request, int $id): JsonResponse
    {
        $field = Field::find($id);
        if (! $field) {
            return $this->errorResponse('Lapangan tidak ditemukan.', [], 404);
        }

        if (! $this->canManageField($request, $field)) {
            return $this->errorResponse('Anda bukan pemilik lapangan ini.', [], 403);
        }

        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'start_time' => ['required', 'string'],
            'end_time' => ['required', 'string'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $blockedSlot = FieldBlockedSlot::create([
            'field_id' => $field->id,
            'date' => $data['date'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'reason' => $data['reason'] ?? null,
        ]);

        return $this->successResponse('Blocked slot berhasil ditambahkan.', [
            'blocked_slot' => $blockedSlot,
        ], 201);
    }

    public function destroyBlockedSlot(Request $request, int $blockedSlotId): JsonResponse
    {
        $blockedSlot = FieldBlockedSlot::with('field')->find($blockedSlotId);
        if (! $blockedSlot) {
            return $this->errorResponse('Blocked slot tidak ditemukan.', [], 404);
        }

        if (! $this->canManageField($request, $blockedSlot->field)) {
            return $this->errorResponse('Anda bukan pemilik lapangan ini.', [], 403);
        }

        $blockedSlot->delete();

        return $this->successResponse('Blocked slot berhasil dihapus.');
    }
}
