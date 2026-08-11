<?php

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProfileResource;
use App\Services\ProfileService;
use App\Services\SupabaseStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AvatarController extends Controller
{
    public function __construct(
        private SupabaseStorageService $storage,
        private ProfileService $profile
    ) {}

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|file|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $user = $request->user();
        $profile = $user->profile;

        if (!$profile) {
            return $this->errorResponse('Profil belum dibuat. Silakan lengkapi onboarding terlebih dahulu.', [], 422);
        }

        try {
            $file = $request->file('avatar');

            if (!$file || !$file->isValid()) {
                return $this->errorResponse('File tidak valid.', [], 400);
            }

            $extension = strtolower($file->extension());
            $filename = bin2hex(random_bytes(16)) . '.' . $extension;
            $path = 'avatars/' . $filename;

            $mime = $file->getMimeType() ?: 'image/jpeg';
            $publicUrl = $this->storage->upload($path, file_get_contents($file->getRealPath()), $mime);

            $profile->update(['avatar_url' => $publicUrl]);

            return $this->successResponse('Foto profil berhasil diunggah.', [
                'avatar_url' => $publicUrl,
                'profile'    => new ProfileResource($this->profile->getPayload($user)),
            ]);
        } catch (\Exception $e) {
            Log::error('Avatar upload exception: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse('Gagal mengunggah foto profil. Silakan coba lagi.', [], 500);
        }
    }
}
