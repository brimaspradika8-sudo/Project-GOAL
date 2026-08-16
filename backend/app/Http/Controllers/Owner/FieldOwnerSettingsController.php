<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Field;
use App\Models\FieldBlockedSlot;
use App\Models\FieldHoliday;
use App\Models\FieldSchedule;
use App\Services\FieldBookingConfigurationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class FieldOwnerSettingsController extends Controller
{
    public function __construct(private FieldBookingConfigurationService $service) {}

    public function showSettings(Request $request, int $id): JsonResponse
    {
        $field = Field::find($id);

        if (!$field) {
            return $this->errorResponse('Lapangan tidak ditemukan.', [], 404);
        }

        if (!$this->service->canManageField($request->user(), $field)) {
            return $this->errorResponse('Anda bukan pemilik lapangan ini.', [], 403);
        }

        $schedules = FieldSchedule::where('field_id', $field->id)
            ->orderBy('day_of_week')
            ->get();

        $holidays = FieldHoliday::where('field_id', $field->id)
            ->where('date', '>=', now()->toDateString())
            ->orderBy('date')
            ->get();

        $blockedSlots = FieldBlockedSlot::where('field_id', $field->id)
            ->where('date', '>=', now()->toDateString())
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        return $this->successResponse('Pengaturan lapangan berhasil dimuat.', [
            'field_id' => $field->id,
            'open_time' => $field->open_time ? substr((string) $field->open_time, 0, 5) : '08:00',
            'close_time' => $field->close_time ? substr((string) $field->close_time, 0, 5) : '22:00',
            'session_duration_minutes' => $field->session_duration_minutes ?? 60,
            'schedules' => $schedules,
            'holidays' => $holidays,
            'blocked_slots' => $blockedSlots,
        ]);
    }

    public function updateSchedules(Request $request, int $id): JsonResponse
    {
        $field = Field::find($id);

        if (!$field) {
            return $this->errorResponse('Lapangan tidak ditemukan.', [], 404);
        }

        if (!$this->service->canManageField($request->user(), $field)) {
            return $this->errorResponse('Anda bukan pemilik lapangan ini.', [], 403);
        }

        $validated = $request->validate([
            'schedules' => ['required', 'array'],
            'schedules.*.day_of_week' => ['required', 'integer', 'between:0,6'],
            'schedules.*.open_time' => ['required', 'string'],
            'schedules.*.close_time' => ['required', 'string'],
            'schedules.*.is_closed' => ['required', 'boolean'],
        ]);

        foreach ($validated['schedules'] as $item) {
            FieldSchedule::updateOrCreate(
                [
                    'field_id' => $field->id,
                    'day_of_week' => $item['day_of_week'],
                ],
                [
                    'open_time' => substr($item['open_time'], 0, 5),
                    'close_time' => substr($item['close_time'], 0, 5),
                    'is_closed' => $item['is_closed'],
                ]
            );
        }

        $schedules = FieldSchedule::where('field_id', $field->id)->orderBy('day_of_week')->get();

        return $this->successResponse('Jadwal operasional berhasil diperbarui.', [
            'schedules' => $schedules,
        ]);
    }

    public function storeHoliday(Request $request, int $id): JsonResponse
    {
        $field = Field::find($id);

        if (!$field) {
            return $this->errorResponse('Lapangan tidak ditemukan.', [], 404);
        }

        if (!$this->service->canManageField($request->user(), $field)) {
            return $this->errorResponse('Anda bukan pemilik lapangan ini.', [], 403);
        }

        $validated = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $exists = FieldHoliday::where('field_id', $field->id)->where('date', $validated['date'])->exists();
        if ($exists) {
            return $this->errorResponse('Tanggal libur tersebut sudah didaftarkan.', [], 422);
        }

        $holiday = FieldHoliday::create([
            'field_id' => $field->id,
            'date' => $validated['date'],
            'reason' => $validated['reason'] ?? 'Libur',
        ]);

        return $this->successResponse('Hari libur berhasil ditambahkan.', $holiday, 201);
    }

    public function destroyHoliday(Request $request, int $id): JsonResponse
    {
        $holiday = FieldHoliday::with('field')->find($id);

        if (!$holiday) {
            return $this->errorResponse('Hari libur tidak ditemukan.', [], 404);
        }

        if (!$this->service->canManageField($request->user(), $holiday->field)) {
            return $this->errorResponse('Anda bukan pemilik lapangan ini.', [], 403);
        }

        $holiday->delete();

        return $this->successResponse('Hari libur berhasil dihapus.');
    }

    public function storeBlockedSlot(Request $request, int $id): JsonResponse
    {
        $field = Field::find($id);

        if (!$field) {
            return $this->errorResponse('Lapangan tidak ditemukan.', [], 404);
        }

        if (!$this->service->canManageField($request->user(), $field)) {
            return $this->errorResponse('Anda bukan pemilik lapangan ini.', [], 403);
        }

        $validated = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'start_time' => ['required', 'string'],
            'end_time' => ['required', 'string'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $startTime = substr($validated['start_time'], 0, 5);
        $endTime = substr($validated['end_time'], 0, 5);

        if ($startTime >= $endTime) {
            return $this->errorResponse('Jam mulai harus lebih awal dari jam selesai.', [], 422);
        }

        $blocked = FieldBlockedSlot::create([
            'field_id' => $field->id,
            'date' => $validated['date'],
            'start_time' => $startTime,
            'end_time' => $endTime,
            'reason' => $validated['reason'] ?? 'Maintenance / Penutupan Jam',
        ]);

        return $this->successResponse('Jadwal tutup berhasil ditambahkan.', $blocked, 201);
    }

    public function destroyBlockedSlot(Request $request, int $id): JsonResponse
    {
        $blocked = FieldBlockedSlot::with('field')->find($id);

        if (!$blocked) {
            return $this->errorResponse('Jadwal tutup tidak ditemukan.', [], 404);
        }

        if (!$this->service->canManageField($request->user(), $blocked->field)) {
            return $this->errorResponse('Anda bukan pemilik lapangan ini.', [], 403);
        }

        $blocked->delete();

        return $this->successResponse('Jadwal tutup berhasil dihapus.');
    }
}
