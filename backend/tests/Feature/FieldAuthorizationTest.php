<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Field;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FieldAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_creates_field_with_pending_status(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);

        $response = $this->authAs($owner)->postJson('/api/fields', $this->fieldPayload());

        $response->assertCreated()
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('fields', [
            'owner_id' => $owner->id,
            'status' => 'pending',
        ]);
    }

    public function test_super_admin_approves_field(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $superAdmin = $this->userWithRole(UserRole::SUPER_ADMIN);
        $field = $this->fieldFor($owner);

        $this->authAs($superAdmin)
            ->postJson("/api/fields/{$field->id}/approve", ['status' => 'approved'])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->assertDatabaseHas('fields', [
            'id' => $field->id,
            'status' => 'approved',
            'approved_by' => $superAdmin->id,
        ]);
    }

    private function userWithRole(UserRole $role, bool $verifiedOwner = false): User
    {
        $user = User::factory()->create();

        Profile::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'full_name' => $user->name,
            'username' => 'field_user_' . $user->id,
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

    private function fieldFor(User $owner): Field
    {
        return Field::create($this->fieldPayload(['owner_id' => $owner->id]));
    }

    private function fieldPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Lapangan Final Stabil',
            'sport_type' => 'futsal',
            'location' => 'Jl. Stabil 1',
            'description' => 'Lapangan untuk pengujian final.',
            'price_per_hour' => 100000,
            'image_url' => 'https://via.placeholder.com/640x480.png',
        ], $overrides);
    }
}
