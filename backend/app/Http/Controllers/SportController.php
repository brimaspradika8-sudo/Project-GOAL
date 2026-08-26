<?php

namespace App\Http\Controllers;

use App\Models\Sport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SportController extends Controller
{
    /**
     * Get list of sports (Public/Authenticated).
     */
    public function index(Request $request): JsonResponse
    {
        $isSuperAdmin = $request->user() && $request->user()->role === 'super_admin' && !$request->has('active_only');
        $cacheKey = $isSuperAdmin ? 'sports_all' : 'sports_active';

        $sports = Cache::remember($cacheKey, 86400, function () use ($isSuperAdmin) {
            $query = Sport::query();
            if (!$isSuperAdmin) {
                $query->where('is_active', true);
            }
            return $query->orderBy('name', 'asc')->get();
        });

        return response()->json([
            'status' => 'success',
            'data'   => $sports,
        ]);
    }

    /**
     * Store new sport (Super Admin only).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|min:5|max:50|unique:sports,name',
            'is_active'   => 'nullable|boolean',
        ], [
            'name.required' => 'Nama olahraga wajib diisi.',
            'name.min'      => 'Nama olahraga minimal 5 karakter.',
            'name.max'      => 'Nama olahraga maksimal 50 karakter.',
            'name.unique'   => 'Nama olahraga sudah ada.',
        ]);

        $slug = \Str::slug($validated['name'], '_');

        $sport = Sport::create([
            'name'        => trim($validated['name']),
            'is_active'   => $validated['is_active'] ?? true,
        ]);

        $this->invalidateCache();

        return response()->json([
            'status'  => 'success',
            'message' => 'Jenis olahraga berhasil ditambahkan.',
            'data'    => $sport,
        ], 201);
    }

    /**
     * Update sport (Super Admin only).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $sport = Sport::findOrFail($id);

        $validated = $request->validate([
            'name'        => 'required|string|min:5|max:50|unique:sports,name,' . $id,
            'is_active'   => 'nullable|boolean',
        ], [
            'name.required' => 'Nama olahraga wajib diisi.',
            'name.min'      => 'Nama olahraga minimal 5 karakter.',
            'name.max'      => 'Nama olahraga maksimal 50 karakter.',
            'name.unique'   => 'Nama olahraga sudah ada.',
        ]);

        $slug = \Str::slug($validated['name'], '_');

        $sport->update([
            'name'        => trim($validated['name']),
            'is_active'   => $validated['is_active'] ?? $sport->is_active,
        ]);

        $this->invalidateCache();

        return response()->json([
            'status'  => 'success',
            'message' => 'Jenis olahraga berhasil diperbarui.',
            'data'    => $sport,
        ]);
    }

    /**
     * Delete sport (Super Admin only).
     */
    public function destroy(int $id): JsonResponse
    {
        $sport = Sport::findOrFail($id);

        // Check if any field uses this sport slug
        $isUsed = \DB::table('fields')->where('sport_type', $sport->slug)->exists();
        if ($isUsed) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Jenis olahraga tidak dapat dihapus karena sedang digunakan oleh lapangan.',
            ], 422);
        }

        $sport->delete();
        $this->invalidateCache();

        return response()->json([
            'status'  => 'success',
            'message' => 'Jenis olahraga berhasil dihapus.',
        ]);
    }

    private function invalidateCache(): void
    {
        Cache::forget('sports_all');
        Cache::forget('sports_active');
    }
}
