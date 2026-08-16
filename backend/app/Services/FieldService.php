<?php

namespace App\Services;

use App\Enums\SportType;
use App\Jobs\SendFieldStatusNotification;
use App\Models\Field;
use App\Models\Notification;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class FieldService
{
    private string $cachePrefix = 'fields_';

    private int $cacheTtl = 300; // 5 menit — cukup untuk production, cache di-invalidate saat field berubah

    public function __construct(
        private SupabaseStorageService $storage,
        private NotificationService $notifications
    ) {}

    private const SPORT_ALIASES = [
        'futsal' => ['futsal'],
        'basketball' => ['basketball', 'basket'],
        'badminton' => ['badminton'],
        'volleyball' => ['volleyball', 'voli'],
        'tennis' => ['tennis', 'tenis'],
        'mini_soccer' => ['mini_soccer'],
        'other' => ['other', 'lainnya'],
    ];

    private static function sportAliases(string $sport): array
    {
        $key = strtolower($sport);

        foreach (self::SPORT_ALIASES as $canonical => $variants) {
            if (in_array($key, $variants, true)) {
                return $variants;
            }
        }

        return [$sport];
    }

    private static function normalizeSport(?string $sport): string
    {
        if (! $sport) {
            return 'all';
        }

        $key = strtolower($sport);

        foreach (self::SPORT_ALIASES as $canonical => $variants) {
            if (in_array($key, $variants, true)) {
                return $canonical;
            }
        }

        return $key;
    }

    private function applySportFilter($query, string $sport): void
    {
        $aliases = self::sportAliases($sport);
        $query->where(function ($q) use ($aliases) {
            foreach ($aliases as $alias) {
                $q->orWhereRaw('LOWER(sport_type) = ?', [strtolower($alias)]);
            }
        });
    }

    public function listApproved(?string $search = null, ?string $sport = null, int $page = 1, mixed $minPrice = null, mixed $maxPrice = null, string $sort = 'latest'): LengthAwarePaginator
    {
        $query = Field::approved()->with('owner:id,name')->with('images');

        if ($search) {
            $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search);
            $searchTerm = "%{$escaped}%";
            $query->where(function ($q) use ($searchTerm) {
                $q->whereRaw('LOWER(name) LIKE ?', [$searchTerm])
                    ->orWhereRaw('LOWER(location) LIKE ?', [$searchTerm]);
            });
        }

        if ($sport) {
            $this->applySportFilter($query, $sport);
        }

        if (is_numeric($minPrice)) {
            $query->where('price_per_hour', '>=', (int) $minPrice);
        }

        if (is_numeric($maxPrice)) {
            $query->where('price_per_hour', '<=', (int) $maxPrice);
        }

        match ($sort) {
            'price_asc' => $query->orderBy('price_per_hour')->orderByDesc('created_at'),
            'price_desc' => $query->orderByDesc('price_per_hour')->orderByDesc('created_at'),
            default => $query->latest(),
        };

        return $query->paginate(15, ['*'], 'page', $page);
    }

    public function listApprovedCached(?string $search = null, ?string $sport = null, int $page = 1): LengthAwarePaginator
    {
        if ($search || $page > 1) {
            return $this->listApproved($search, $sport, $page);
        }

        $cacheKey = $this->cachePrefix.'approved_'.self::normalizeSport($sport);

        return Cache::remember($cacheKey, $this->cacheTtl, function () use ($sport) {
            $query = Field::approved()
                ->with('owner:id,name')
                ->latest();

            if ($sport) {
                $this->applySportFilter($query, $sport);
            }

            return $query->paginate(15);
        });
    }

    public function invalidateCache(): void
    {
        Cache::forget($this->cachePrefix.'approved_all');
        foreach (SportType::values() as $sport) {
            Cache::forget($this->cachePrefix.'approved_'.strtolower($sport));
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
        $query = Field::query();

        if ($user->profile?->role !== Profile::ROLE_SUPER_ADMIN) {
            $query->where('owner_id', $user->id);
        }

        return $query
            ->with(['owner:id,name', 'approver:id,name', 'prices', 'images'])
            ->latest()
            ->paginate(15);
    }

    public function find(int $id): ?Field
    {
        return Field::with('owner:id,name')->with('images')->find($id);
    }

    public function findApproved(int $id): ?Field
    {
        return Field::approved()->with('owner:id,name')->with('images')->find($id);
    }

    public function findApprovedWithPrices(int $id): ?Field
    {
        return Field::approved()->with(['owner:id,name', 'prices', 'images'])->find($id);
    }

    public function create(User $user, array $data): Field
    {
        $isSuperAdmin = $user->profile?->role === Profile::ROLE_SUPER_ADMIN;

        $field = Field::create([
            'owner_id' => $user->id,
            'name' => $data['name'],
            'sport_type' => $data['sport_type'],
            'location' => $data['location'] ?? null,
            'description' => $data['description'] ?? null,
            'price_per_hour' => $data['price_per_hour'] ?? null,
            'image_url' => $data['image_url'] ?? null,
        ]);

        $field->forceFill([
            'status' => $isSuperAdmin ? 'approved' : 'pending',
            'approved_by' => $isSuperAdmin ? $user->id : null,
            'approved_at' => $isSuperAdmin ? now() : null,
        ])->save();

        if (! $isSuperAdmin) {
            $this->notifications->createForRole(
                Profile::ROLE_SUPER_ADMIN,
                Notification::TYPE_FIELD_SUBMITTED,
                'Pengajuan Lapangan Baru',
                "Lapangan baru \"{$field->name}\" diajukan oleh {$user->name} dan menunggu persetujuan.",
                ['field_id' => $field->id, 'field_name' => $field->name, 'status' => 'pending']
            );
        }

        return $field;
    }

    public function update(Field $field, array $data, User $user, bool $isAdmin = false): Field
    {
        if (! $isAdmin && $field->owner_id !== $user->id) {
            throw new \RuntimeException('Anda bukan pemilik lapangan ini.');
        }

        $allowedKeys = ['name', 'sport_type', 'location', 'description', 'price_per_hour', 'image_url'];
        $allowed = array_intersect_key($data, array_flip($allowedKeys));

        $oldImageUrl = null;
        if (array_key_exists('image_url', $allowed) && $field->image_url && $allowed['image_url'] !== $field->image_url) {
            $oldImageUrl = $field->image_url;
        }

        $field->update($allowed);

        if ($oldImageUrl) {
            try {
                $this->storage->delete($oldImageUrl);
            } catch (\Exception $e) {
                Log::warning('Gagal menghapus gambar lapangan lama: '.$e->getMessage());
            }
        }

        if ($field->status === 'rejected') {
            $field->forceFill([
                'status' => 'pending',
                'approved_by' => null,
                'approved_at' => null,
            ])->save();
        }

        if ($isAdmin) {
            $owner = $field->owner;
            if ($owner) {
                $this->notifications->create(
                    $owner,
                    Notification::TYPE_FIELD_UPDATED,
                    'Lapangan Diperbarui',
                    "Lapangan \"{$field->name}\" Anda diperbarui oleh super admin.",
                    ['field_id' => $field->id, 'field_name' => $field->name]
                );
            }
        } else {
            $this->notifications->createForRole(
                Profile::ROLE_SUPER_ADMIN,
                Notification::TYPE_FIELD_UPDATED,
                'Lapangan Diperbarui',
                "Lapangan \"{$field->name}\" diperbarui oleh pemiliknya.",
                ['field_id' => $field->id, 'field_name' => $field->name]
            );
        }

        return $field->fresh('owner:id,name');
    }

    public function delete(Field $field, User $actor): bool
    {
        $this->notifyFieldDeletion($field, $actor);

        return $field->delete();
    }

    private function notifyFieldDeletion(Field $field, User $actor): void
    {
        $isAdmin = $actor->profile?->role === Profile::ROLE_SUPER_ADMIN;

        if ($isAdmin) {
            $owner = $field->owner;
            if ($owner) {
                $this->notifications->create(
                    $owner,
                    Notification::TYPE_FIELD_DELETED,
                    'Lapangan Dihapus',
                    "Lapangan \"{$field->name}\" Anda telah dihapus oleh super admin.",
                    ['field_id' => $field->id, 'field_name' => $field->name]
                );
            }
        } else {
            $this->notifications->createForRole(
                Profile::ROLE_SUPER_ADMIN,
                Notification::TYPE_FIELD_DELETED,
                'Lapangan Dihapus',
                "Lapangan \"{$field->name}\" dihapus oleh pemiliknya.",
                ['field_id' => $field->id, 'field_name' => $field->name]
            );
        }
    }

    public function approveBatch(array $ids, User $approver, string $status, ?string $reason = null): int
    {
        $processed = 0;

        Field::with('owner:id,name')
            ->whereIn('id', $ids)
            ->get()
            ->each(function (Field $field) use ($approver, $status, $reason, &$processed) {
                if ($field->owner_id === $approver->id) {
                    return;
                }

                $field->forceFill([
                    'status' => $status,
                    'approved_by' => $approver->id,
                    'approved_at' => now(),
                    'rejection_reason' => $status === 'rejected' ? $reason : null,
                ])->save();

                $this->notifyOwner($field, $status, $reason);
                $processed++;
            });

        return $processed;
    }

    public function deleteBatch(array $ids, User $actor): int
    {
        $deleted = 0;

        Field::with('owner:id,name')
            ->whereIn('id', $ids)
            ->get()
            ->each(function (Field $field) use ($actor, &$deleted) {
                $this->notifyFieldDeletion($field, $actor);
                $field->delete();
                $deleted++;
            });

        return $deleted;
    }

    public function restoreBatch(array $ids): int
    {
        return (int) Field::onlyTrashed()->whereIn('id', $ids)->restore();
    }

    public function forceDeleteBatch(array $ids): int
    {
        $deleted = 0;

        Field::onlyTrashed()
            ->whereIn('id', $ids)
            ->get()
            ->each(function (Field $field) use (&$deleted) {
                if ($field->image_url) {
                    $this->storage->delete($field->image_url);
                }

                $field->forceDelete();
                $deleted++;
            });

        return $deleted;
    }

    public function approve(Field $field, User $approver, string $status, ?string $reason = null): Field
    {
        if ($field->owner_id === $approver->id) {
            throw new \RuntimeException('Tidak dapat memproses lapangan sendiri.');
        }

        $field->forceFill([
            'status' => $status,
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'rejection_reason' => $status === 'rejected' ? $reason : null,
        ])->save();

        $this->notifyOwner($field, $status, $reason);

        return $field->fresh('owner:id,name', 'approver:id,name');
    }

    private function notifyOwner(Field $field, string $status, ?string $reason = null): void
    {
        $owner = $field->owner;

        if (! $owner) {
            return;
        }

        SendFieldStatusNotification::dispatch($field->id, $owner->id, $status, $reason);
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

        if (! $field) {
            return false;
        }

        if ($field->image_url) {
            $this->storage->delete($field->image_url);
        }

        return (bool) $field->forceDelete();
    }
}
