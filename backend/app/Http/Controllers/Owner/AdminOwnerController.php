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
    public function __construct(private OwnerRequestService $ownerRequestService) {}

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

        try {
            $result = $this->ownerRequestService->review($ownerRequest, $request->user(), $request->status, $request->reason);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(new OwnerRequestResource($result));
    }
}
