<?php

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\OnboardingRequest;
use App\Http\Resources\ProfileResource;
use App\Services\ProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OnboardingController extends Controller
{
    public function __construct(
        private ProfileService $profile
    ) {}

    public function checkUsername(Request $request): JsonResponse
    {
        $data = $request->validate([
            'username' => ['nullable', 'string', 'max:20'],
        ]);

        $username = $data['username'] ?? '';

        $reason = $this->profile->isUsernameValid($username);
        if ($reason) {
            return $this->successResponse('Status username berhasil dicek.', ['available' => false, 'reason' => $reason]);
        }

        $userId = $request->user()?->id;
        $available = $this->profile->isUsernameAvailable($username, $userId);

        return $this->successResponse('Status username berhasil dicek.', ['available' => $available]);
    }

    public function submit(OnboardingRequest $request): JsonResponse
    {
        $result = $this->profile->submitOnboarding(
            $request->user(),
            $request->validated()
        );

        if ($result === false) {
            return $this->errorResponse('Validasi gagal.', ['username' => ['Username sudah digunakan.']], 422);
        }

        return $this->resourceResponse('Onboarding berhasil disimpan.', new ProfileResource($result));
    }
}
