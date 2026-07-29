<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
            'image' => 'required|file|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $file = $request->file('image');
        $extension = $file->extension() ?: $file->getClientOriginalExtension();
        $filename = time() . '_' . bin2hex(random_bytes(8)) . '.' . $extension;

        // Keep business path semantics ("fields/...") but use local disk storage.
        $localPath = $file->storeAs('fields', $filename, 'public');

        return response()->json([
            'url' => Storage::disk('public')->url($localPath),
        ]);
    }
}
