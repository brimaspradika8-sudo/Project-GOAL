<?php

namespace App\Http\Controllers;

use App\Models\Profile;
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

        if (!$profile || !in_array($profile->role, [Profile::ROLE_OWNER, Profile::ROLE_SUPER_ADMIN], true)) {
            return response()->json(['message' => 'Anda tidak memiliki akses untuk mengupload gambar.'], 403);
        }

        // PENTING: validasi ini SENGAJA dibatasi 2MB & JPG-only (keputusan
        // produk). JANGAN diubah/dilonggarkan tanpa konfirmasi eksplisit —
        // pernah tidak sengaja mundur ke versi lama (5MB, terima PNG/WebP)
        // saat proses git merge, jangan sampai terulang.
        $request->validate([
            'image' => 'required|file|image|mimes:jpg,jpeg|max:2048',
        ]);

        try {
            $file = $request->file('image');

            if (!$file || !$file->isValid()) {
                Log::error('Upload failed: invalid file', ['hasFile' => (bool) $file]);
                return response()->json(['message' => 'File tidak valid.'], 400);
            }

            $ext = strtolower($file->getClientOriginalExtension()) ?: 'jpg';
            $filename = time() . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
            $path = 'fields/' . $filename;

            $supabaseUrl = config('services.supabase.url');
            $supabaseKey = config('services.supabase.key');
            $bucket = config('services.supabase.bucket');

            if (!$supabaseUrl || !$supabaseKey || !$bucket) {
                Log::error('Upload failed: Supabase credentials not configured');
                return response()->json(['message' => 'Konfigurasi penyimpanan Supabase belum lengkap.'], 500);
            }

            $mime = $file->getMimeType() ?: 'image/jpeg';
            $contents = file_get_contents($file->getRealPath());
            $publicUrl = $this->storage->upload($path, $contents, $mime);

            Log::info('Upload success', [
                'filename' => $filename,
            ]);

            return response()->json([
                'url' => $publicUrl,
                'path' => $path,
            ]);
        } catch (\Exception $e) {
            Log::error('Upload exception: ' . $e->getMessage());
            return response()->json([
                'message' => $e->getMessage() ?: 'Gagal mengunggah foto. Silakan coba lagi.',
            ], 500);
        }
    }
}
