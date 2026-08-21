<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\FieldValidationSetting;
use App\Services\SupabaseStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
class UploadController extends Controller
{
    public function __construct(
        private SupabaseStorageService $storage
    ) {}

    public function image(Request $request): JsonResponse
    {
        $profile = $request->user()->profile;

        if (!$profile || !in_array($profile->role, [UserRole::OWNER->value, UserRole::SUPER_ADMIN->value], true)) {
            return $this->errorResponse('Anda tidak memiliki akses untuk mengupload gambar.', [], 403);
        }

        $maxImageKb = FieldValidationSetting::current()->max_image_mb * 1024;

        $request->validate([
            'image' => 'required|file|image|mimes:jpg,jpeg,png,webp|max:' . $maxImageKb,
        ]);

        try {
            $file = $request->file('image');

            if (!$file || !$file->isValid()) {
                Log::error('Upload failed: invalid file', ['hasFile' => (bool) $file]);
                return $this->errorResponse('File tidak valid.', [], 400);
            }

            $extension = strtolower($file->extension());
            $filename = bin2hex(random_bytes(16)) . '.' . $extension;
            $path = 'fields/' . $filename;

            $supabaseUrl = config('services.supabase.url');
            $supabaseKey = config('services.supabase.key');
            $bucket = config('services.supabase.bucket');

            if (!$supabaseUrl || !$supabaseKey || !$bucket) {
                Log::error('Upload failed: Supabase credentials not configured');
                return $this->errorResponse('Konfigurasi penyimpanan Supabase belum lengkap.', [], 500);
            }

            $mime = $file->getMimeType() ?: 'image/jpeg';
            $contents = file_get_contents($file->getRealPath());
            $publicUrl = $this->storage->upload($path, $contents, $mime);

            Log::info('Upload success', [
                'filename' => $filename,
            ]);

            return $this->successResponse('Gambar berhasil diunggah.', [
                'url' => $publicUrl,
                'path' => $path,
            ]);
        } catch (\Exception $e) {
            Log::error('Upload exception: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->errorResponse('Gagal mengunggah foto. Silakan coba lagi.', [], 500);
        }
    }
}
