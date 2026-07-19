<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfileResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'onboarding_completed' => $this->resource['onboarding_completed'],
            'role'                 => $this->resource['role'],
            'is_owner_verified'    => $this->resource['is_owner_verified'],
            'username'             => $this->resource['username'] ?? null,
            'region'               => $this->resource['region'] ?? null,
            'avatar_url'           => $this->resource['avatar_url'] ?? null,
            'age'                  => $this->resource['age'] ?? null,
            'sports'               => $this->resource['sports'],
            'full_name'            => $this->resource['full_name'],
            'email'                => $this->resource['email'],
        ];
    }
}
