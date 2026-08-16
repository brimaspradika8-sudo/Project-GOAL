<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Jobs\AutoCancelBooking;
use App\Models\Booking;
use App\Models\Field;
use App\Models\FieldPrice;
use App\Models\Notification;
use App\Models\Profile;
use App\Models\User;
use App\Services\BookingStatusService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\SendQueuedNotifications;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class BookingTest extends TestCase
{
    use RefreshDatabase;

    private string $date = '2026-08-20';

    public function test_player_can_create_booking(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor();

        $response = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [
                ['start_time' => '07:00', 'end_time' => '08:00'],
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', BookingStatus::WAITING_CONFIRMATION->value)
            ->assertJsonPath('data.start_time', '07:00')
            ->assertJsonPath('data.end_time', '08:00')
            ->assertJsonPath('data.duration_minutes', 60)
            ->assertJsonPath('data.total_price', 70000)
            ->assertJsonPath('data.payment_method', 'cash')
            ->assertJsonPath('data.field.name', $field->name);

        $this->assertDatabaseHas('bookings', [
            'user_id' => $player->id,
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'start_time' => '07:00',
            'end_time' => '08:00',
            'status' => BookingStatus::WAITING_CONFIRMATION->value,
            'payment_method' => 'cash',
        ]);
    }

    public function test_booking_expires_thirty_minutes_before_slot(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor();

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertCreated();

        $booking = Booking::first();
        $expected = Carbon::parse($this->date.' 07:00')->subMinutes(30);
        $this->assertTrue(
            $booking->expired_at->equalTo($expected),
            'expired_at harus 30 menit sebelum slot mulai.'
        );
    }

    public function test_contiguous_slots_are_merged_into_single_booking(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor(['buffer_duration_minutes' => 0]);

        $response = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [
                ['start_time' => '08:00', 'end_time' => '09:00'],
                ['start_time' => '09:00', 'end_time' => '10:00'],
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.start_time', '08:00')
            ->assertJsonPath('data.end_time', '10:00')
            ->assertJsonPath('data.duration_minutes', 120)
            ->assertJsonPath('data.total_price', 140000);
    }

    public function test_booking_on_pending_field_is_rejected(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor(['status' => 'pending']);

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertUnprocessable();
    }

    public function test_slot_outside_schedule_is_rejected(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor();

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:30', 'end_time' => '08:30']],
        ])->assertUnprocessable();
    }

    public function test_non_contiguous_slots_are_rejected(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor();

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [
                ['start_time' => '07:00', 'end_time' => '08:00'],
                ['start_time' => '10:00', 'end_time' => '11:00'],
            ],
        ])->assertUnprocessable();
    }

    public function test_adjacent_slots_on_buffered_field_are_accepted(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor(['buffer_duration_minutes' => 30]);

        $response = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [
                ['start_time' => '07:00', 'end_time' => '08:00'],
                ['start_time' => '08:30', 'end_time' => '09:30'],
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.start_time', '07:00')
            ->assertJsonPath('data.end_time', '09:30')
            ->assertJsonPath('data.duration_minutes', 150)
            ->assertJsonPath('data.total_price', 140000);

        $this->assertDatabaseHas('bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'start_time' => '07:00',
            'end_time' => '09:30',
            'duration_minutes' => 150,
        ]);
    }

    public function test_booking_slots_are_not_duplicated(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor(['buffer_duration_minutes' => 30]);

        $response = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [
                ['start_time' => '07:00', 'end_time' => '08:00'],
                ['start_time' => '08:30', 'end_time' => '09:30'],
            ],
        ]);

        $response->assertCreated();

        $bookingId = $response->json('data.id');
        $this->assertSame(1, DB::table('booking_slots')->where('booking_id', $bookingId)->count());
    }

    public function test_overlapping_booking_returns_409(): void
    {
        $playerA = $this->userWithRole(UserRole::PLAYER);
        $playerB = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor();

        $this->authAs($playerA)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertCreated();

        $this->authAs($playerB)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertStatus(409);
    }

    public function test_adjacent_non_overlapping_booking_is_allowed(): void
    {
        $playerA = $this->userWithRole(UserRole::PLAYER);
        $playerB = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor(['buffer_duration_minutes' => 0]);

        $this->authAs($playerA)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertCreated();

        $this->authAs($playerB)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '08:00', 'end_time' => '09:00']],
        ])->assertCreated();
    }

    public function test_cancelled_booking_releases_slot(): void
    {
        $playerA = $this->userWithRole(UserRole::PLAYER);
        $playerB = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor();

        $booking = Booking::create([
            'user_id' => $playerA->id,
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'start_time' => '07:00',
            'end_time' => '08:00',
            'duration_minutes' => 60,
            'total_price' => 70000,
            'status' => BookingStatus::CANCELLED->value,
            'cancelled_at' => now(),
        ]);

        $this->authAs($playerB)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertCreated();
    }

    public function test_owner_cannot_create_booking(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $field = $this->fieldFor([], $owner);

        $this->authAs($owner)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertForbidden();
    }

    public function test_unauthenticated_cannot_create_booking(): void
    {
        $this->postJson('/api/bookings', [
            'field_id' => 1,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertUnauthorized();
    }

    public function test_player_can_list_own_bookings(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $other = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor();

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertCreated();

        $this->authAs($other)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '08:30', 'end_time' => '09:30']],
        ])->assertCreated();

        $this->authAs($player)->getJson('/api/bookings/my')
            ->assertOk()
            ->assertJsonCount(1, 'data.data');
    }

    public function test_player_booking_history_only_contains_own_bookings(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $other = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor();

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertCreated();

        $this->authAs($other)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '08:30', 'end_time' => '09:30']],
        ])->assertCreated();

        $this->authAs($player)->getJson('/api/bookings/history?status=WAITING_CONFIRMATION')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.user_id', $player->id);
    }

    public function test_booking_detail_visible_to_owner_of_booking(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor();

        $bookingId = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->json('data.id');

        $this->authAs($player)->getJson("/api/bookings/{$bookingId}")
            ->assertOk()
            ->assertJsonPath('data.id', $bookingId);
    }

    public function test_booking_detail_hidden_from_other_player(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $other = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor();

        $bookingId = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->json('data.id');

        $this->authAs($other)->getJson("/api/bookings/{$bookingId}")
            ->assertForbidden();
    }

    public function test_booking_detail_visible_to_field_owner(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor([], $owner);

        $bookingId = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->json('data.id');

        $this->authAs($owner)->getJson("/api/bookings/{$bookingId}")
            ->assertOk();
    }

    public function test_booking_detail_hidden_from_other_field_owner(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $otherOwner = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor([], $otherOwner);

        $bookingId = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->json('data.id');

        $this->authAs($owner)->getJson("/api/bookings/{$bookingId}")
            ->assertForbidden();
    }

    public function test_player_can_cancel_own_booking(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor();

        $bookingId = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->json('data.id');

        $this->authAs($player)->patchJson("/api/bookings/{$bookingId}/cancel", [
            'cancel_reason' => 'Tidak jadi main',
        ])->assertOk()
            ->assertJsonPath('data.status', BookingStatus::CANCELLED->value)
            ->assertJsonPath('data.cancel_reason', 'Tidak jadi main');
    }

    public function test_cannot_cancel_other_players_booking(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $other = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor();

        $bookingId = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->json('data.id');

        $this->authAs($other)->patchJson("/api/bookings/{$bookingId}/cancel")
            ->assertForbidden();
    }

    public function test_cannot_cancel_completed_booking(): void
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
            'status' => BookingStatus::COMPLETED->value,
            'completed_at' => now(),
        ]);

        $this->authAs($player)->patchJson("/api/bookings/{$booking->id}/cancel")
            ->assertStatus(409)
            ->assertJsonPath('message', 'Booking cannot be cancelled');
    }

    public function test_owner_can_list_incoming_bookings(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor([], $owner);

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertCreated();

        $this->authAs($owner)->getJson('/api/owner/bookings')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.user.name', $player->name);
    }

    public function test_owner_monitoring_only_returns_own_field_bookings(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $otherOwner = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);
        $ownField = $this->fieldFor([], $owner);
        $otherField = $this->fieldFor(['name' => 'Lapangan Owner Lain'], $otherOwner);

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $ownField->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertCreated();

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $otherField->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertCreated();

        $this->authAs($owner)->getJson('/api/owner/bookings')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.field.owner_id', $owner->id);
    }

    public function test_owner_can_list_bookings_for_own_field(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor([], $owner);

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertCreated();

        $this->authAs($owner)->getJson("/api/owner/fields/{$field->id}/bookings")
            ->assertOk()
            ->assertJsonCount(1, 'data.data');
    }

    public function test_owner_can_approve_waiting_booking(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor([], $owner);

        $bookingId = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->json('data.id');

        $this->authAs($owner)->patchJson("/api/owner/bookings/{$bookingId}/approve")
            ->assertOk()
            ->assertJsonPath('message', 'Booking approved')
            ->assertJsonPath('data.status', BookingStatus::CONFIRMED->value)
            ->assertJsonPath('data.confirmed_by', $owner->id);

        $this->assertDatabaseHas('bookings', [
            'id' => $bookingId,
            'status' => BookingStatus::CONFIRMED->value,
            'confirmed_by' => $owner->id,
        ]);
    }

    public function test_owner_can_reject_waiting_booking(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor([], $owner);

        $bookingId = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->json('data.id');

        $this->authAs($owner)->patchJson("/api/owner/bookings/{$bookingId}/reject", [
            'reason' => 'Lapangan sedang maintenance',
        ])->assertOk()
            ->assertJsonPath('message', 'Booking rejected')
            ->assertJsonPath('data.status', BookingStatus::REJECTED->value)
            ->assertJsonPath('data.rejection_reason', 'Lapangan sedang maintenance');

        $this->assertDatabaseHas('bookings', [
            'id' => $bookingId,
            'status' => BookingStatus::REJECTED->value,
            'rejection_reason' => 'Lapangan sedang maintenance',
        ]);
    }

    public function test_owner_approval_confirms_booking(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor([], $owner);

        $bookingId = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->json('data.id');

        $this->authAs($owner)->patchJson("/api/owner/bookings/{$bookingId}/approve")->assertOk();

        $this->assertDatabaseHas('bookings', [
            'id' => $bookingId,
            'status' => BookingStatus::CONFIRMED->value,
            'confirmed_by' => $owner->id,
        ]);

        $this->assertNotNull(Booking::find($bookingId)->confirmed_at);
    }

    public function test_confirmed_booking_cannot_be_approved_twice(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor([], $owner);

        $bookingId = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->json('data.id');

        $this->authAs($owner)->patchJson("/api/owner/bookings/{$bookingId}/approve")->assertOk();

        $this->authAs($owner)->patchJson("/api/owner/bookings/{$bookingId}/approve")
            ->assertStatus(409);
    }

    public function test_owner_cannot_reject_others_booking(): void
    {
        $ownerA = $this->userWithRole(UserRole::OWNER, true);
        $ownerB = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor([], $ownerB);

        $bookingId = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->json('data.id');

        $this->authAs($ownerA)->patchJson("/api/owner/bookings/{$bookingId}/reject", [
            'reason' => 'Bukan lapangan saya',
        ])->assertForbidden();
    }

    public function test_player_cannot_approve_booking(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor([], $owner);

        $bookingId = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->json('data.id');

        $this->authAs($player)->patchJson("/api/owner/bookings/{$bookingId}/approve")
            ->assertForbidden();
    }

    public function test_owner_cannot_approve_others_booking(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $otherOwner = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor([], $otherOwner);

        $bookingId = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->json('data.id');

        $this->authAs($owner)->patchJson("/api/owner/bookings/{$bookingId}/approve")
            ->assertForbidden();
    }

    public function test_booking_approval_notification_is_queued(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor([], $owner);

        $bookingId = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->json('data.id');

        Queue::fake([SendQueuedNotifications::class]);

        $this->authAs($owner)->patchJson("/api/owner/bookings/{$bookingId}/approve")
            ->assertOk();

        Queue::assertPushed(SendQueuedNotifications::class);
    }

    public function test_player_cannot_access_owner_booking_endpoints(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $this->authAs($player)->getJson('/api/owner/bookings')->assertForbidden();
    }

    public function test_owner_cannot_list_bookings_for_others_field(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $otherOwner = $this->userWithRole(UserRole::OWNER, true);
        $field = $this->fieldFor([], $otherOwner);

        $this->authAs($owner)->getJson("/api/owner/fields/{$field->id}/bookings")
            ->assertForbidden();
    }

    public function test_booking_ignores_user_id_from_payload(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $other = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor();

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'user_id' => $other->id,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertCreated();

        $this->assertDatabaseHas('bookings', ['user_id' => $player->id]);
        $this->assertDatabaseMissing('bookings', ['user_id' => $other->id]);
    }

    public function test_booking_for_slot_past_expiry_deadline_is_rejected(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor([
            'open_time' => '00:00',
            'close_time' => '23:59',
            'session_duration_minutes' => 60,
            'buffer_duration_minutes' => 0,
        ]);

        $start = now()->startOfHour()->format('H:i');

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => now()->format('Y-m-d'),
            'slots' => [['start_time' => $start]],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('slots');

        $this->assertDatabaseCount('bookings', 0);
    }

    public function test_completing_booking_notifies_player(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor([], $owner);

        $bookingId = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->json('data.id');

        $this->authAs($owner)->patchJson("/api/owner/bookings/{$bookingId}/approve")->assertOk();

        $this->authAs($owner)->patchJson("/api/owner/bookings/{$bookingId}/complete")->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $player->id,
            'type' => 'booking_completed',
        ]);
    }

    public function test_expiration_job_marks_waiting_booking_as_expired(): void
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

        (new AutoCancelBooking($booking->id))->handle(app(BookingStatusService::class));

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => BookingStatus::CANCELLED->value,
        ]);
    }

    public function test_expiration_job_does_not_expire_confirmed_booking(): void
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
            'status' => BookingStatus::CONFIRMED->value,
            'approved_at' => now(),
            'expired_at' => now()->subMinute(),
        ]);

        (new AutoCancelBooking($booking->id))->handle(app(BookingStatusService::class));

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => BookingStatus::CONFIRMED->value,
        ]);
    }

    public function test_availability_reflects_real_booked_slots(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor();

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertCreated();

        $response = $this->getJson("/api/fields/{$field->id}/availability?date={$this->date}")
            ->assertOk();

        $slots = collect($response->json('data.slots'));
        $this->assertSame('BOOKED', $slots->firstWhere('start_time', '07:00')['status']);
        $this->assertSame('AVAILABLE', $slots->firstWhere('start_time', '08:30')['status']);
    }

    public function test_booking_creates_notification_for_owner(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor([], $owner);

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertCreated();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $owner->id,
            'type' => 'booking_requested',
        ]);
    }

    public function test_owner_approval_notifies_player(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor([], $owner);

        $bookingId = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->json('data.id');

        $this->authAs($owner)->patchJson("/api/owner/bookings/{$bookingId}/approve")->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $player->id,
            'type' => 'booking_approved',
        ]);
    }

    public function test_owner_rejection_notifies_player(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor([], $owner);

        $bookingId = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->json('data.id');

        $this->authAs($owner)->patchJson("/api/owner/bookings/{$bookingId}/reject", [
            'reason' => 'Lapangan sedang maintenance',
        ])->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $player->id,
            'type' => 'booking_rejected',
        ]);
    }

    public function test_booking_expiration_notifies_player(): void
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

        (new AutoCancelBooking($booking->id))->handle(app(BookingStatusService::class));

        $this->assertDatabaseHas('notifications', [
            'user_id' => $player->id,
            'type' => 'booking_expired',
        ]);
    }

    public function test_user_cannot_mark_other_users_notification_as_read(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor([], $owner);

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertCreated();

        $notificationId = Notification::where('user_id', $owner->id)->value('id');

        $this->authAs($player)->postJson("/api/notifications/{$notificationId}/read")
            ->assertNotFound();
    }

    public function test_player_can_cancel_expired_booking_gets_409(): void
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
            'status' => BookingStatus::CANCELLED->value,
            'expired_at' => now()->subMinute(),
        ]);

        $this->authAs($player)->patchJson("/api/bookings/{$booking->id}/cancel", [
            'reason' => 'Terlambat',
        ])->assertStatus(409)
            ->assertJsonPath('message', 'Booking cannot be cancelled');
    }

    public function test_booking_detail_not_found_returns_404(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);

        $this->authAs($player)->getJson('/api/bookings/999999')
            ->assertNotFound();
    }

    public function test_cancelling_missing_booking_returns_404(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);

        $this->authAs($player)->patchJson('/api/bookings/999999/cancel', [
            'reason' => 'Tidak jadi',
        ])->assertNotFound();
    }

    public function test_owner_can_filter_incoming_bookings_by_status(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor([], $owner);

        $waitingId = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->json('data.id');

        $this->authAs($owner)->patchJson("/api/owner/bookings/{$waitingId}/approve")->assertOk();

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '08:30', 'end_time' => '09:30']],
        ])->assertCreated();

        $this->authAs($owner)->getJson('/api/owner/bookings?status=CONFIRMED')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.status', BookingStatus::CONFIRMED->value);
    }

    public function test_owner_can_filter_incoming_bookings_by_date(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor([], $owner);

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertCreated();

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => '2026-08-21',
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertCreated();

        $this->authAs($owner)->getJson('/api/owner/bookings?date='.$this->date)
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.booking_date', $this->date);
    }

    public function test_owner_can_filter_incoming_bookings_by_field(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);
        $fieldA = $this->fieldFor([], $owner);
        $fieldB = $this->fieldFor(['name' => 'Lapangan B'], $owner);

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $fieldA->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertCreated();

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $fieldB->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertCreated();

        $this->authAs($owner)->getJson('/api/owner/bookings?field_id='.$fieldA->id)
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.field_id', $fieldA->id);
    }

    public function test_super_admin_can_monitor_all_bookings(): void
    {
        $superAdmin = $this->userWithRole(UserRole::SUPER_ADMIN);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor();

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertCreated();

        $this->authAs($superAdmin)->getJson('/api/admin/bookings')
            ->assertOk()
            ->assertJsonCount(1, 'data.data');
    }

    public function test_super_admin_can_filter_admin_bookings_by_status(): void
    {
        $superAdmin = $this->userWithRole(UserRole::SUPER_ADMIN);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor();

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertCreated();

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '08:30', 'end_time' => '09:30']],
        ])->assertCreated();

        $this->authAs($superAdmin)->getJson('/api/admin/bookings?status=WAITING_CONFIRMATION')
            ->assertOk()
            ->assertJsonCount(2, 'data.data')
            ->assertJsonPath('data.data.0.status', BookingStatus::WAITING_CONFIRMATION->value);
    }

    public function test_super_admin_can_filter_admin_bookings_by_owner(): void
    {
        $superAdmin = $this->userWithRole(UserRole::SUPER_ADMIN);
        $player = $this->userWithRole(UserRole::PLAYER);
        $ownerA = $this->userWithRole(UserRole::OWNER, true);
        $ownerB = $this->userWithRole(UserRole::OWNER, true);
        $fieldA = $this->fieldFor([], $ownerA);
        $fieldB = $this->fieldFor([], $ownerB);

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $fieldA->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertCreated();

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $fieldB->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->assertCreated();

        $this->authAs($superAdmin)->getJson('/api/admin/bookings?owner_id='.$ownerA->id)
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.field.owner_id', $ownerA->id);
    }

    public function test_player_cannot_access_admin_bookings_endpoint(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);

        $this->authAs($player)->getJson('/api/admin/bookings')->assertForbidden();
    }

    public function test_owner_cannot_access_admin_bookings_endpoint(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);

        $this->authAs($owner)->getJson('/api/admin/bookings')->assertForbidden();
    }

    public function test_super_admin_can_view_any_booking_detail(): void
    {
        $superAdmin = $this->userWithRole(UserRole::SUPER_ADMIN);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor();

        $bookingId = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->json('data.id');

        $this->authAs($superAdmin)->getJson("/api/bookings/{$bookingId}")
            ->assertOk()
            ->assertJsonPath('data.id', $bookingId)
            ->assertJsonPath('data.user.id', $player->id);
    }

    public function test_owner_can_confirm_payment(): void
    {
        $owner = $this->userWithRole(UserRole::OWNER, true);
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor([], $owner);

        $bookingId = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->json('data.id');

        $this->authAs($owner)->patchJson("/api/owner/bookings/{$bookingId}/approve")->assertOk();

        $this->authAs($owner)->patchJson("/api/owner/bookings/{$bookingId}/confirm-payment")
            ->assertOk()
            ->assertJsonPath('data.status', BookingStatus::PAID->value);

        $this->assertDatabaseHas('bookings', [
            'id' => $bookingId,
            'status' => BookingStatus::PAID->value,
        ]);
    }

    public function test_player_can_bulk_delete_bookings(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor();

        $b1 = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '07:00', 'end_time' => '08:00']],
        ])->json('data.id');

        $b2 = $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '08:30', 'end_time' => '09:30']],
        ])->json('data.id');

        $this->authAs($player)->deleteJson('/api/bookings/bulk', [
            'booking_ids' => [$b1, $b2],
        ])->assertOk()
            ->assertJsonPath('data.deleted_count', 2);

        $this->assertDatabaseHas('bookings', ['id' => $b1, 'status' => BookingStatus::CANCELLED->value]);
        $this->assertDatabaseHas('bookings', ['id' => $b2, 'status' => BookingStatus::CANCELLED->value]);
    }

    private function userWithRole(UserRole $role, bool $verifiedOwner = false): User
    {
        $user = User::factory()->create();

        Profile::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'full_name' => $user->name,
            'username' => 'booking_user_'.$user->id,
            'role' => $role->value,
            'is_owner_verified' => $verifiedOwner,
            'onboarding_completed' => true,
        ]);

        return $user->load('profile');
    }

    private function authAs(User $user): self
    {
        return $this->withHeader('Authorization', 'Bearer '.$user->createToken('test-token')->plainTextToken);
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
