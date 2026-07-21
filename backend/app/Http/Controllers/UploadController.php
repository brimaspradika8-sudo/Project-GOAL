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
        $request->validate([
            'image' => 'required|file|image|max:5120', // max 5MB
        ]);

        $file = $request->file('image');
        $supabaseUrl = env('SUPABASE_URL');
        $supabaseKey = env('SUPABASE_ANON_KEY');
        $bucket = 'fields'; // Target bucket name in Supabase

        if (!$supabaseUrl || !$supabaseKey) {
            // Fallback ke penyimpanan lokal jika kredensial Supabase tidak di-set
            $path = $file->store('fields', 'public');
            return response()->json([
                'url' => asset('storage/' . $path),
            ]);
        }

        try {
            // Buat nama file unik: fields/timestamp_uuid.ext
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = "fields/{$filename}";

            // Upload ke Supabase Storage menggunakan Storage REST API
            $response = Http::withHeaders([
                'apikey'        => $supabaseKey,
                'Authorization' => "Bearer {$supabaseKey}",
            ])->withBody(file_get_contents($file->getRealPath()), $file->getMimeType())
              ->post("{$supabaseUrl}/storage/v1/object/{$bucket}/{$path}");

            if ($response->failed()) {
                Log::error('Supabase image upload failed: ' . $response->body());
                // Fallback ke penyimpanan lokal jika upload ke Supabase gagal
                $localPath = $file->store('fields', 'public');
                return response()->json([
                    'url' => asset('storage/' . $localPath),
                ]);
            }

            // Dapatkan URL publik dari file yang diunggah
            $publicUrl = "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$path}";
            return response()->json([
                'url' => $publicUrl,
            ]);
        } catch (\Exception $e) {
            Log::error('Supabase upload exception: ' . $e->getMessage());
            // Fallback ke penyimpanan lokal jika terjadi exception
            $localPath = $file->store('fields', 'public');
            return response()->json([
                'url' => asset('storage/' . $localPath),
            ]);
        }
    }
}
