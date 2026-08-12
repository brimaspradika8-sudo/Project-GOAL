<?php

namespace App\Http\Controllers\Booking;

use App\Exceptions\BookingConflictException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Booking\CancelBookingRequest;
use App\Http\Requests\Booking\StoreBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    public function __construct(private BookingService $bookingService) {}

    public function store(StoreBookingRequest $request): JsonResponse
    {
        try {
            $booking = $this->bookingService->create($request->user(), $request->validated());
        } catch (BookingConflictException $e) {
            return $this->errorResponse($e->getMessage(), [], 409);
        } catch (ValidationException $e) {
            return $this->errorResponse($e->getMessage(), $e->errors(), 422);
        }

        return $this->resourceResponse('Booking request berhasil dibuat.', new BookingResource($booking), 201);
    }

    public function myBookings(Request $request): JsonResponse
    {
        $bookings = $this->bookingService->forUser($request->user(), (int) $request->query('page', 1));

        return $this->successResponse('Daftar booking berhasil dimuat.', [
            'data' => BookingResource::collection($bookings)->resolve($request),
            'pagination' => [
                'current_page' => $bookings->currentPage(),
                'last_page'    => $bookings->lastPage(),
                'total'        => $bookings->total(),
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $booking = Booking::with(['field:id,name,sport_type,location,image_url,price_per_hour,owner_id', 'user:id,name'])->find($id);

        if (!$booking || !$this->bookingService->isViewableBy($request->user(), $booking)) {
            return $this->errorResponse('Booking tidak ditemukan.', [], 404);
        }

        return $this->resourceResponse('Detail booking berhasil dimuat.', new BookingResource($booking));
    }

    public function cancel(CancelBookingRequest $request, int $id): JsonResponse
    {
        try {
            $booking = $this->bookingService->cancel($request->user(), $id, $request->input('cancel_reason'));
        } catch (ValidationException $e) {
            return $this->errorResponse($e->getMessage(), $e->errors(), 422);
        }

        return $this->resourceResponse('Booking berhasil dibatalkan.', new BookingResource($booking));
    }

    public function ownerIndex(Request $request): JsonResponse
    {
        $bookings = $this->bookingService->ownerBookings($request->user(), (int) $request->query('page', 1));

        return $this->successResponse('Daftar booking masuk berhasil dimuat.', [
            'data' => BookingResource::collection($bookings)->resolve($request),
            'pagination' => [
                'current_page' => $bookings->currentPage(),
                'last_page'    => $bookings->lastPage(),
                'total'        => $bookings->total(),
            ],
        ]);
    }

    public function ownerFieldBookings(Request $request, int $id): JsonResponse
    {
        $isAdmin = $request->user()->profile?->role === \App\Models\Profile::ROLE_SUPER_ADMIN;
        $field = \App\Models\Field::find($id);

        if (!$field) {
            return $this->errorResponse('Lapangan tidak ditemukan.', [], 404);
        }

        if (!$isAdmin && $field->owner_id !== $request->user()->id) {
            return $this->errorResponse('Anda bukan pemilik lapangan ini.', [], 403);
        }

        $bookings = $this->bookingService->ownerFieldBookings($request->user(), $id, (int) $request->query('page', 1));

        return $this->successResponse('Daftar booking lapangan berhasil dimuat.', [
            'data' => BookingResource::collection($bookings)->resolve($request),
            'pagination' => [
                'current_page' => $bookings->currentPage(),
                'last_page'    => $bookings->lastPage(),
                'total'        => $bookings->total(),
            ],
        ]);
    }
}
