<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    public function image(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|file|image|max:5120', // max 5MB
        ]);

        $path = $request->file('image')->store('fields', 'public');

        return response()->json([
            'url' => asset('storage/' . $path),
        ]);
    }
}
