<?php

namespace App\Http\Controllers\Booking;

use App\Exceptions\BookingAlreadyExpiredException;
use App\Exceptions\BookingAlreadyProcessedException;
use App\Exceptions\BookingCannotBeCancelledException;
use App\Exceptions\BookingConflictException;
use App\Exceptions\InvalidBookingStatusException;
use App\Exceptions\UnauthorizedBookingActionException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Booking\CancelBookingRequest;
use App\Http\Requests\Booking\StoreBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Models\Field;
use App\Models\Profile;
use App\Policies\BookingPolicy;
use App\Policies\FieldPolicy;
use App\Services\BookingService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
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
                'last_page' => $bookings->lastPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        $bookings = $this->bookingService->getUserBookingHistory(
            $request->user(),
            $this->filters($request),
            (int) $request->query('page', 1)
        );

        return $this->successResponse('Riwayat booking berhasil dimuat.', [
            'data' => BookingResource::collection($bookings)->resolve($request),
            'pagination' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $booking = Booking::with(['field:id,name,sport_type,location,image_url,price_per_hour,owner_id', 'user:id,name'])->find($id);

        if (! $booking) {
            return $this->errorResponse('Booking not found', [], 404);
        }

        $this->authorizeBooking($request, 'view', $booking);

        return $this->resourceResponse('Detail booking berhasil dimuat.', new BookingResource($booking));
    }

    public function confirm(Request $request, int $id): JsonResponse
    {
        $booking = Booking::with('field')->find($id);

        if (! $booking) {
            return $this->errorResponse('Booking not found', [], 404);
        }

        try {
            $this->authorizeBooking($request, 'view', $booking);
            $updated = $this->bookingService->confirmCashBooking($request->user(), $booking);

            return $this->resourceResponse('Booking berhasil dikonfirmasi.', new BookingResource($updated));
        } catch (AuthorizationException $e) {
            return $this->errorResponse('You do not have permission', [], 403);
        } catch (ValidationException $e) {
            return $this->errorResponse($e->getMessage(), $e->errors(), 422);
        }
    }

    public function cancel(CancelBookingRequest $request, int $id): JsonResponse
    {
        try {
            $booking = $this->bookingService->cancel(
                $request->user(),
                $id,
                $request->input('reason') ?? $request->input('cancel_reason')
            );
        } catch (ModelNotFoundException $e) {
            return $this->errorResponse('Booking not found', [], 404);
        } catch (AuthorizationException $e) {
            return $this->errorResponse('You do not have permission', [], 403);
        } catch (BookingCannotBeCancelledException $e) {
            return $this->errorResponse('Booking cannot be cancelled', [], 409);
        } catch (ValidationException $e) {
            return $this->errorResponse($e->getMessage(), $e->errors(), 422);
        }

        return $this->resourceResponse('Booking berhasil dibatalkan.', new BookingResource($booking));
    }

    public function ownerIndex(Request $request): JsonResponse
    {
        $bookings = $this->bookingService->ownerBookings(
            $request->user(),
            $this->filters($request),
            (int) $request->query('page', 1)
        );

        return $this->successResponse('Daftar booking masuk berhasil dimuat.', [
            'data' => BookingResource::collection($bookings)->resolve($request),
            'pagination' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }

    public function ownerFieldBookings(Request $request, int $id): JsonResponse
    {
        $isAdmin = $request->user()->profile?->role === Profile::ROLE_SUPER_ADMIN;
        $field = Field::find($id);

        if (! $field) {
            return $this->errorResponse('Lapangan tidak ditemukan.', [], 404);
        }

        if (! app(FieldPolicy::class)->monitor($request->user(), $field)) {
            throw new AuthorizationException('This action is unauthorized.');
        }

        $bookings = $this->bookingService->ownerFieldBookings(
            $request->user(),
            $id,
            $this->filters($request),
            (int) $request->query('page', 1)
        );

        return $this->successResponse('Daftar booking lapangan berhasil dimuat.', [
            'data' => BookingResource::collection($bookings)->resolve($request),
            'pagination' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }

    /**
     * Super admin monitoring across all bookings.
     * Filters: status, date, field_id, owner_id.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $filters = array_filter([
            'status' => $request->query('status'),
            'date' => $request->query('date'),
            'field_id' => $request->query('field_id'),
            'owner_id' => $request->query('owner_id'),
        ], fn ($v) => $v !== null && $v !== '');

        $bookings = $this->bookingService->adminBookings(
            $request->user(),
            $filters,
            (int) $request->query('page', 1)
        );

        return $this->successResponse('Daftar seluruh booking berhasil dimuat.', [
            'data' => BookingResource::collection($bookings)->resolve($request),
            'pagination' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }

    private function filters(Request $request): array
    {
        return array_filter([
            'status' => $request->query('status'),
            'date' => $request->query('date') ?? $request->query('tanggal'),
            'field_id' => $request->query('field_id') ?? $request->query('field'),
        ], fn ($v) => $v !== null && $v !== '');
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        $booking = Booking::with('field')->find($id);

        if (! $booking) {
            return $this->errorResponse('Booking not found', [], 404);
        }

        try {
            $this->authorizeBooking($request, 'approve', $booking);
            $updated = $this->bookingService->approveBooking($request->user(), $booking);

            return $this->resourceResponse('Booking approved', new BookingResource($updated));
        } catch (AuthorizationException $e) {
            return $this->errorResponse('You do not have permission', [], 403);
        } catch (BookingAlreadyProcessedException $e) {
            return $this->errorResponse('Booking already processed', [], 409);
        } catch (BookingAlreadyExpiredException $e) {
            return $this->errorResponse('Booking already expired', [], 409);
        }
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $booking = Booking::with('field')->find($id);

        if (! $booking) {
            return $this->errorResponse('Booking not found', [], 404);
        }

        try {
            $this->authorizeBooking($request, 'reject', $booking);
            $data = $request->validate([
                'reason' => ['nullable', 'string', 'max:255'],
            ]);
            $updated = $this->bookingService->rejectBooking($request->user(), $booking, $data['reason'] ?? null);

            return $this->resourceResponse('Booking rejected', new BookingResource($updated));
        } catch (AuthorizationException $e) {
            return $this->errorResponse('You do not have permission', [], 403);
        } catch (BookingAlreadyProcessedException $e) {
            return $this->errorResponse('Booking already processed', [], 409);
        } catch (BookingAlreadyExpiredException $e) {
            return $this->errorResponse('Booking already expired', [], 409);
        }
    }

    public function complete(Request $request, int $id): JsonResponse
    {
        $booking = Booking::with('field')->find($id);

        if (! $booking) {
            return $this->errorResponse('Booking not found', [], 404);
        }

        try {
            $this->authorizeBooking($request, 'complete', $booking);
            $updated = $this->bookingService->completeBooking($request->user(), $booking);

            return $this->resourceResponse('Booking completed', new BookingResource($updated));
        } catch (UnauthorizedBookingActionException $e) {
            return $this->errorResponse('You do not have permission', [], 403);
        } catch (AuthorizationException $e) {
            return $this->errorResponse('You do not have permission', [], 403);
        } catch (InvalidBookingStatusException $e) {
            return $this->errorResponse($e->getMessage(), [], 409);
        }
    }

    private function authorizeBooking(Request $request, string $ability, Booking $booking): void
    {
        $policy = app(BookingPolicy::class);

        if (! $policy->{$ability}($request->user(), $booking)) {
            throw new AuthorizationException('This action is unauthorized.');
        }
    }
}
