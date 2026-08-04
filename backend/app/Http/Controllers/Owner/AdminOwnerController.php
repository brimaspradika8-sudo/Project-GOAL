<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Owner\ReviewOwnerRequest;
use App\Http\Resources\OwnerRequestResource;
use App\Models\OwnerRequest;
use App\Services\OwnerRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminOwnerController extends Controller
{
    public function __construct(private OwnerRequestService $ownerRequestService) {}

    public function pending(): AnonymousResourceCollection
    {
        return OwnerRequestResource::collection($this->ownerRequestService->listPending());
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
