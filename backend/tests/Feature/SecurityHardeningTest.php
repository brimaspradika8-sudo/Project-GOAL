<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\Field;
use App\Models\FieldPrice;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    private string $date = '2026-08-20';

    public function test_player_cannot_view_another_players_booking(): void
    {
        $playerA = $this->userWithRole(UserRole::PLAYER);
        $playerB = $this->userWithRole(UserRole::PLAYER);
        $booking = $this->bookingFor($playerA);

        $this->authAs($playerB)->getJson("/api/bookings/{$booking->id}")
            ->assertForbidden();
    }

    public function test_owner_cannot_approve_booking_on_another_owners_field(): void
    {
        $ownerA = $this->userWithRole(UserRole::OWNER, true);
        $ownerB = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor($ownerB);
        $booking = $this->bookingFor($player, $field);

        $this->authAs($ownerA)->patchJson("/api/owner/bookings/{$booking->id}/approve")
            ->assertForbidden();
    }

    public function test_player_cannot_approve_booking(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $booking = $this->bookingFor($player);

        $this->authAs($player)->patchJson("/api/owner/bookings/{$booking->id}/approve")
            ->assertForbidden();
    }

    public function test_unauthenticated_booking_history_is_rejected(): void
    {
        $this->getJson('/api/bookings/history')
            ->assertUnauthorized();
    }

    public function test_owner_bookings_filter_for_another_owner_field_returns_403(): void
    {
        $ownerA = $this->userWithRole(UserRole::OWNER, true);
        $ownerB = $this->userWithRole(UserRole::OWNER, true);
        $fieldB = $this->fieldFor($ownerB);

        $this->authAs($ownerA)->getJson('/api/owner/bookings?field_id=' . $fieldB->id)
            ->assertForbidden();
    }

    public function test_mass_assignment_fields_are_ignored_on_field_update_and_booking_cancel(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $otherOwner = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor($owner, ['status' => 'pending']);
        $booking = $this->bookingFor($player, $field);

        $this->authAs($owner)->putJson("/api/fields/{$field->id}", [
            'name' => 'Lapangan Security Updated',
            'owner_id' => $otherOwner->id,
            'status' => 'approved',
        ])->assertOk();

        $this->assertDatabaseHas('fields', [
            'id' => $field->id,
            'name' => 'Lapangan Security Updated',
            'owner_id' => $owner->id,
            'status' => 'pending',
        ]);

        $this->authAs($player)->patchJson("/api/bookings/{$booking->id}/cancel", [
            'reason' => 'Tidak jadi main',
            'status' => BookingStatus::CONFIRMED->value,
            'owner_id' => $owner->id,
        ])->assertOk();

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => BookingStatus::CANCELLED->value,
            'user_id' => $player->id,
            'field_id' => $field->id,
        ]);
    }

    public function test_invalid_booking_input_returns_validation_error(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => 'not-an-id',
            'booking_date' => '2026-08-01',
            'slots' => [
                ['start_time' => 'bad-time', 'end_time' => '08:00'],
            ],
        ])->assertUnprocessable();
    }

    private function userWithRole(UserRole $role, bool $verifiedOwner = false): User
    {
        $user = User::factory()->create();

        Profile::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'full_name' => $user->name,
            'username' => 'security_user_' . $user->id,
            'role' => $role->value,
            'is_owner_verified' => $verifiedOwner,
            'onboarding_completed' => true,
        ]);

        return $user->load('profile');
    }

    private function authAs(User $user): self
    {
        return $this->withHeader('Authorization', 'Bearer ' . $user->createToken('security-test-token')->plainTextToken);
    }

    private function fieldFor(?User $owner = null, array $overrides = []): Field
    {
        $owner = $owner ?? $this->userWithRole(UserRole::OWNER, true);

        $field = Field::create(array_merge([
            'owner_id' => $owner->id,
            'name' => 'Lapangan Security Test',
            'sport_type' => 'futsal',
            'location' => 'Jl. Security',
            'description' => 'Lapangan untuk security test.',
            'price_per_hour' => 70000,
            'open_time' => '07:00',
            'close_time' => '12:00',
            'session_duration_minutes' => 60,
            'buffer_duration_minutes' => 30,
        ], array_diff_key($overrides, ['status' => 1])));

        $field->forceFill(['status' => $overrides['status'] ?? 'approved'])->save();

        FieldPrice::create([
            'field_id' => $field->id,
            'start_time' => '07:00',
            'end_time' => '23:00',
            'price' => 70000,
        ]);

        return $field;
    }

    private function bookingFor(User $player, ?Field $field = null): Booking
    {
        $field = $field ?? $this->fieldFor();

        return Booking::create([
            'user_id' => $player->id,
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'start_time' => '07:00',
            'end_time' => '08:00',
            'duration_minutes' => 60,
            'total_price' => 70000,
            'status' => BookingStatus::WAITING_CONFIRMATION->value,
            'expired_at' => now()->addMinutes(15),
        ]);
    }
}
