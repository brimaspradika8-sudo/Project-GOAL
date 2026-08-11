<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Field;
use App\Models\FieldPrice;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingConfigurationTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_update_own_field_schedule(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $field = $this->fieldFor($owner);

        $this->authAs($owner)
            ->patchJson("/api/owner/fields/{$field->id}/schedule", $this->schedulePayload())
            ->assertOk()
            ->assertJsonPath('data.open_time', '07:00')
            ->assertJsonPath('data.close_time', '23:00');

        $this->assertDatabaseHas('fields', [
            'id' => $field->id,
            'session_duration_minutes' => 60,
            'buffer_duration_minutes' => 30,
        ]);
    }

    public function test_owner_can_create_and_update_field_price(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $field = $this->fieldFor($owner);

        $createResponse = $this->authAs($owner)
            ->postJson("/api/owner/fields/{$field->id}/prices", [
                'start_time' => '07:00',
                'end_time' => '17:00',
                'price' => 70000,
            ])
            ->assertCreated()
            ->assertJsonPath('data.price', 70000);

        $priceId = $createResponse->json('data.id');

        $this->authAs($owner)
            ->putJson("/api/owner/prices/{$priceId}", [
                'start_time' => '08:00',
                'end_time' => '17:00',
                'price' => 80000,
            ])
            ->assertOk()
            ->assertJsonPath('data.price', 80000);

        $this->assertDatabaseHas('field_prices', [
            'id' => $priceId,
            'price' => 80000,
        ]);
    }

    public function test_owner_cannot_update_another_owners_field_schedule(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $otherOwner = $this->userWithRole(UserRole::OWNER, true);
        $field = $this->fieldFor($otherOwner);

        $this->authAs($owner)
            ->patchJson("/api/owner/fields/{$field->id}/schedule", $this->schedulePayload())
            ->assertForbidden();
    }

    public function test_player_cannot_access_owner_booking_configuration_endpoint(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $field = $this->fieldFor($owner);

        $this->authAs($player)
            ->patchJson("/api/owner/fields/{$field->id}/schedule", $this->schedulePayload())
            ->assertForbidden();
    }

    public function test_super_admin_can_update_field_schedule(): void
    {
        $superAdmin = $this->userWithRole(UserRole::SUPER_ADMIN);
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $field = $this->fieldFor($owner);

        $this->authAs($superAdmin)
            ->patchJson("/api/owner/fields/{$field->id}/schedule", $this->schedulePayload())
            ->assertOk();
    }

    public function test_price_overlap_is_rejected(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $field = $this->fieldFor($owner);

        FieldPrice::create([
            'field_id' => $field->id,
            'start_time' => '07:00',
            'end_time' => '17:00',
            'price' => 70000,
        ]);

        $this->authAs($owner)
            ->postJson("/api/owner/fields/{$field->id}/prices", [
                'start_time' => '16:00',
                'end_time' => '23:00',
                'price' => 120000,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('start_time');
    }

    public function test_owner_can_delete_field_price(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $field = $this->fieldFor($owner);

        $price = FieldPrice::create([
            'field_id' => $field->id,
            'start_time' => '07:00',
            'end_time' => '17:00',
            'price' => 70000,
        ]);

        $this->authAs($owner)
            ->deleteJson("/api/owner/prices/{$price->id}")
            ->assertOk();

        $this->assertDatabaseMissing('field_prices', ['id' => $price->id]);
    }

    public function test_owner_cannot_delete_another_owners_price(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $otherOwner = $this->userWithRole(UserRole::OWNER, true);
        $field = $this->fieldFor($otherOwner);

        $price = FieldPrice::create([
            'field_id' => $field->id,
            'start_time' => '07:00',
            'end_time' => '17:00',
            'price' => 70000,
        ]);

        $this->authAs($owner)
            ->deleteJson("/api/owner/prices/{$price->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('field_prices', ['id' => $price->id]);
    }

    public function test_schedule_validation_rejects_invalid_times(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $field = $this->fieldFor($owner);

        $this->authAs($owner)
            ->patchJson("/api/owner/fields/{$field->id}/schedule", [
                'open_time' => '23:00',
                'close_time' => '07:00',
                'session_duration_minutes' => 60,
                'buffer_duration_minutes' => 30,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('open_time');
    }

    public function test_price_validation_rejects_invalid_price(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $field = $this->fieldFor($owner);

        $this->authAs($owner)
            ->postJson("/api/owner/fields/{$field->id}/prices", [
                'start_time' => '07:00',
                'end_time' => '17:00',
                'price' => 0,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('price');
    }

    private function userWithRole(UserRole $role, bool $verifiedOwner = false): User
    {
        $user = User::factory()->create();

        Profile::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'full_name' => $user->name,
            'username' => 'booking_user_' . $user->id,
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
        return Field::create([
            'owner_id' => $owner->id,
            'name' => 'Lapangan Booking Test',
            'sport_type' => 'futsal',
            'location' => 'Jl. Booking',
            'description' => 'Lapangan untuk pengujian booking.',
            'price_per_hour' => 100000,
        ]);
    }

    private function schedulePayload(array $overrides = []): array
    {
        return array_merge([
            'open_time' => '07:00',
            'close_time' => '23:00',
            'session_duration_minutes' => 60,
            'buffer_duration_minutes' => 30,
        ], $overrides);
    }
}
