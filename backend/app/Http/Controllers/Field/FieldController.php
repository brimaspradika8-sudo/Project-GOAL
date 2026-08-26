<?php

namespace App\Http\Controllers\Field;

use App\Http\Controllers\Controller;
use App\Http\Requests\Field\ApproveFieldRequest;
use App\Http\Requests\Field\StoreFieldRequest;
use App\Http\Requests\Field\UpdateFieldRequest;
use App\Http\Resources\FieldResource;
use App\Models\Field;
use App\Models\FieldImage;
use App\Models\Profile;
use App\Policies\FieldPolicy;
use App\Services\FieldService;
use App\Services\SupabaseStorageService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * @tags Lapangan (Fields)
 */
class FieldController extends Controller
{
    public function __construct(
        private FieldService $fieldService,
        private SupabaseStorageService $storage
    ) {}

    private function paginatedResponse(LengthAwarePaginator $paginator): JsonResponse
    {
        return $this->successResponse('Daftar lapangan berhasil dimuat.', FieldResource::collection($paginator->items()), 200, [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'search'    => ['nullable', 'string', 'max:255'],
            'sport'     => ['nullable', 'string', 'max:50'],
            'min_price' => ['nullable', 'integer', 'min:0'],
            'max_price' => ['nullable', 'integer', 'min:0'],
            'sort'      => ['nullable', 'string', 'in:latest,price_asc,price_desc'],
            'page'      => ['nullable', 'integer', 'min:1'],
        ]);

        $search = $data['search'] ?? null;
        $sport = $data['sport'] ?? null;
        $minPrice = $data['min_price'] ?? null;
        $maxPrice = $data['max_price'] ?? null;
        $sort = $data['sort'] ?? 'latest';
        $page = $data['page'] ?? 1;

        $hasPriceFilter = $minPrice !== null || $maxPrice !== null;
        $fields = $search || $hasPriceFilter || $sort !== 'latest' || $page > 1
            ? $this->fieldService->listApproved($search, $sport, $page, $minPrice, $maxPrice, $sort)
            : $this->fieldService->listApprovedCached(null, $sport, $page);

        return $this->paginatedResponse($fields);
    }

