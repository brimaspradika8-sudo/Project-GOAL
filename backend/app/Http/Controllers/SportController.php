<?php

namespace App\Http\Controllers;

use App\Models\Sport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SportController extends Controller
{
    /**
     * Get list of sports (Public/Authenticated).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Sport::query();

        // If not super admin or specifically requested, only show active sports
        if (!$request->user() || $request->user()->role !== 'super_admin') {
            $query->where('is_active', true);
        } else if ($request->has('active_only')) {
            $query->where('is_active', true);
        }

        $sports = $query->orderBy('name', 'asc')->get();

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
            'name'        => 'required|string|max:100|unique:sports,name',
            'is_active'   => 'nullable|boolean',
        ], [
            'name.required' => 'Nama olahraga wajib diisi.',
            'name.unique'   => 'Nama olahraga sudah ada.',
        ]);

        $slug = \Str::slug($validated['name'], '_');

        $sport = Sport::create([
            'name'        => trim($validated['name']),
            'slug'        => $slug,
            'description' => isset($validated['description']) ? trim($validated['description']) : null,
            'is_active'   => $validated['is_active'] ?? true,
        ]);

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
            'name'        => 'required|string|max:100|unique:sports,name,' . $id,
            'description' => 'nullable|string|max:500',
            'is_active'   => 'nullable|boolean',
        ], [
            'name.required' => 'Nama olahraga wajib diisi.',
            'name.unique'   => 'Nama olahraga sudah ada.',
        ]);

        $slug = \Str::slug($validated['name'], '_');

        $sport->update([
            'name'        => trim($validated['name']),
            'slug'        => $slug,
            'description' => isset($validated['description']) ? trim($validated['description']) : null,
            'is_active'   => $validated['is_active'] ?? $sport->is_active,
        ]);

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

        return response()->json([
            'status'  => 'success',
            'message' => 'Jenis olahraga berhasil dihapus.',
        ]);
    }
}
