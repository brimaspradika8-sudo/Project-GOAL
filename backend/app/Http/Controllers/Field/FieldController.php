<?php

namespace App\Http\Controllers\Field;

use App\Http\Controllers\Controller;
use App\Http\Requests\Field\StoreFieldRequest;
use App\Http\Requests\Field\UpdateFieldRequest;
use App\Http\Requests\Field\ApproveFieldRequest;
use App\Http\Resources\FieldResource;
use App\Models\Field;
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
        $page = (int) $request->query('page', 1);

        $fields = $search || $page > 1
            ? $this->fieldService->listApproved($search, $sport, $page)
            : $this->fieldService->listApprovedCached(null, $sport, $page);

        return $this->paginatedResponse($fields);
    }

    public function show(int $id): JsonResponse
    {
        $field = $this->fieldService->find($id);

        if (!$field) {
            return response()->json(['message' => 'Lapangan tidak ditemukan.'], 404);
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

        $profile = $request->user()->profile;
        $isOwner = $field->owner_id === $request->user()->id;
        $isAdmin = $profile && in_array($profile->role, ['admin', 'super_admin']);

        if (!$isOwner && !$isAdmin) {
            return response()->json(['message' => 'Anda bukan pemilik lapangan ini.'], 403);
        }

        $field = $this->fieldService->update($field, $request->validated());

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
        $isAdmin = $profile && in_array($profile->role, ['admin', 'super_admin']);

        if (!$isOwner && !$isAdmin) {
            return response()->json(['message' => 'Anda bukan pemilik lapangan ini.'], 403);
        }

        $this->fieldService->delete($field);

        $this->fieldService->invalidateCache();

        return response()->json(['message' => 'Lapangan berhasil dihapus.']);
    }

    public function pending(): JsonResponse
    {
        $fields = $this->fieldService->listPending();

        return $this->paginatedResponse($fields);
    }

    public function myFields(Request $request): JsonResponse
    {
        $fields = $this->fieldService->listByOwner($request->user());

        return $this->paginatedResponse($fields);
    }

    public function approve(ApproveFieldRequest $request, int $id): JsonResponse
    {
        $field = $this->fieldService->find($id);

        if (!$field) {
            return response()->json(['message' => 'Lapangan tidak ditemukan.'], 404);
        }

        $field = $this->fieldService->approve(
            $field,
            $request->user(),
            $request->status
        );

        $this->fieldService->invalidateCache();

        return response()->json(new FieldResource($field));
    }

    public function trashed(): JsonResponse
    {
        $fields = $this->fieldService->listTrashed();

        return $this->paginatedResponse($fields);
    }

    public function restore(int $id): JsonResponse
    {
        $field = \App\Models\Field::onlyTrashed()->find($id);

        if (!$field) {
            return response()->json(['message' => 'Lapangan tidak ditemukan.'], 404);
        }

        $field = $this->fieldService->restore($field);

        return response()->json(new FieldResource($field));
    }

    public function forceDelete(int $id): JsonResponse
    {
        $field = \App\Models\Field::onlyTrashed()->find($id);

        if (!$field) {
            return response()->json(['message' => 'Lapangan tidak ditemukan.'], 404);
        }

        $this->fieldService->forceDelete($field);

        return response()->json(['message' => 'Lapangan berhasil dihapus permanen.']);
    }
}