    public function show(int $id, Request $request): JsonResponse
    {
        $field = $this->fieldService->findApproved($id);

        if (! $field) {
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

        if (! $field) {
            return $this->errorResponse('Lapangan tidak ditemukan.', [], 404);
        }

        $user = $request->user();
        $isAdmin = $user->profile?->role === Profile::ROLE_SUPER_ADMIN;

        $this->authorizeField($request, 'update', $field);

        $field = $this->fieldService->update($field, $request->validated(), $user, $isAdmin);

        $this->fieldService->invalidateCache();

        return $this->resourceResponse('Lapangan berhasil diperbarui.', new FieldResource($field));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $field = $this->fieldService->find($id);

        if (! $field) {
            return $this->errorResponse('Lapangan tidak ditemukan.', [], 404);
        }

        try {
            $this->authorizeField($request, 'delete', $field);
            $this->fieldService->delete($field, $request->user());
            $this->fieldService->invalidateCache();

            return $this->successResponse('Lapangan berhasil dihapus.');
        } catch (AuthorizationException $e) {
            return $this->errorResponse('Anda tidak berhak menghapus lapangan ini.', [], 403);
        } catch (\Throwable $e) {
            Log::error('Field deletion failed', ['id' => $id, 'error' => $e->getMessage()]);
            return $this->errorResponse('Gagal menghapus lapangan: '.$e->getMessage(), [], 500);
        }
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
        $data = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'sport'  => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'string', 'in:approved,pending,rejected'],
            'page'   => ['nullable', 'integer', 'min:1'],
        ]);

        $fields = $this->fieldService->listByOwner(
            $request->user(),
            $data['search'] ?? null,
            $data['sport'] ?? null,
            $data['status'] ?? null,
            $data['page'] ?? 1
        );

        foreach ($fields->items() as $field) {
            $field->makeVisible(['rejection_reason', 'approved_by']);
        }

        return $this->paginatedResponse($fields);
    }

    public function approve(ApproveFieldRequest $request, int $id): JsonResponse
    {
        $field = $this->fieldService->find($id);

        if (! $field) {
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

        if (! $success) {
            return $this->errorResponse('Lapangan tidak ditemukan di tempat sampah.', [], 404);
        }

        $this->fieldService->invalidateCache();

        return $this->successResponse('Lapangan berhasil dipulihkan.');
    }

    public function forceDelete(int $id): JsonResponse
    {
        $success = $this->fieldService->forceDelete($id);

        if (! $success) {
            return $this->errorResponse('Lapangan tidak ditemukan di tempat sampah.', [], 404);
        }

        $this->fieldService->invalidateCache();

        return $this->successResponse('Lapangan berhasil dihapus permanen.');
    }

    public function storeImage(Request $request, int $id): JsonResponse
    {
        $field = $this->fieldService->find($id);

        if (! $field) {
            return $this->errorResponse('Lapangan tidak ditemukan.', [], 404);
        }

        $this->authorizeField($request, 'update', $field);

        $data = $request->validate([
            'image' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'is_primary' => ['sometimes', 'boolean'],
        ]);

        $currentCount = $field->images()->count();

        if ($currentCount >= 5) {
            return $this->errorResponse('Maksimal 5 foto per lapangan.', [], 422);
        }

        $file = $request->file('image');

        try {
            $extension = strtolower($file->extension());
            $filename = bin2hex(random_bytes(16)).'.'.$extension;
            $path = 'fields/'.$field->id.'/'.$filename;

            $mime = $file->getMimeType() ?: 'image/jpeg';
            $contents = file_get_contents($file->getRealPath());
            $publicUrl = $this->storage->upload($path, $contents, $mime);

            $isPrimary = $currentCount === 0 || filter_var($data['is_primary'] ?? false, FILTER_VALIDATE_BOOL);

            if ($isPrimary) {
                $field->images()->where('is_primary', true)->update(['is_primary' => false]);
            }

            $field->images()->create([
                'image_path' => $publicUrl,
                'is_primary' => $isPrimary,
            ]);

            $this->syncPrimaryImageUrl($field);

            $this->fieldService->invalidateCache();

            return $this->resourceResponse('Foto berhasil ditambahkan.', new FieldResource($field->load('images')), 201);
        } catch (\Exception $e) {
            Log::error('Field image upload exception: '.$e->getMessage(), [
                'exception' => get_class($e),
            ]);

            return $this->errorResponse('Gagal mengunggah foto. Silakan coba lagi.', [], 500);
        }
    }

    public function setPrimaryImage(Request $request, int $imageId): JsonResponse
    {
        $image = FieldImage::with('field')->find($imageId);

        if (! $image || ! $image->field) {
            return $this->errorResponse('Foto tidak ditemukan.', [], 404);
        }

        $this->authorizeField($request, 'update', $image->field);

        $image->field->images()->where('is_primary', true)->update(['is_primary' => false]);
        $image->update(['is_primary' => true]);

        $this->syncPrimaryImageUrl($image->field);

        $this->fieldService->invalidateCache();

        return $this->resourceResponse('Foto utama berhasil diubah.', new FieldResource($image->field->load('images')));
    }

    public function destroyImage(Request $request, int $imageId): JsonResponse
    {
        $image = FieldImage::with('field')->find($imageId);

        if (! $image || ! $image->field) {
            return $this->errorResponse('Foto tidak ditemukan.', [], 404);
        }

        $this->authorizeField($request, 'update', $image->field);

        $field = $image->field;

        if ($field->images()->count() <= 1) {
            return $this->errorResponse('Lapangan wajib memiliki minimal 1 gambar utama.', [], 422);
        }
        $wasPrimary = $image->is_primary;

        try {
            $this->storage->delete($image->image_path);
        } catch (\Exception $e) {
            Log::warning('Gagal menghapus foto lapangan dari storage: '.$e->getMessage());
        }

        $image->delete();

        if ($wasPrimary) {
            $newPrimary = $field->images()->first();
            if ($newPrimary) {
                $newPrimary->update(['is_primary' => true]);
            }
        }

        $this->syncPrimaryImageUrl($field);

        $this->fieldService->invalidateCache();

        return $this->resourceResponse('Foto berhasil dihapus.', new FieldResource($field->load('images')));
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

    private function authorizeField(Request $request, string $ability, Field $field): void
    {
        $policy = app(FieldPolicy::class);

        if (! $policy->{$ability}($request->user(), $field)) {
            throw new AuthorizationException('This action is unauthorized.');
        }
    }

    private function syncPrimaryImageUrl(Field $field): void
    {
        $primary = $field->images()->where('is_primary', true)->first();

        if ($primary) {
            $field->forceFill(['image_url' => $primary->image_path])->save();
        }
    }
}
