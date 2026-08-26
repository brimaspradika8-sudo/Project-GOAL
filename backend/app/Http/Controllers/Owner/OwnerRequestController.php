<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Owner\StoreOwnerRequest;
use App\Http\Resources\OwnerRequestResource;
use App\Models\Profile;
use App\Services\OwnerRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @tags Pemilik (Owner)
 */
class OwnerRequestController extends Controller
{
    public function __construct(
        private OwnerRequestService $ownerRequestService
    ) {}

    public function store(StoreOwnerRequest $request): JsonResponse
    {
        $user = $request->user();
        $profile = $user->profile;

        if ($profile && in_array($profile->role, [Profile::ROLE_OWNER, Profile::ROLE_SUPER_ADMIN])) {
            return $this->errorResponse('Anda sudah memiliki peran yang memadai.', [], 422);
        }

        if ($profile && $profile->is_owner_verified) {
            return $this->errorResponse('Anda sudah terverifikasi sebagai pemilik.', [], 422);
        }

        $pending = $this->ownerRequestService->getPendingRequest($user);

        if ($pending) {
            return $this->errorResponse('Anda sudah memiliki pengajuan yang sedang diproses.', [], 422);
        }

        try {
            $ownerRequest = $this->ownerRequestService->submit(
                $user,
                $request->validated()
            );
        } catch (\RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), [], 422);
        }

        return $this->resourceResponse('Pengajuan owner berhasil dikirim.', new OwnerRequestResource($ownerRequest), 201);
    }

    public function status(Request $request): JsonResponse
    {
        $ownerRequest = $this->ownerRequestService->listByUser($request->user());

        return $this->resourceResponse('Status pengajuan owner berhasil dimuat.', $ownerRequest ? new OwnerRequestResource($ownerRequest) : null);
    }
}
