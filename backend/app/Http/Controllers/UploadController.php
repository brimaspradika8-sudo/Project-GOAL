<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    public function image(Request $request): JsonResponse
    {
        $profile = $request->user()->profile;

        if (!$profile || !in_array($profile->role, ['owner', 'super_admin'])) {
            return response()->json(['message' => 'Anda tidak memiliki akses untuk mengupload gambar.'], 403);
        }

        $request->validate([
            'image' => 'required|file|image|mimes:jpg,jpeg|max:2048',
        ]);

        try {
            $file = $request->file('image');

            if (!$file || !$file->isValid()) {
                Log::error('Upload failed: invalid file', ['hasFile' => (bool) $file]);
                return response()->json(['message' => 'File tidak valid.'], 400);
            }

            $ext = $file->getClientOriginalExtension();
            if (!$ext) {
                $ext = 'jpg';
            }

            $filename = time() . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
            $path = 'fields/' . $filename;

            $supabaseUrl = config('services.supabase.url');
            $supabaseKey = config('services.supabase.key');
            $bucket = config('services.supabase.bucket');

            if (!$supabaseUrl || !$supabaseKey || !$bucket) {
                Log::error('Upload failed: Supabase credentials not configured');
                return response()->json(['message' => 'Konfigurasi penyimpanan tidak lengkap.'], 500);
            }

            $stored = Storage::disk('public')->put('fields/' . $filename, $contents);

            if (!$stored) {
                Log::error('Upload failed: Storage::put returned false');
                return response()->json(['message' => 'Gagal menyimpan file.'], 500);
            }

            $url = Storage::disk('public')->url('fields/' . $filename);

            Log::info('Upload success', [
                'filename' => $filename,
                'url' => $url,
            ]);

            return response()->json([
                'url' => $url,
            ]);
        } catch (\Exception $e) {
            Log::error('Upload exception: ' . $e->getMessage());

            return response()->json([
                'message' => 'Gagal mengunggah foto. Silakan coba lagi.',
            ], 500);
        }
    }
}
