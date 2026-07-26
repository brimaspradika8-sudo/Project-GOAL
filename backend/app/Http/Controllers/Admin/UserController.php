<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password as PasswordRule;

class UserController extends Controller
{
    public function __construct(private UserService $userService) {}

    public function index(Request $request): JsonResponse
    {
        $users = $this->userService->listUsers($request->search, $request->role);

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => ['required', 'string', PasswordRule::min(8)->mixedCase()->numbers()],
            'role' => 'nullable|in:owner,player,super_admin',
        ]);

        $currentUser = $request->user();
        $requestedRole = $data['role'] ?? 'player';

        if ($requestedRole === 'super_admin' && $currentUser->profile?->role !== 'super_admin') {
            return response()->json(['message' => 'Hanya Super Admin yang dapat membuat akun Super Admin.'], 403);
        }

        $user = $this->userService->createUser($data);

        return response()->json($user, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => "sometimes|required|email|unique:users,email,{$id}",
            'password' => ['nullable', 'string', PasswordRule::min(8)->mixedCase()->numbers()],
        ]);

        $user = User::with('profile')->findOrFail($id);
        $updatedUser = $this->userService->updateUser($user, $data);

        return response()->json($updatedUser);
    }

    public function updateRole(Request $request, int $id): JsonResponse
    {
        $request->validate(['role' => 'required|in:player,owner,super_admin']);

        $user = User::with('profile')->findOrFail($id);

        if (!$user->profile) {
            return response()->json(['message' => 'Profil tidak ditemukan.'], 404);
        }

        try {
            $this->userService->updateRole($user, $request->role, $request->user());
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 403);
        }

        return response()->json(['message' => 'Role berhasil diperbarui.', 'role' => $request->role]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = User::with('profile')->findOrFail($id);

        try {
            $this->userService->deleteUser($user, $request->user());
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 403);
        }

        return response()->json(['message' => 'User berhasil dihapus.']);
    }
}
