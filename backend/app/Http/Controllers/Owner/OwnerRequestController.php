<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Owner\StoreOwnerRequest;
use App\Http\Resources\OwnerRequestResource;
use App\Services\OwnerRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OwnerRequestController extends Controller
{
    public function __construct(
        private OwnerRequestService $ownerRequestService
    ) {}

    public function store(StoreOwnerRequest $request): JsonResponse
    {
        $user = $request->user();
        $profile = $user->profile;

        if ($profile && in_array($profile->role, ['owner', 'admin', 'super_admin'])) {
            return response()->json([
                'message' => 'Anda sudah memiliki peran yang memadai.',
            ], 422);
        }

        if ($profile && $profile->is_owner_verified) {
            return response()->json([
                'message' => 'Anda sudah terverifikasi sebagai pemilik.',
            ], 422);
        }

        $pending = $this->ownerRequestService->getPendingRequest($user);

        if ($pending) {
            return response()->json([
                'message' => 'Anda sudah memiliki pengajuan yang sedang diproses.',
            ], 422);
        }

        $ownerRequest = $this->ownerRequestService->submit(
            $user,
            $request->validated()
        );

        return response()->json(new OwnerRequestResource($ownerRequest), 201);
    }

    public function status(Request $request): JsonResponse
    {
        $ownerRequest = $this->ownerRequestService->listByUser($request->user());

        return response()->json($ownerRequest ? new OwnerRequestResource($ownerRequest) : null);
    }
}
