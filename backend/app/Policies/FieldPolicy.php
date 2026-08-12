<?php

namespace App\Policies;

use App\Models\Field;
use App\Models\Profile;
use App\Models\User;

class FieldPolicy
{
    public function view(User $user, Field $field): bool
    {
        return $this->isSuperAdmin($user) || $field->owner_id === $user->id;
    }

    public function update(User $user, Field $field): bool
    {
        return $this->view($user, $field);
    }

    public function delete(User $user, Field $field): bool
    {
        return $this->view($user, $field);
    }

    public function monitor(User $user, Field $field): bool
    {
        return $this->view($user, $field);
    }

    private function isSuperAdmin(User $user): bool
    {
        return $user->profile?->role === Profile::ROLE_SUPER_ADMIN;
    }
}
