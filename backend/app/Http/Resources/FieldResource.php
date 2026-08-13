<?php

namespace App\Http\Resources;

use App\Models\Profile;
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
            $isAdmin = $user->profile?->role === Profile::ROLE_SUPER_ADMIN;
            $showModeration = $isOwner || $isAdmin;
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'sport_type' => $this->sport_type,
            'location' => $this->location,
            'description' => $this->description,
            'price_per_hour' => $this->price_per_hour,
            'open_time' => $this->open_time ? substr((string) $this->open_time, 0, 5) : null,
            'close_time' => $this->close_time ? substr((string) $this->close_time, 0, 5) : null,
            'session_duration_minutes' => $this->session_duration_minutes,
            'buffer_duration_minutes' => $this->buffer_duration_minutes,
            'image_url' => $this->image_url,
            'images' => $this->whenLoaded('images', fn () => $this->images->map(fn ($image) => [
                'id' => $image->id,
                'field_id' => $image->field_id,
                'image_path' => $image->image_path,
                'is_primary' => $image->is_primary,
                'created_at' => $image->created_at?->toISOString(),
            ])),
            'status' => $this->status,
            'approved_at' => $this->approved_at?->toISOString(),
            'approved_by' => $this->when($showModeration, $this->approved_by),
            'rejection_reason' => $this->when($showModeration, $this->rejection_reason),
            'owner' => $this->whenLoaded('owner', fn () => [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
            ]),
            'approver' => $this->whenLoaded('approver', fn () => [
                'id' => $this->approver->id,
                'name' => $this->approver->name,
            ]),
            'prices' => $this->whenLoaded('prices', fn () => $this->prices->map(fn ($price) => [
                'id' => $price->id,
                'field_id' => $price->field_id,
                'start_time' => substr((string) $price->start_time, 0, 5),
                'end_time' => substr((string) $price->end_time, 0, 5),
                'price' => $price->price,
                'created_at' => $price->created_at?->toISOString(),
                'updated_at' => $price->updated_at?->toISOString(),
            ])),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
