<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'user_id'          => $this->user_id,
            'field_id'         => $this->field_id,
            'booking_date'     => $this->booking_date?->format('Y-m-d'),
            'start_time'       => substr((string) $this->start_time, 0, 5),
            'end_time'         => substr((string) $this->end_time, 0, 5),
            'duration_minutes' => $this->duration_minutes,
            'total_price'      => $this->total_price,
            'payment_method'   => $this->payment_method ?? 'cash',
            'status'           => $this->status,
            'expired_at'         => $this->expired_at?->toISOString(),
            'payment_expired_at' => $this->payment_expired_at?->toISOString(),
            'approved_at'      => $this->approved_at?->toISOString(),
            'rejected_at'      => $this->rejected_at?->toISOString(),
            'rejection_reason' => $this->rejection_reason,
            'cancelled_at'     => $this->cancelled_at?->toISOString(),
            'cancel_reason'    => $this->cancel_reason,
            'confirmed_at'     => $this->confirmed_at?->toISOString(),
            'confirmed_by'     => $this->confirmed_by,
            'completed_at'     => $this->completed_at?->toISOString(),
            'created_at'       => $this->created_at?->toISOString(),
            'field'            => $this->whenLoaded('field', fn () => [
                'id'              => $this->field->id,
                'name'            => $this->field->name,
                'sport_type'      => $this->field->sport_type,
                'location'        => $this->field->location,
                'image_url'       => $this->field->image_url,
                'price_per_hour'  => $this->field->price_per_hour,
                'session_duration_minutes' => $this->field->session_duration_minutes,
                'owner_id'        => $this->field->owner_id ?? null,
            ]),
            'user'             => $this->whenLoaded('user', fn () => [
                'id'   => $this->user->id,
                'name' => $this->user->name,
            ]),
        ];
    }
}
