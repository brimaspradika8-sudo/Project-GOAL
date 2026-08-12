<?php

namespace App\Http\Controllers\Field;

use App\Http\Controllers\Controller;
use App\Http\Requests\Field\AvailabilityRequest;
use App\Http\Resources\FieldResource;
use App\Services\AvailabilityService;
use App\Services\BookingService;
use App\Services\FieldService;
use Illuminate\Http\JsonResponse;

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
        ]);
    }
}
