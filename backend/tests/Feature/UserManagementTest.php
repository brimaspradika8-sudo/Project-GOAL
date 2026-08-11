<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_update_role(): void
    {
        $superAdmin = $this->userWithRole(UserRole::SUPER_ADMIN);
        $player = $this->userWithRole(UserRole::PLAYER);

        $this->authAs($superAdmin)
            ->putJson("/api/super-admin/users/{$player->id}/role", ['role' => UserRole::OWNER->value])
            ->assertOk();

        $this->assertDatabaseHas('profiles', [
            'user_id' => $player->id,
            'role' => UserRole::OWNER->value,
        ]);
    }

    public function test_player_cannot_update_role(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $target = $this->userWithRole(UserRole::PLAYER);

        $this->authAs($player)
            ->putJson("/api/super-admin/users/{$target->id}/role", ['role' => UserRole::OWNER->value])
            ->assertForbidden();
    }

    public function test_owner_cannot_update_role(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $target = $this->userWithRole(UserRole::PLAYER);

        $this->authAs($owner)
            ->putJson("/api/super-admin/users/{$target->id}/role", ['role' => UserRole::OWNER->value])
            ->assertForbidden();
    }

    private function userWithRole(UserRole $role, bool $verifiedOwner = false): User
    {
        $user = User::factory()->create();

        Profile::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'full_name' => $user->name,
            'username' => 'managed_user_' . $user->id,
            'role' => $role->value,
            'is_owner_verified' => $verifiedOwner,
            'onboarding_completed' => true,
        ]);

        return $user->load('profile');
    }

    private function authAs(User $user): self
    {
        return $this->withHeader('Authorization', 'Bearer ' . $user->createToken('test-token')->plainTextToken);
    }
}
