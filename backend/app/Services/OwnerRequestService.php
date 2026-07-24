<?php

namespace App\Services;

use App\Models\OwnerRequest;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class OwnerRequestService
{
    public function getPendingRequest(User $user): ?OwnerRequest
    {
        return OwnerRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();
    }

    public function submit(User $user, array $data): OwnerRequest
    {
        return OwnerRequest::create([
            'user_id' => $user->id,
            'name' => $data['name'],
            'email' => $data['email'],
            'business_name' => $data['business_name'],
            'address' => $data['address'],
            'phone' => $data['phone'],
            'status' => 'pending',
        ]);
    }

    public function listPending(): LengthAwarePaginator
    {
        return OwnerRequest::where('status', 'pending')
            ->with('user:id,name,email')
            ->latest()
            ->paginate(15);
    }

    public function review(OwnerRequest $request, User $reviewer, string $status, ?string $reason = null): OwnerRequest
    {
        if ($request->status !== 'pending') {
            throw new \RuntimeException('Pengajuan sudah diproses sebelumnya.');
        }

        if ($request->user_id === $reviewer->id) {
            throw new \RuntimeException('Tidak dapat memproses pengajuan sendiri.');
        }

        return DB::transaction(function () use ($request, $reviewer, $status, $reason): OwnerRequest {
            if ($status === 'approved') {
                $request->update([
                    'status' => 'approved',
                    'reviewed_by' => $reviewer->id,
                    'reviewed_at' => now(),
                ]);

                Profile::where('user_id', $request->user_id)
                    ->update(['role' => 'owner', 'is_owner_verified' => true]);
            } else {
                $request->update([
                    'status' => 'rejected',
                    'rejection_reason' => $reason,
                    'reviewed_by' => $reviewer->id,
                    'reviewed_at' => now(),
                ]);
            }

            return $request->fresh('user:id,name,email');
        });
    }

    public function listByUser(User $user): ?OwnerRequest
    {
        return OwnerRequest::where('user_id', $user->id)
            ->latest()
            ->first();
    }
}
