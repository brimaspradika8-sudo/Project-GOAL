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
            'user_id'       => $user->id,
            'name'          => $data['name'],
            'email'         => $data['email'],
            'business_name' => $data['business_name'],
            'address'       => $data['address'],
            'phone'         => $data['phone'],
            'status'        => 'pending',
        ]);
    }

    public function listPending(): LengthAwarePaginator
    {
        return OwnerRequest::where('status', 'pending')
            ->with('user:id,name,email')
            ->latest()
            ->paginate(15);
    }

    public function approve(OwnerRequest $request, User $reviewer): OwnerRequest
    {
        return DB::transaction(function () use ($request, $reviewer) {
            $request->update([
                'status'      => 'approved',
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now(),
            ]);

            Profile::where('user_id', $request->user_id)
                ->update(['role' => 'owner', 'is_owner_verified' => true]);

            return $request->fresh('user:id,name,email');
        });
    }

    public function reject(OwnerRequest $request, User $reviewer, ?string $reason): OwnerRequest
    {
        $request->update([
            'status'          => 'rejected',
            'rejection_reason' => $reason,
            'reviewed_by'     => $reviewer->id,
            'reviewed_at'     => now(),
        ]);

        return $request->fresh('user:id,name,email');
    }

    public function listByUser(User $user): ?OwnerRequest
    {
        return OwnerRequest::where('user_id', $user->id)
            ->latest()
            ->first();
    }
}
