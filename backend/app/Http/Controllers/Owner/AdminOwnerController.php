<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Owner\ReviewOwnerRequest;
use App\Http\Resources\OwnerRequestResource;
use App\Models\OwnerRequest;
use App\Services\OwnerRequestService;
use Illuminate\Http\JsonResponse;

class AdminOwnerController extends Controller
{
    public function __construct(
        private OwnerRequestService $ownerRequestService
    ) {}

    public function pending(): JsonResponse
    {
        $requests = $this->ownerRequestService->listPending();

        return response()->json(OwnerRequestResource::collection($requests));
    }

    public function review(ReviewOwnerRequest $request, int $id): JsonResponse
    {
        $ownerRequest = OwnerRequest::find($id);

        if (!$ownerRequest) {
            return response()->json(['message' => 'Pengajuan tidak ditemukan.'], 404);
        }

        if ($ownerRequest->status !== 'pending') {
            return response()->json(['message' => 'Pengajuan sudah diproses sebelumnya.'], 422);
        }

        if ($request->status === 'approved') {
            $result = $this->ownerRequestService->approve(
                $ownerRequest,
                $request->user()
            );

            return response()->json(new OwnerRequestResource($result));
        }

        $result = $this->ownerRequestService->reject(
            $ownerRequest,
            $request->user(),
            $request->reason
        );

        return response()->json(new OwnerRequestResource($result));
    }
}
