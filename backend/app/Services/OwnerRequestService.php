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
        return DB::transaction(function () use ($user, $data) {
            $pending = OwnerRequest::where('user_id', $user->id)
                ->where('status', 'pending')
                ->lockForUpdate()
                ->first();

            if ($pending) {
                throw new \RuntimeException('Anda sudah memiliki pengajuan yang sedang diproses.');
            }

            return OwnerRequest::create([
                'user_id' => $user->id,
                'name' => $data['name'],
                'email' => $data['email'],
                'business_name' => $data['business_name'],
                'address' => $data['address'],
                'phone' => $data['phone'],
                'status' => 'pending',
            ]);
        });
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
        return DB::transaction(function () use ($request, $reviewer, $status, $reason) {
            $request->refresh();

            if ($request->status !== 'pending') {
                throw new \RuntimeException('Pengajuan sudah diproses sebelumnya.');
            }

            if ($request->user_id === $reviewer->id) {
                throw new \RuntimeException('Tidak dapat memproses pengajuan sendiri.');
            }

            if ($status === 'approved') {
                $request->update([
                    'status' => 'approved',
                    'reviewed_by' => $reviewer->id,
                    'reviewed_at' => now(),
                ]);

                $profile = Profile::where('user_id', $request->user_id)->first();

                if (!$profile) {
                    throw new \RuntimeException('Profil user tidak ditemukan.');
                }

                $profile->forceFill(['role' => 'owner', 'is_owner_verified' => true])->save();
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
