<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\Field;
use App\Models\FieldPrice;
use App\Models\Profile;
use App\Models\User;
use App\Services\AvailabilityService;
use App\Services\PricingService;
use App\Services\SlotGeneratorService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AvailabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_slot_generation_matches_expected_output(): void
    {
        $slots = app(SlotGeneratorService::class)->generate('07:00', '12:00', 60, 30);

        $this->assertEquals([
            ['start_time' => '07:00', 'end_time' => '08:00'],
            ['start_time' => '08:30', 'end_time' => '09:30'],
            ['start_time' => '10:00', 'end_time' => '11:00'],
        ], $slots);
    }

    public function test_slot_generation_without_buffer(): void
    {
        $slots = app(SlotGeneratorService::class)->generate('07:00', '10:00', 60, 0);

        $this->assertEquals([
            ['start_time' => '07:00', 'end_time' => '08:00'],
            ['start_time' => '08:00', 'end_time' => '09:00'],
            ['start_time' => '09:00', 'end_time' => '10:00'],
        ], $slots);
    }

    public function test_slot_generation_rejects_invalid_hours(): void
    {
        $this->assertSame([], app(SlotGeneratorService::class)->generate('23:00', '07:00', 60, 30));
        $this->assertSame([], app(SlotGeneratorService::class)->generate('07:00', '12:00', 0, 30));
    }

    public function test_pricing_service_uses_matching_rule(): void
    {
        $field = $this->makeField();
        FieldPrice::create([
            'field_id' => $field->id,
            'start_time' => '07:00',
            'end_time' => '17:00',
            'price' => 70000,
        ]);
        FieldPrice::create([
            'field_id' => $field->id,
            'start_time' => '17:00',
            'end_time' => '23:00',
            'price' => 120000,
        ]);

        $pricing = app(PricingService::class);
        $field->load('prices');

        $this->assertSame(120000, $pricing->priceForSlot($field, '19:00', '20:00'));
        $this->assertSame(70000, $pricing->priceForSlot($field, '07:00', '08:00'));
    }

    public function test_pricing_service_falls_back_to_price_per_hour(): void
    {
        $field = $this->makeField(['price_per_hour' => 90000]);
        $field->load('prices');

        $this->assertSame(90000, app(PricingService::class)->priceForSlot($field, '19:00', '20:00'));
    }

    public function test_availability_api_returns_slots_with_buffer_spacing(): void
    {
        $field = $this->makeField();
        FieldPrice::create([
            'field_id' => $field->id,
            'start_time' => '07:00',
            'end_time' => '17:00',
            'price' => 70000,
        ]);

        $response = $this->getJson("/api/fields/{$field->id}/availability?date=2026-08-20")
            ->assertOk()
            ->assertJsonPath('data.date', '2026-08-20')
            ->assertJsonPath('data.field.id', $field->id)
            ->assertJsonPath('data.field.open_time', '07:00');

        $slots = $response->json('data.slots');
        $this->assertCount(3, $slots);
        $this->assertSame('07:00', $slots[0]['start_time']);
        $this->assertSame('08:00', $slots[0]['end_time']);
        $this->assertSame('08:30', $slots[1]['start_time']);
        $this->assertSame('10:00', $slots[2]['start_time']);
        $this->assertSame('AVAILABLE', $slots[0]['status']);
        $this->assertSame(70000, $slots[0]['price']);
    }

    public function test_lapangan_slots_endpoint_accepts_tanggal_query(): void
    {
        $field = $this->makeField();

        $this->getJson("/api/lapangan/{$field->id}/slots?tanggal=2026-08-20")
            ->assertOk()
            ->assertJsonPath('data.tanggal', '2026-08-20')
            ->assertJsonPath('data.lapangan.id', $field->id)
            ->assertJsonPath('data.slots.0.status', 'AVAILABLE');
    }

    public function test_approved_booking_marks_slot_as_booked(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->makeField(['buffer_duration_minutes' => 0]);

        Booking::create([
            'user_id' => $player->id,
            'field_id' => $field->id,
            'booking_date' => '2026-08-20',
            'start_time' => '07:00',
            'end_time' => '08:00',
            'duration_minutes' => 60,
            'total_price' => 100000,
            'status' => BookingStatus::APPROVED->value,
        ]);

        $this->getJson("/api/lapangan/{$field->id}/slots?tanggal=2026-08-20")
            ->assertOk()
            ->assertJsonPath('data.slots.0.status', 'BOOKED');
    }

    public function test_expired_booking_returns_slot_to_available(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->makeField(['buffer_duration_minutes' => 0]);

        Booking::create([
            'user_id' => $player->id,
            'field_id' => $field->id,
            'booking_date' => '2026-08-20',
            'start_time' => '07:00',
            'end_time' => '08:00',
            'duration_minutes' => 60,
            'total_price' => 100000,
            'status' => BookingStatus::EXPIRED->value,
            'expired_at' => now()->subMinute(),
        ]);

        $this->getJson("/api/lapangan/{$field->id}/slots?tanggal=2026-08-20")
            ->assertOk()
            ->assertJsonPath('data.slots.0.status', 'AVAILABLE');
    }

    public function test_live_field_status_is_playing_during_active_booking(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->makeField(['buffer_duration_minutes' => 0]);

        Booking::create([
            'user_id' => $player->id,
            'field_id' => $field->id,
            'booking_date' => '2026-08-20',
            'start_time' => '07:00',
            'end_time' => '08:00',
            'duration_minutes' => 60,
            'total_price' => 100000,
            'status' => BookingStatus::CONFIRMED->value,
        ]);

        $this->assertSame(
            'PLAYING',
            app(AvailabilityService::class)->liveFieldStatus($field, '2026-08-20', '07:30')
        );
    }

    public function test_live_field_status_is_booked_when_booking_exists_later(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->makeField(['buffer_duration_minutes' => 0]);

        Booking::create([
            'user_id' => $player->id,
            'field_id' => $field->id,
            'booking_date' => '2026-08-20',
            'start_time' => '10:00',
            'end_time' => '11:00',
            'duration_minutes' => 60,
            'total_price' => 100000,
            'status' => BookingStatus::APPROVED->value,
        ]);

        $this->assertSame(
            'BOOKED',
            app(AvailabilityService::class)->liveFieldStatus($field, '2026-08-20', '07:30')
        );
    }

    public function test_live_field_status_is_closed_outside_operating_hours(): void
    {
        $field = $this->makeField();

        $this->assertSame(
            'CLOSED',
            app(AvailabilityService::class)->liveFieldStatus($field, '2026-08-20', '23:30')
        );
    }

    public function test_status_is_booked_when_slot_overlaps_booked_range(): void
    {
        $field = $this->makeField(['buffer_duration_minutes' => 0]);
        $field->load('prices');

        $result = app(AvailabilityService::class)->forDate($field, '2026-08-20', [
            ['start' => '07:00', 'end' => '08:00'],
        ]);

        $this->assertSame('BOOKED', $result['slots'][0]['status']);
        $this->assertSame('AVAILABLE', $result['slots'][1]['status']);
    }

    public function test_status_is_buffer_when_slot_falls_inside_booking_buffer(): void
    {
        $field = $this->makeField(['buffer_duration_minutes' => 60]);
        $field->load('prices');

        $result = app(AvailabilityService::class)->forDate($field, '2026-08-20', [
            ['start' => '07:30', 'end' => '08:30'],
        ]);

        $this->assertSame('BOOKED', $result['slots'][0]['status']);
        $this->assertSame('BUFFER', $result['slots'][1]['status']);
        $this->assertSame('AVAILABLE', $result['slots'][2]['status']);
    }

    public function test_status_prefers_booked_over_an_earlier_booking_buffer(): void
    {
        $field = $this->makeField(['buffer_duration_minutes' => 30]);
        $field->load('prices');

        $result = app(AvailabilityService::class)->forDate($field, '2026-08-20', [
            ['start' => '07:00', 'end' => '08:00'],
            ['start' => '08:30', 'end' => '09:30'],
        ]);

        $this->assertSame('BOOKED', $result['slots'][0]['status']);
        $this->assertSame('BOOKED', $result['slots'][1]['status']);
        $this->assertSame('AVAILABLE', $result['slots'][2]['status']);
    }

    public function test_status_is_available_when_slot_starts_exactly_when_buffer_ends(): void
    {
        $field = $this->makeField(['buffer_duration_minutes' => 30]);
        $field->load('prices');

        $result = app(AvailabilityService::class)->forDate($field, '2026-08-20', [
            ['start' => '07:00', 'end' => '08:00'],
        ]);

        $this->assertSame('AVAILABLE', $result['slots'][1]['status']);
    }

    public function test_availability_is_publicly_accessible_without_token(): void
    {
        $field = $this->makeField();

        $this->getJson("/api/fields/{$field->id}/availability?date=2026-08-20")
            ->assertOk();
    }

    public function test_availability_returns_404_for_unapproved_field(): void
    {
        $field = $this->makeField(['status' => 'pending']);

        $this->getJson("/api/fields/{$field->id}/availability?date=2026-08-20")
            ->assertNotFound();
    }

    public function test_availability_returns_404_for_missing_field(): void
    {
        $this->getJson('/api/fields/999999/availability?date=2026-08-20')
            ->assertNotFound();
    }

    public function test_availability_rejects_invalid_date(): void
    {
        $field = $this->makeField();

        $this->getJson("/api/fields/{$field->id}/availability?date=20-08-2026")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('date');

        $this->getJson("/api/fields/{$field->id}/availability")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('date');
    }

    public function test_availability_returns_empty_slots_for_field_without_schedule(): void
    {
        $field = $this->makeField([
            'open_time' => null,
            'close_time' => null,
        ]);

        $this->getJson("/api/fields/{$field->id}/availability?date=2026-08-20")
            ->assertOk()
            ->assertJsonPath('data.slots', []);
    }

    private function makeField(array $overrides = []): Field
    {
        $owner = User::factory()->create();

        $field = Field::create(array_merge([
            'owner_id' => $owner->id,
            'name' => 'Lapangan Availability',
            'sport_type' => 'futsal',
            'location' => 'Jl. Uji',
            'description' => 'Lapangan untuk pengujian availability.',
            'price_per_hour' => 100000,
            'open_time' => '07:00',
            'close_time' => '12:00',
            'session_duration_minutes' => 60,
            'buffer_duration_minutes' => 30,
        ], array_diff_key($overrides, ['status' => 1])));

        $field->forceFill(['status' => $overrides['status'] ?? 'approved'])->save();

        return $field;
    }

    private function userWithRole(UserRole $role): User
    {
        $user = User::factory()->create();

        Profile::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'full_name' => $user->name,
            'username' => 'availability_user_' . $user->id,
            'role' => $role->value,
            'is_owner_verified' => $role === UserRole::OWNER,
            'onboarding_completed' => true,
        ]);

        return $user->load('profile');
    }
}
