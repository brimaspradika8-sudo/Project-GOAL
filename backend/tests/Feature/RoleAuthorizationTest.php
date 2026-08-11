<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Field;
use App\Models\OwnerRequest;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_player_cannot_create_field_or_access_owner_and_super_admin_areas(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);

        $this->authAs($player)
            ->postJson('/api/fields', $this->fieldPayload())
            ->assertForbidden();

        $this->getJson('/api/fields/my/list')
            ->assertOk();

        $this->getJson('/api/fields/pending/list')
            ->assertForbidden();

        $this->getJson('/api/super-admin/users')
            ->assertForbidden();
    }

    public function test_owner_can_create_and_manage_own_field(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);

        $createResponse = $this->authAs($owner)
            ->postJson('/api/fields', $this->fieldPayload(['name' => 'Arena Owner Test']))
            ->assertCreated();

        $fieldId = $createResponse->json('data.id') ?? $createResponse->json('id');
        $this->assertNotNull($fieldId);

        $this->assertDatabaseHas('fields', [
            'id' => $fieldId,
            'owner_id' => $owner->id,
            'status' => 'pending',
        ]);

        $this->authAs($owner)
            ->putJson("/api/fields/{$fieldId}", ['name' => 'Arena Owner Updated'])
            ->assertOk();

        $this->assertDatabaseHas('fields', [
            'id' => $fieldId,
            'name' => 'Arena Owner Updated',
        ]);
    }

    public function test_owner_cannot_manage_another_owners_field(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $otherOwner = $this->userWithRole(UserRole::OWNER, true);
        $field = $this->fieldFor($otherOwner);

        $this->authAs($owner)
            ->putJson("/api/fields/{$field->id}", ['name' => 'Illegal Update'])
            ->assertForbidden();
    }

    public function test_super_admin_can_approve_owner_request(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $superAdmin = $this->userWithRole(UserRole::SUPER_ADMIN);

        $ownerRequest = OwnerRequest::create([
            'user_id' => $player->id,
            'name' => $player->name,
            'email' => $player->email,
            'business_name' => 'Goal Arena',
            'address' => 'Jl. Stabil 1',
            'phone' => '081234567890',
            'status' => 'pending',
        ]);

        $this->authAs($superAdmin)
            ->postJson("/api/owner-requests/{$ownerRequest->id}/review", ['status' => 'approved'])
            ->assertOk();

        $this->assertDatabaseHas('owner_requests', [
            'id' => $ownerRequest->id,
            'status' => 'approved',
            'reviewed_by' => $superAdmin->id,
        ]);

        $this->assertDatabaseHas('profiles', [
            'user_id' => $player->id,
            'role' => UserRole::OWNER->value,
            'is_owner_verified' => true,
        ]);
    }

    public function test_super_admin_can_approve_field(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $superAdmin = $this->userWithRole(UserRole::SUPER_ADMIN);
        $field = $this->fieldFor($owner);

        $this->authAs($superAdmin)
            ->postJson("/api/fields/{$field->id}/approve", ['status' => 'approved'])
            ->assertOk();

        $this->assertDatabaseHas('fields', [
            'id' => $field->id,
            'status' => 'approved',
            'approved_by' => $superAdmin->id,
        ]);
    }

    public function test_super_admin_can_manage_users(): void
    {
        $superAdmin = $this->userWithRole(UserRole::SUPER_ADMIN);

        $this->authAs($superAdmin)
            ->getJson('/api/super-admin/users')
            ->assertOk();
    }

    private function userWithRole(UserRole $role, bool $verifiedOwner = false): User
    {
        $user = User::factory()->create();

        Profile::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'full_name' => $user->name,
            'username' => 'user_' . $user->id,
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

    private function fieldFor(User $owner, array $overrides = []): Field
    {
        return Field::create(array_merge([
            'owner_id' => $owner->id,
            'name' => 'Lapangan Test',
            'sport_type' => 'futsal',
            'location' => 'Jl. Test',
            'description' => 'Lapangan untuk test.',
            'price_per_hour' => 100000,
        ], $overrides));
    }

    private function fieldPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Lapangan Stabil',
            'sport_type' => 'futsal',
            'location' => 'Jl. Stabil 1',
            'description' => 'Lapangan stabil untuk pengujian.',
            'price_per_hour' => 100000,
        ], $overrides);
    }
}
