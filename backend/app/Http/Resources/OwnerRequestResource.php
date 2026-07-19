<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OwnerRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'name'             => $this->name,
            'email'            => $this->email,
            'business_name'    => $this->business_name,
            'address'          => $this->address,
            'phone'            => $this->phone,
            'status'           => $this->status,
            'rejection_reason' => $this->rejection_reason,
            'reviewed_at'      => $this->reviewed_at?->toISOString(),
            'user'             => $this->whenLoaded('user', fn () => [
                'id'   => $this->user->id,
                'name' => $this->user->name,
            ]),
            'reviewer'         => $this->whenLoaded('reviewer', fn () => [
                'id'   => $this->reviewer->id,
                'name' => $this->reviewer->name,
            ]),
            'created_at'       => $this->created_at->toISOString(),
        ];
    }
}
