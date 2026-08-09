<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAuditLog;
use App\Models\Profile;
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

    public function auditLogs(Request $request): JsonResponse
    {
        $logs = AdminAuditLog::with('actor:id,name,email')
            ->when($request->filled('action'), fn ($query) => $query->where('action', $request->string('action')))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = '%' . addcslashes($request->string('search'), '%_') . '%';
                $query->where(function ($nested) use ($search) {
                    $nested->where('action', 'like', $search)
                        ->orWhere('target_type', 'like', $search)
                        ->orWhereHas('actor', fn ($actor) => $actor->where('name', 'like', $search)->orWhere('email', 'like', $search));
                });
            })
            ->latest()
            ->paginate(30);

        $logs->getCollection()->transform(function (AdminAuditLog $log) {
            return [
                'id' => $log->id,
                'action' => $log->action,
                'target_type' => $log->target_type,
                'target_id' => $log->target_id,
                'metadata' => $log->metadata,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at,
                'actor' => $log->actor ? [
                    'id' => $log->actor->id,
                    'name' => $log->actor->name,
                    'email' => $log->actor->email,
                ] : null,
            ];
        });

        return response()->json($logs);
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

        if ($requestedRole === Profile::ROLE_SUPER_ADMIN && $currentUser->profile?->role !== Profile::ROLE_SUPER_ADMIN) {
            return response()->json(['message' => 'Hanya Super Admin yang dapat membuat akun Super Admin.'], 403);
        }

        $user = $this->userService->createUser($data);
        $this->recordAudit($request, 'user.created', $user, ['role' => $requestedRole]);

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
        $this->recordAudit($request, 'user.updated', $updatedUser, ['fields' => array_keys($data)]);

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

        $this->recordAudit($request, 'user.role_updated', $user, ['role' => $request->role]);

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

        $this->recordAudit($request, 'user.deleted', $user);

        return response()->json(['message' => 'User berhasil dihapus.']);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['required', 'integer'],
        ]);

        try {
            $count = $this->userService->deleteUsers($data['ids'], $request->user());
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 403);
        }

        $this->recordAudit($request, 'user.bulk_deleted', null, ['ids' => $data['ids'], 'deleted' => $count]);

        return response()->json(['message' => "{$count} user berhasil dihapus.", 'deleted' => $count]);
    }

    private function recordAudit(Request $request, string $action, ?User $target = null, array $metadata = []): void
    {
        AdminAuditLog::create([
            'actor_id' => $request->user()?->id,
            'action' => $action,
            'target_type' => $target ? 'user' : null,
            'target_id' => $target?->id,
            'metadata' => $metadata ?: null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }
}
