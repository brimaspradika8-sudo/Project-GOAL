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
            'image' => 'required|file|image|mimes:jpeg,png,webp|max:5120',
        ]);

        $file = $request->file('image');
        $filename = time() . '_' . bin2hex(random_bytes(8)) . '.' . $file->getClientOriginalExtension();

        $supabaseUrl = config('services.supabase.url');
        $supabaseKey = config('services.supabase.key');
        $bucket = config('services.supabase.bucket');

        if ($supabaseUrl && $supabaseKey && $bucket) {
            try {
                $uploadUrl = "{$supabaseUrl}/storage/v1/object/{$bucket}/fields/{$filename}";

                $response = Http::withHeaders([
                    'Authorization' => "Bearer {$supabaseKey}",
                    'Content-Type'  => 'multipart/form-data',
                ])->attach('file', file_get_contents($file), $filename, [
                    'Content-Type' => $file->getMimeType(),
                ])->timeout(30)->post($uploadUrl);

                if ($response->successful()) {
                    $publicUrl = "{$supabaseUrl}/storage/v1/object/public/{$bucket}/fields/{$filename}";

                    return response()->json(['url' => $publicUrl]);
                }

                Log::warning('Supabase HTTP upload failed: ' . $response->body());
            } catch (\Exception $e) {
                Log::warning('Supabase HTTP upload exception: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Gagal mengunggah foto. Silakan coba lagi.',
        ], 500);
    }
}
