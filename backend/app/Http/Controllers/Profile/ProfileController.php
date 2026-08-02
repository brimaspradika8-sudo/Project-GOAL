<?php

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProfileResource;
use App\Services\ProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\Rules\Rule;

class ProfileController extends Controller
{
    public function __construct(
        private ProfileService $profile
    ) {}

    public function me(Request $request): JsonResponse
    {
        $data = $this->profile->getPayload($request->user());

        return response()->json(new ProfileResource($data));
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'full_name' => 'sometimes|string|max:100',
            'region'    => 'sometimes|string|max:100',
            'avatar_url' => ['sometimes', 'nullable', 'url', 'max:2048', 'regex:/^https?:\/\//i'],
            'age'       => 'sometimes|nullable|integer|min:10|max:100',
        ]);

        $user = $request->user();

        if (isset($validated['full_name'])) {
            $user->update(['name' => $validated['full_name']]);
        }

        $profile = $user->profile;

        if (!$profile) {
            return response()->json([
                'message' => 'Profil belum dibuat. Silakan lengkapi onboarding terlebih dahulu.',
            ], 422);
        }

        $profile->update(collect($validated)->only([
            'full_name', 'region', 'avatar_url', 'age',
        ])->toArray());

        $data = $this->profile->getPayload($user);

        return response()->json(new ProfileResource($data));
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required',
            'password'         => ['required', 'confirmed', 'different:current_password', PasswordRule::min(8)->mixedCase()->numbers()],
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Password saat ini tidak sesuai.',
            ], 422);
        }

        $user->update([
            'password' => $request->password,
        ]);

        $currentToken = $user->currentAccessToken();

        $user->tokens()
            ->when($currentToken, fn ($query) => $query->where('id', '!=', $currentToken->id))
            ->delete();

        return response()->json([
            'message' => 'Password berhasil diperbarui.',
        ]);
    }
}
