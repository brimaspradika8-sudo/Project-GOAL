<?php

namespace App\Services;

use App\Models\Field;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;

class FieldService
{
    private string $cachePrefix = 'fields_';
    private int $cacheTtl = 300;

    public function listApproved(?string $search = null, ?string $sport = null, int $page = 1): LengthAwarePaginator
    {
        $query = Field::approved()->with('owner:id,name');

        if ($search) {
            $searchTerm = "%{$search}%";
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'ilike', $searchTerm)
                    ->orWhere('location', 'ilike', $searchTerm);
            });
        }

        if ($sport) {
            $query->where(function ($q) use ($sport) {
                $q->where('sport_type', $sport)
                  ->orWhereRaw('LOWER(sport_type) = ?', [strtolower($sport)]);
            });
        }

        return $query->latest()->paginate(15, ['*'], 'page', $page);
    }

    public function listApprovedCached(?string $search = null, ?string $sport = null, int $page = 1): LengthAwarePaginator
    {
        if ($search || $page > 1) {
            return $this->listApproved($search, $sport, $page);
        }

        $cacheKey = $this->cachePrefix . 'approved_' . strtolower($sport ?? 'all');

        return Cache::remember($cacheKey, $this->cacheTtl, function () use ($sport) {
            return Field::approved()
                ->with('owner:id,name')
                ->when($sport, fn ($q) => $q->where(function ($sq) use ($sport) {
                    $sq->where('sport_type', $sport)
                       ->orWhereRaw('LOWER(sport_type) = ?', [strtolower($sport)]);
                }))
                ->latest()
                ->paginate(15);
        });
    }

    public function invalidateCache(): void
    {
        Cache::forget($this->cachePrefix . 'approved_all');
<<<<<<< HEAD
<<<<<<< HEAD
        foreach (['futsal', 'basketball', 'basket', 'badminton', 'mini_soccer', 'tennis', 'tenis', 'volleyball', 'voli', 'other', 'lainnya'] as $sport) {
=======
=======

>>>>>>> 4ea81c7 (memeprbaiki ux)
        foreach (config('goal.sport_types', []) as $sport) {
>>>>>>> 80644d4 (fix backend)
            Cache::forget($this->cachePrefix . 'approved_' . $sport);
        }
    }

    public function listPending(): LengthAwarePaginator
    {
        return Field::pending()
            ->with('owner:id,name')
            ->latest()
            ->paginate(15);
    }

    public function listByOwner(User $user): LengthAwarePaginator
    {
        return Field::where('owner_id', $user->id)
            ->with(['owner:id,name', 'approver:id,name'])
            ->latest()
            ->paginate(15);
    }

    public function find(int $id): ?Field
    {
        return Field::with('owner:id,name')->find($id);
    }

    public function create(User $user, array $data): Field
    {
        $isSuperAdmin = $user->profile?->role === 'super_admin';

        return Field::create([
            'owner_id' => $user->id,
            'name' => $data['name'],
            'sport_type' => $data['sport_type'],
            'location' => $data['location'] ?? null,
            'description' => $data['description'] ?? null,
            'price_per_hour' => $data['price_per_hour'] ?? null,
            'image_url' => $data['image_url'] ?? null,
            'status' => $isSuperAdmin ? 'approved' : 'pending',
            'approved_by' => $isSuperAdmin ? $user->id : null,
            'approved_at' => $isSuperAdmin ? now() : null,
        ]);
    }

    public function update(Field $field, array $data, bool $isAdmin = false): Field
    {
        $field->update($data);

        $shouldResetApproval = $field->status === 'rejected' || ($field->status === 'approved' && !$isAdmin);

        if ($shouldResetApproval) {
            $field->update([
                'status' => 'pending',
                'approved_by' => null,
                'approved_at' => null,
            ]);
        }

        return $field->fresh('owner:id,name');
    }

    public function delete(Field $field): bool
    {
        return $field->delete();
    }

    public function approve(Field $field, User $approver, string $status, ?string $reason = null): Field
    {
        $field->update([
            'status' => $status,
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'rejection_reason' => $status === 'rejected' ? $reason : null,
        ]);

        return $field->fresh('owner:id,name', 'approver:id,name');
    }

    public function listTrashed(): LengthAwarePaginator
    {
        return Field::onlyTrashed()
            ->with('owner:id,name')
            ->latest('deleted_at')
            ->paginate(15);
    }

    public function restore(int $id): bool
    {
        $field = Field::onlyTrashed()->find($id);

        return $field ? (bool) $field->restore() : false;
    }

    public function forceDelete(int $id): bool
    {
        $field = Field::onlyTrashed()->find($id);

        return $field ? (bool) $field->forceDelete() : false;
    }
}
