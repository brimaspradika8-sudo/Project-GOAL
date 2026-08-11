<?php

namespace App\Http\Controllers\Field;

use App\Http\Controllers\Controller;
use App\Http\Requests\Field\StoreFieldRequest;
use App\Http\Requests\Field\UpdateFieldRequest;
use App\Http\Requests\Field\ApproveFieldRequest;
use App\Http\Resources\FieldResource;
use App\Models\Field;
use App\Models\SuperAdminAuditLog;
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
        return $this->successResponse('Daftar lapangan berhasil dimuat.', FieldResource::collection($paginator->items()), 200, [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $sport = $request->query('sport');
        $minPrice = $request->query('min_price');
        $maxPrice = $request->query('max_price');
        $sort = $request->query('sort', 'latest');
        $page = max(1, (int) $request->query('page', 1));

        $hasPriceFilter = is_numeric($minPrice) || is_numeric($maxPrice);
        $fields = $search || $hasPriceFilter || $sort !== 'latest' || $page > 1
            ? $this->fieldService->listApproved($search, $sport, $page, $minPrice, $maxPrice, $sort)
            : $this->fieldService->listApprovedCached(null, $sport, $page);

        return $this->paginatedResponse($fields);
    }

    public function show(int $id, Request $request): JsonResponse
    {
        $field = $this->fieldService->findApproved($id);

        if (!$field) {
            return $this->errorResponse('Lapangan tidak ditemukan.', [], 404);
        }

        $user = $request->user();
        if ($user) {
            $isOwner = $field->owner_id === $user->id;
            $isAdmin = $user->profile?->role === Profile::ROLE_SUPER_ADMIN;
            if ($isOwner || $isAdmin) {
                $field->makeVisible(['rejection_reason', 'approved_by']);
            }
        }

        return $this->resourceResponse('Lapangan berhasil dimuat.', new FieldResource($field));
    }

    public function store(StoreFieldRequest $request): JsonResponse
    {
        $field = $this->fieldService->create(
            $request->user(),
            $request->validated()
        );

        $this->fieldService->invalidateCache();

        return $this->resourceResponse('Lapangan berhasil dibuat.', new FieldResource($field->load('owner:id,name')), 201);
    }

    public function update(UpdateFieldRequest $request, int $id): JsonResponse
    {
        $field = $this->fieldService->find($id);

        if (!$field) {
            return $this->errorResponse('Lapangan tidak ditemukan.', [], 404);
        }

        $user = $request->user();
        $isAdmin = $user->profile?->role === Profile::ROLE_SUPER_ADMIN;

        if (!$isAdmin && $field->owner_id !== $user->id) {
            return $this->errorResponse('Anda bukan pemilik lapangan ini.', [], 403);
        }

        $field = $this->fieldService->update($field, $request->validated(), $user, $isAdmin);

        $this->fieldService->invalidateCache();

        return $this->resourceResponse('Lapangan berhasil diperbarui.', new FieldResource($field));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $field = $this->fieldService->find($id);

        if (!$field) {
            return $this->errorResponse('Lapangan tidak ditemukan.', [], 404);
        }

        $profile = $request->user()->profile;
        $isOwner = $field->owner_id === $request->user()->id;
        $isAdmin = $profile && $profile->role === Profile::ROLE_SUPER_ADMIN;

        if (!$isOwner && !$isAdmin) {
            return $this->errorResponse('Anda bukan pemilik lapangan ini.', [], 403);
        }

        $this->fieldService->delete($field, $request->user());

        $this->fieldService->invalidateCache();

        return $this->successResponse('Lapangan berhasil dihapus.');
    }

    public function pending(): JsonResponse
    {
        $fields = $this->fieldService->listPending();
        foreach ($fields->items() as $field) {
            $field->makeVisible(['rejection_reason', 'approved_by']);
        }

        return $this->paginatedResponse($fields);
    }

    public function myFields(Request $request): JsonResponse
    {
        $fields = $this->fieldService->listByOwner($request->user());
        foreach ($fields->items() as $field) {
            $field->makeVisible(['rejection_reason', 'approved_by']);
        }

        return $this->paginatedResponse($fields);
    }

    public function approve(ApproveFieldRequest $request, int $id): JsonResponse
    {
        $field = $this->fieldService->find($id);

        if (!$field) {
            return $this->errorResponse('Lapangan tidak ditemukan.', [], 404);
        }

        try {
            $field = $this->fieldService->approve(
                $field,
                $request->user(),
                $request->status,
                $request->reason
            );
        } catch (\RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), [], 422);
        }

        $this->fieldService->invalidateCache();

        SuperAdminAuditLog::create([
            'actor_id' => $request->user()->id,
            'action' => 'field.' . $request->status,
            'target_type' => 'field',
            'target_id' => $field->id,
            'metadata' => ['reason' => $request->reason],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $field->makeVisible(['rejection_reason', 'approved_by']);

        return $this->resourceResponse('Status lapangan berhasil diperbarui.', new FieldResource($field));
    }

    public function trashed(): JsonResponse
    {
        $fields = $this->fieldService->listTrashed();
        foreach ($fields->items() as $field) {
            $field->makeVisible(['rejection_reason', 'approved_by']);
        }

        return $this->paginatedResponse($fields);
    }

    public function restore(int $id): JsonResponse
    {
        $success = $this->fieldService->restore($id);

        if (!$success) {
            return $this->errorResponse('Lapangan tidak ditemukan di tempat sampah.', [], 404);
        }

        $this->fieldService->invalidateCache();

        SuperAdminAuditLog::create([
            'actor_id' => request()->user()->id,
            'action' => 'field.restored',
            'target_type' => 'field',
            'target_id' => $id,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        return $this->successResponse('Lapangan berhasil dipulihkan.');
    }

    public function forceDelete(int $id): JsonResponse
    {
        $success = $this->fieldService->forceDelete($id);

        if (!$success) {
            return $this->errorResponse('Lapangan tidak ditemukan di tempat sampah.', [], 404);
        }

        $this->fieldService->invalidateCache();

        SuperAdminAuditLog::create([
            'actor_id' => request()->user()->id,
            'action' => 'field.force_deleted',
            'target_type' => 'field',
            'target_id' => $id,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        return $this->successResponse('Lapangan berhasil dihapus permanen.');
    }

    public function bulkApprove(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['required', 'integer'],
            'status' => ['required', 'in:approved,rejected'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $count = $this->fieldService->approveBatch($data['ids'], $request->user(), $data['status'], $data['reason'] ?? null);

        $this->fieldService->invalidateCache();

        SuperAdminAuditLog::create([
            'actor_id' => $request->user()->id,
            'action' => 'field.bulk_' . $data['status'],
            'metadata' => ['ids' => $data['ids'], 'processed' => $count],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $verb = $data['status'] === 'approved' ? 'disetujui' : 'ditolak';

        return $this->successResponse("{$count} lapangan berhasil {$verb}.", ['processed' => $count]);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['required', 'integer'],
        ]);

        $count = $this->fieldService->deleteBatch($data['ids'], $request->user());

        $this->fieldService->invalidateCache();

        return $this->successResponse("{$count} lapangan berhasil dihapus.", ['deleted' => $count]);
    }

    public function bulkRestore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['required', 'integer'],
        ]);

        $count = $this->fieldService->restoreBatch($data['ids']);

        $this->fieldService->invalidateCache();

        return $this->successResponse("{$count} lapangan berhasil dipulihkan.", ['restored' => $count]);
    }

    public function bulkForceDelete(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['required', 'integer'],
        ]);

        $count = $this->fieldService->forceDeleteBatch($data['ids']);

        $this->fieldService->invalidateCache();

        return $this->successResponse("{$count} lapangan berhasil dihapus permanen.", ['deleted' => $count]);
    }
}
