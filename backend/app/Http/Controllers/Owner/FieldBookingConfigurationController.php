<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Booking\StoreFieldPriceRequest;
use App\Http\Requests\Booking\UpdateFieldPriceRequest;
use App\Http\Requests\Booking\UpdateFieldScheduleRequest;
use App\Http\Resources\FieldResource;
use App\Models\Field;
use App\Models\FieldPrice;
use App\Services\FieldBookingConfigurationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

/**
 * @tags Pemilik (Owner)
 */
class FieldBookingConfigurationController extends Controller
{
    public function __construct(private FieldBookingConfigurationService $service) {}

    public function updateSchedule(UpdateFieldScheduleRequest $request, int $id): JsonResponse
    {
        $field = Field::with('prices')->find($id);

        if (!$field) {
            return $this->errorResponse('Lapangan tidak ditemukan.', [], 404);
        }

        if (!$this->service->canManageField($request->user(), $field)) {
            return $this->errorResponse('Anda bukan pemilik lapangan ini.', [], 403);
        }

        $field = $this->service->updateSchedule($field, $request->validated());

        return $this->resourceResponse('Konfigurasi jadwal lapangan berhasil diperbarui.', new FieldResource($field));
    }

    public function storePrice(StoreFieldPriceRequest $request, int $id): JsonResponse
    {
        $field = Field::with('prices')->find($id);

        if (!$field) {
            return $this->errorResponse('Lapangan tidak ditemukan.', [], 404);
        }

        if (!$this->service->canManageField($request->user(), $field)) {
            return $this->errorResponse('Anda bukan pemilik lapangan ini.', [], 403);
        }

        try {
            $price = $this->service->createPrice($field, $request->validated());
        } catch (ValidationException $e) {
            return $this->errorResponse('Validasi gagal.', $e->errors(), 422);
        }

        return $this->successResponse('Harga lapangan berhasil dibuat.', $this->pricePayload($price), 201);
    }

    public function updatePrice(UpdateFieldPriceRequest $request, int $id): JsonResponse
    {
        $price = FieldPrice::with('field')->find($id);

        if (!$price) {
            return $this->errorResponse('Harga lapangan tidak ditemukan.', [], 404);
        }

        if (!$this->service->canManageField($request->user(), $price->field)) {
            return $this->errorResponse('Anda bukan pemilik lapangan ini.', [], 403);
        }

        try {
            $price = $this->service->updatePrice($price, $request->validated());
        } catch (ValidationException $e) {
            return $this->errorResponse('Validasi gagal.', $e->errors(), 422);
        }

        return $this->successResponse('Harga lapangan berhasil diperbarui.', $this->pricePayload($price));
    }

    public function destroyPrice(int $id): JsonResponse
    {
        $price = FieldPrice::with('field')->find($id);

        if (!$price) {
            return $this->errorResponse('Harga lapangan tidak ditemukan.', [], 404);
        }

        if (!$this->service->canManageField(request()->user(), $price->field)) {
            return $this->errorResponse('Anda bukan pemilik lapangan ini.', [], 403);
        }

        $this->service->deletePrice($price);

        return $this->successResponse('Harga lapangan berhasil dihapus.');
    }

    private function pricePayload(FieldPrice $price): array
    {
        return [
            'id' => $price->id,
            'field_id' => $price->field_id,
            'start_time' => substr((string) $price->start_time, 0, 5),
            'end_time' => substr((string) $price->end_time, 0, 5),
            'price' => $price->price,
        ];
    }
}
