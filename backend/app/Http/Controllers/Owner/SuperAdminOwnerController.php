<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Owner\ReviewOwnerRequest;
use App\Http\Resources\OwnerRequestResource;
use App\Models\OwnerRequest;
use App\Services\OwnerRequestService;
use Illuminate\Http\JsonResponse;

/**
 * @tags Super Admin
 */
class SuperAdminOwnerController extends Controller
{
    public function __construct(private OwnerRequestService $ownerRequestService) {}

    public function pending(): JsonResponse
    {
        return $this->resourceResponse('Daftar pengajuan owner berhasil dimuat.', OwnerRequestResource::collection($this->ownerRequestService->listPending()));
    }

    public function review(ReviewOwnerRequest $request, int $id): JsonResponse
    {
        $ownerRequest = OwnerRequest::find($id);

        if (!$ownerRequest) {
            return $this->errorResponse('Pengajuan tidak ditemukan.', [], 404);
        }

        try {
            $result = $this->ownerRequestService->review($ownerRequest, $request->user(), $request->status, $request->reason);
        } catch (\RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), [], 422);
        }

        return $this->resourceResponse('Pengajuan owner berhasil diproses.', new OwnerRequestResource($result));
    }
}
