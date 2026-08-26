<?php

namespace App\Http\Controllers\Field;

use App\Http\Controllers\Controller;
use App\Http\Requests\Field\AvailabilityRequest;
use App\Http\Resources\FieldResource;
use App\Services\AvailabilityService;
use App\Services\BookingService;
use App\Services\FieldService;
use Illuminate\Http\JsonResponse;

/**
 * @tags Lapangan (Fields)
 */
class FieldAvailabilityController extends Controller
{
    public function __construct(
        private FieldService $fieldService,
        private AvailabilityService $availabilityService,
        private BookingService $bookingService,
    ) {}

    public function show(AvailabilityRequest $request, int $id): JsonResponse
    {
        $field = $this->fieldService->findApprovedWithPrices($id);

        if (!$field) {
            return $this->errorResponse('Lapangan tidak ditemukan.', [], 404);
        }

        $date = $request->query('date') ?? $request->query('tanggal');
        $bookedRanges = $this->bookingService->bookedRangesForDate($field->id, $date);

        $result = $this->availabilityService->forDate($field, $date, $bookedRanges);

        $closedDays = \App\Models\FieldSchedule::where('field_id', $field->id)
            ->where('is_closed', true)
            ->pluck('day_of_week')
            ->toArray();

        $holidays = \App\Models\FieldHoliday::where('field_id', $field->id)
            ->get()
            ->map(fn($h) => \Illuminate\Support\Carbon::parse($h->date)->format('Y-m-d'))
            ->toArray();

        return $this->successResponse('Ketersediaan lapangan berhasil dimuat.', [
            'field' => (new FieldResource($field))->resolve($request),
            'lapangan' => [
                'id' => $field->id,
                'name' => $field->name,
            ],
            'date' => $result['date'],
            'tanggal' => $result['date'],
            'field_status' => $this->availabilityService->liveFieldStatus($field, $date),
            'slots' => $result['slots'],
            'closed_days' => $closedDays,
            'holidays' => $holidays,
        ]);
    }
}
