<?php

namespace App\Services;

use App\Enums\SportType;
use App\Models\Field;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use App\Services\SupabaseStorageService;

class FieldService
{
    private string $cachePrefix = 'fields_';
    private int $cacheTtl = 60;

    public function __construct(
        private SupabaseStorageService $storage,
        private NotificationService $notifications
    ) {}

    private const SPORT_ALIASES = [
        'futsal'      => ['futsal'],
        'basketball'  => ['basketball', 'basket'],
        'badminton'   => ['badminton'],
        'volleyball'  => ['volleyball', 'voli'],
        'tennis'      => ['tennis', 'tenis'],
        'mini_soccer' => ['mini_soccer'],
        'other'       => ['other', 'lainnya'],
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

    private function applySportFilter($query, string $sport): void
    {
        $aliases = self::sportAliases($sport);
        $query->where(function ($q) use ($aliases) {
            foreach ($aliases as $alias) {
                $q->orWhereRaw('LOWER(sport_type) = ?', [strtolower($alias)]);
            }
        });
    }

    public function listApproved(?string $search = null, ?string $sport = null, int $page = 1): LengthAwarePaginator
    {
        $query = Field::approved()->with('owner:id,name');

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

        return $query->latest()->paginate(15, ['*'], 'page', $page);
    }

    public function listApprovedCached(?string $search = null, ?string $sport = null, int $page = 1): LengthAwarePaginator
    {
        if ($search || $page > 1) {
            return $this->listApproved($search, $sport, $page);
        }

        $cacheKey = $this->cachePrefix . 'approved_' . strtolower($sport ?? 'all');

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
        Cache::forget($this->cachePrefix . 'approved_all');
        foreach (SportType::values() as $sport) {
            Cache::forget($this->cachePrefix . 'approved_' . strtolower($sport));
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

    public function findApproved(int $id): ?Field
    {
        return Field::approved()->with('owner:id,name')->find($id);
    }

    public function create(User $user, array $data): Field
    {
        $isSuperAdmin = $user->profile?->role === 'super_admin';

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

        return $field;
    }

    public function update(Field $field, array $data, User $user, bool $isAdmin = false): Field
    {
        if (!$isAdmin && $field->owner_id !== $user->id) {
            throw new \RuntimeException('Anda bukan pemilik lapangan ini.');
        }

        $allowed = collect($data)->only([
            'name', 'sport_type', 'location', 'description', 'price_per_hour', 'image_url',
        ])->filter(fn ($v) => $v !== null)->toArray();

        if (array_key_exists('image_url', $allowed) && $field->image_url && $allowed['image_url'] !== $field->image_url) {
            $this->storage->delete($field->image_url);
        }

        $field->update($allowed);

        if ($field->status === 'rejected') {
            $field->forceFill([
                'status' => 'pending',
                'approved_by' => null,
                'approved_at' => null,
            ])->save();
        }

        return $field->fresh('owner:id,name');
    }

    public function delete(Field $field): bool
    {
        if ($field->image_url) {
            $this->storage->delete($field->image_url);
        }
        return $field->delete();
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

        if (!$owner) {
            return;
        }

        $approved = $status === 'approved';

        $this->notifications->create(
            $owner,
            $approved ? Notification::TYPE_FIELD_APPROVED : Notification::TYPE_FIELD_REJECTED,
            $approved ? 'Lapangan Disetujui' : 'Lapangan Ditolak',
            $approved
                ? "Lapangan {$field->name} sudah disetujui dan sekarang tampil untuk umum."
                : "Lapangan {$field->name} ditolak." . ($reason ? " Alasan: {$reason}" : ''),
            [
                'field_id' => $field->id,
                'field_name' => $field->name,
                'status' => $status,
            ]
        );
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

        if (!$field) return false;

        if ($field->image_url) {
            $this->storage->delete($field->image_url);
        }

        return (bool) $field->forceDelete();
    }
}
