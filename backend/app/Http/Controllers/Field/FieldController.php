<?php

namespace App\Http\Controllers\Field;

use App\Http\Controllers\Controller;
use App\Http\Requests\Field\StoreFieldRequest;
use App\Http\Requests\Field\UpdateFieldRequest;
use App\Http\Requests\Field\ApproveFieldRequest;
use App\Http\Resources\FieldResource;
use App\Models\Field;
use App\Models\Profile;
use App\Services\FieldService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FieldController extends Controller
{
    public function __construct(
        private FieldService $fieldService
    ) {}

    private function paginatedResponse(LengthAwarePaginator $paginator): JsonResponse
    {
        return response()->json([
            'data' => FieldResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $sport = $request->query('sport');
        $page = max(1, (int) $request->query('page', 1));

        $fields = $search || $page > 1
            ? $this->fieldService->listApproved($search, $sport, $page)
            : $this->fieldService->listApprovedCached(null, $sport, $page);

        return $this->paginatedResponse($fields);
    }

    public function show(int $id, Request $request): JsonResponse
    {
        $field = $this->fieldService->findApproved($id);

        if (!$field) {
            return response()->json(['message' => 'Lapangan tidak ditemukan.'], 404);
        }

        $user = $request->user();
        if ($user) {
            $isOwner = $field->owner_id === $user->id;
            $isAdmin = $user->profile?->role === Profile::ROLE_SUPER_ADMIN;
            if ($isOwner || $isAdmin) {
                $field->makeVisible(['rejection_reason', 'approved_by']);
            }
        }

        return response()->json(new FieldResource($field));
    }

    public function store(StoreFieldRequest $request): JsonResponse
    {
        $field = $this->fieldService->create(
            $request->user(),
            $request->validated()
        );

        $this->fieldService->invalidateCache();

        return response()->json(new FieldResource($field->load('owner:id,name')), 201);
    }

    public function update(UpdateFieldRequest $request, int $id): JsonResponse
    {
        $field = $this->fieldService->find($id);

        if (!$field) {
            return response()->json(['message' => 'Lapangan tidak ditemukan.'], 404);
        }

        $user = $request->user();
        $isAdmin = $user->profile?->role === Profile::ROLE_SUPER_ADMIN;

        if (!$isAdmin && $field->owner_id !== $user->id) {
            return response()->json(['message' => 'Anda bukan pemilik lapangan ini.'], 403);
        }

        $field = $this->fieldService->update($field, $request->validated(), $user, $isAdmin);

        $this->fieldService->invalidateCache();

        return response()->json(new FieldResource($field));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $field = $this->fieldService->find($id);

        if (!$field) {
            return response()->json(['message' => 'Lapangan tidak ditemukan.'], 404);
        }

        $profile = $request->user()->profile;
        $isOwner = $field->owner_id === $request->user()->id;
        $isAdmin = $profile && $profile->role === Profile::ROLE_SUPER_ADMIN;

        if (!$isOwner && !$isAdmin) {
            return response()->json(['message' => 'Anda bukan pemilik lapangan ini.'], 403);
        }

        $this->fieldService->delete($field, $request->user());

        $this->fieldService->invalidateCache();

        return response()->json(['message' => 'Lapangan berhasil dihapus.']);
    }

    public function pending(): JsonResponse
    {
        $fields = $this->fieldService->listPending();
        $fields->getCollection()->makeVisible(['rejection_reason', 'approved_by']);

        return $this->paginatedResponse($fields);
    }

    public function myFields(Request $request): JsonResponse
    {
        $fields = $this->fieldService->listByOwner($request->user());
        $fields->getCollection()->makeVisible(['rejection_reason', 'approved_by']);

        return $this->paginatedResponse($fields);
    }

    public function approve(ApproveFieldRequest $request, int $id): JsonResponse
    {
        $field = $this->fieldService->find($id);

        if (!$field) {
            return response()->json(['message' => 'Lapangan tidak ditemukan.'], 404);
        }

        try {
            $field = $this->fieldService->approve(
                $field,
                $request->user(),
                $request->status,
                $request->reason
            );
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $this->fieldService->invalidateCache();

        $field->makeVisible(['rejection_reason', 'approved_by']);

        return response()->json(new FieldResource($field));
    }

    public function trashed(): JsonResponse
    {
        $fields = $this->fieldService->listTrashed();
        $fields->getCollection()->makeVisible(['rejection_reason', 'approved_by']);

        return $this->paginatedResponse($fields);
    }

    public function restore(int $id): JsonResponse
    {
        $success = $this->fieldService->restore($id);

        if (!$success) {
            return response()->json(['message' => 'Lapangan tidak ditemukan di tempat sampah.'], 404);
        }

        $this->fieldService->invalidateCache();

        return response()->json(['message' => 'Lapangan berhasil dipulihkan.']);
    }

    public function forceDelete(int $id): JsonResponse
    {
        $success = $this->fieldService->forceDelete($id);

        if (!$success) {
            return response()->json(['message' => 'Lapangan tidak ditemukan di tempat sampah.'], 404);
        }

        $this->fieldService->invalidateCache();

        return response()->json(['message' => 'Lapangan berhasil dihapus permanen.']);
    }

    public function bulkApprove(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer'],
            'status' => ['required', 'in:approved,rejected'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $count = $this->fieldService->approveBatch($data['ids'], $request->user(), $data['status'], $data['reason'] ?? null);

        $this->fieldService->invalidateCache();

        $verb = $data['status'] === 'approved' ? 'disetujui' : 'ditolak';

        return response()->json(['message' => "{$count} lapangan berhasil {$verb}.", 'processed' => $count]);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer'],
        ]);

        $count = $this->fieldService->deleteBatch($data['ids'], $request->user());

        $this->fieldService->invalidateCache();

        return response()->json(['message' => "{$count} lapangan berhasil dihapus.", 'deleted' => $count]);
    }

    public function bulkRestore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer'],
        ]);

        $count = $this->fieldService->restoreBatch($data['ids']);

        $this->fieldService->invalidateCache();

        return response()->json(['message' => "{$count} lapangan berhasil dipulihkan.", 'restored' => $count]);
    }

    public function bulkForceDelete(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer'],
        ]);

        $count = $this->fieldService->forceDeleteBatch($data['ids']);

        $this->fieldService->invalidateCache();

        return response()->json(['message' => "{$count} lapangan berhasil dihapus permanen.", 'deleted' => $count]);
    }
}
