<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FieldResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $showModeration = false;
        if ($user) {
            $isOwner = $this->owner_id === $user->id;
            $isAdmin = $user->profile?->role === 'super_admin';
            $showModeration = $isOwner || $isAdmin;
        }

        return [
            'id'              => $this->id,
            'name'            => $this->name,
            'sport_type'      => $this->sport_type,
            'location'        => $this->location,
            'description'     => $this->description,
            'price_per_hour'  => $this->price_per_hour,
            'image_url'       => $this->image_url,
            'status'          => $this->status,
            'approved_at'     => $this->approved_at?->toISOString(),
            'approved_by'     => $showModeration ? $this->approved_by : $this->when(false),
            'rejection_reason'=> $showModeration ? $this->rejection_reason : $this->when(false),
            'owner'           => $this->whenLoaded('owner', fn () => [
                'id'   => $this->owner->id,
                'name' => $this->owner->name,
            ]),
            'approver'        => $this->whenLoaded('approver', fn () => [
                'id'   => $this->approver->id,
                'name' => $this->approver->name,
            ]),
            'created_at'      => $this->created_at?->toISOString(),
            'updated_at'      => $this->updated_at?->toISOString(),
        ];
    }
}
