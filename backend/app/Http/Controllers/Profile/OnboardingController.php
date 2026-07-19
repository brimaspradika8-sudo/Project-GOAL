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
        $username = $request->query('username', '');

        $reason = $this->profile->isUsernameValid($username);
        if ($reason) {
            return response()->json(['available' => false, 'reason' => $reason]);
        }

        $available = $this->profile->isUsernameAvailable($username);

        return response()->json(['available' => $available]);
    }

    public function submit(OnboardingRequest $request): JsonResponse
    {
        $result = $this->profile->submitOnboarding(
            $request->user(),
            $request->validated()
        );

        if ($result === false) {
            return response()->json([
                'errors' => ['username' => ['Username sudah digunakan.']],
            ], 422);
        }

        return response()->json(new ProfileResource($result));
    }
}
