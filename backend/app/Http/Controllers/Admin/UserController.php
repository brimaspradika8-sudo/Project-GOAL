<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::with('profile')
            ->when($request->search, fn($q, $v) => $q->where('name', 'like', "%{$v}%")->orWhere('email', 'like', "%{$v}%"))
            ->when($request->role, fn($q, $v) => $q->whereHas('profile', fn($q) => $q->where('role', $v)))
            ->latest()
            ->paginate(20);

        return response()->json($users);
    }

    public function updateRole(Request $request, int $id): JsonResponse
    {
        $request->validate(['role' => 'required|in:player,owner,admin,super_admin']);

        $user = User::with('profile')->findOrFail($id);

        if (!$user->profile) {
            return response()->json(['message' => 'Profil tidak ditemukan.'], 404);
        }

        $user->profile->update(['role' => $request->role]);

        return response()->json(['message' => 'Role berhasil diperbarui.', 'role' => $request->role]);
    }

    public function destroy(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->profile) {
            $user->profile->delete();
        }

        $user->delete();

        return response()->json(['message' => 'User berhasil dihapus.']);
    }
}
