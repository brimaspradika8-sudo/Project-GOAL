<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

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

            $response = Http::withHeaders([
                'apikey' => $supabaseKey,
                'Authorization' => 'Bearer ' . $supabaseKey,
                'Content-Type' => $file->getMimeType(),
            ])->withBody(file_get_contents($file->getRealPath()), $file->getMimeType())
              ->post("{$supabaseUrl}/storage/v1/object/{$bucket}/{$path}");

            if ($response->failed()) {
                Log::error('Supabase upload failed', [
                    'filename' => $filename,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return response()->json(['message' => 'Gagal mengunggah ke penyimpanan.'], 500);
            }

            $publicUrl = "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$path}";

            Log::info('Upload success (Supabase)', [
                'filename' => $filename,
                'url' => $publicUrl,
            ]);

            return response()->json(['url' => $publicUrl]);
        } catch (\Exception $e) {
            Log::error('Upload exception: ' . $e->getMessage());

            return response()->json([
                'message' => 'Gagal mengunggah foto. Silakan coba lagi.',
            ], 500);
        }
    }
}
