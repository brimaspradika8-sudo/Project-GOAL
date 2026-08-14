<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Jobs\BookingExpirationJob;
use App\Models\Booking;
use App\Models\Field;
use App\Models\FieldPrice;
use App\Models\Profile;
use App\Models\User;
use App\Services\BookingStatusService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingExpirationJobTest extends TestCase
{
    use RefreshDatabase;

    private string $date = '2026-08-20';

    public function test_job_expires_waiting_booking(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor();

        $booking = Booking::create([
            'user_id' => $player->id,
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'start_time' => '07:00',
            'end_time' => '08:00',
            'duration_minutes' => 60,
            'total_price' => 70000,
            'status' => BookingStatus::WAITING_CONFIRMATION->value,
            'expired_at' => now()->subMinute(),
        ]);

        $job = new BookingExpirationJob($booking->id);
        $job->handle($this->app->make(BookingStatusService::class));

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => BookingStatus::CANCELLED->value,
        ]);
    }

    public function test_job_does_not_change_confirmed_or_rejected(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor();

        $confirmed = Booking::create([
            'user_id' => $player->id,
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'start_time' => '08:00',
            'end_time' => '09:00',
            'duration_minutes' => 60,
            'total_price' => 70000,
            'status' => BookingStatus::CONFIRMED->value,
            'expired_at' => now()->subMinute(),
            'approved_at' => now()->subMinutes(10),
            'confirmed_at' => now()->subMinutes(10),
        ]);

        $rejected = Booking::create([
            'user_id' => $player->id,
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'start_time' => '09:00',
            'end_time' => '10:00',
            'duration_minutes' => 60,
            'total_price' => 70000,
            'status' => BookingStatus::REJECTED->value,
            'expired_at' => now()->subMinute(),
            'rejected_at' => now()->subMinutes(5),
        ]);

        $job1 = new BookingExpirationJob($confirmed->id);
        $job1->handle($this->app->make(BookingStatusService::class));

        $job2 = new BookingExpirationJob($rejected->id);
        $job2->handle($this->app->make(BookingStatusService::class));

        $this->assertDatabaseHas('bookings', [
            'id' => $confirmed->id,
            'status' => BookingStatus::CONFIRMED->value,
        ]);

        $this->assertDatabaseHas('bookings', [
            'id' => $rejected->id,
            'status' => BookingStatus::REJECTED->value,
        ]);
    }

    public function test_expired_booking_releases_slot(): void
    {
        $playerA = $this->userWithRole(UserRole::PLAYER);
        $playerB = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor();

        $booking = Booking::create([
            'user_id' => $playerA->id,
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'start_time' => '10:00',
            'end_time' => '11:00',
            'duration_minutes' => 60,
            'total_price' => 70000,
            'status' => BookingStatus::WAITING_CONFIRMATION->value,
            'expired_at' => now()->subMinute(),
        ]);

        $job = new BookingExpirationJob($booking->id);
        $job->handle($this->app->make(BookingStatusService::class));

        // now another player should be able to book the same slot
        $this->authAs($playerB)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '10:00', 'end_time' => '11:00']],
        ])->assertCreated();
    }

    public function test_owner_cannot_approve_other_owner_booking(): void
    {
        $ownerA = $this->userWithRole(UserRole::OWNER, true);
        $ownerB = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);

        $field = $this->fieldFor([], $ownerB);

        $response = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '10:00', 'end_time' => '11:00']],
        ])->assertCreated();

        $bookingId = $response->json('data.id');

        $this->authAs($ownerA)->patchJson("/api/owner/bookings/{$bookingId}/approve")->assertForbidden();
    }

    // helpers copied from BookingTest for convenience
    private function userWithRole($role, bool $verifiedOwner = false): User
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

    private function fieldFor(array $overrides = [], ?User $owner = null): Field
    {
        $owner = $owner ?? $this->userWithRole(UserRole::OWNER, true);

        $field = Field::create(array_merge([
            'owner_id' => $owner->id,
            'name' => 'Lapangan Booking Test',
            'sport_type' => 'futsal',
            'location' => 'Jl. Booking',
            'description' => 'Lapangan untuk pengujian booking.',
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
}
