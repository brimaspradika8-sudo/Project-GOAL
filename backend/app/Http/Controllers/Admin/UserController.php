<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role'     => 'nullable|in:owner,player,admin',
        ]);

        $user = DB::transaction(function () use ($data) {
            $user = User::create([
                'name'     => $data['name'],
                'email'    => $data['email'],
                'password' => Hash::make($data['password']),
            ]);

            Profile::create([
                'user_id'  => $user->id,
                'email'    => $data['email'],
                'full_name'=> $data['name'],
                'role'     => $data['role'] ?? 'owner',
                'username' => 'user_' . $user->id,
            ]);

            return $user->load('profile');
        });

        return response()->json($user, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'sometimes|required|string|max:255',
            'email'    => "sometimes|required|email|unique:users,email,{$id}",
            'password' => 'nullable|string|min:8',
        ]);

        $user = User::with('profile')->findOrFail($id);

        if (isset($data['name']))  $user->name  = $data['name'];
        if (isset($data['email'])) $user->email = $data['email'];
        if (!empty($data['password'])) $user->password = Hash::make($data['password']);
        $user->save();

        if ($user->profile) {
            $profileUpdate = [];
            if (isset($data['name']))  $profileUpdate['full_name'] = $data['name'];
            if (isset($data['email'])) $profileUpdate['email']     = $data['email'];
            if (!empty($profileUpdate)) $user->profile->update($profileUpdate);
        }

        return response()->json($user->fresh('profile'));
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
        if ((int) auth()->id() === $id) {
            return response()->json(['message' => 'Anda tidak bisa menghapus akun Anda sendiri.'], 403);
        }

        $user = User::findOrFail($id);

        if ($user->profile) {
            $user->profile->delete();
        }

        $user->delete();

        return response()->json(['message' => 'User berhasil dihapus.']);
    }
}
