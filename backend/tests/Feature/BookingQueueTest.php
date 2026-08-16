<?php

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Jobs\AutoCancelBooking;
use App\Models\Booking;
use App\Models\Field;
use App\Models\FieldPrice;
use App\Models\Profile;
use App\Models\User;
use App\Services\BookingStatusService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BookingQueueTest extends TestCase
{
    use RefreshDatabase;

    private string $date;

    protected function setUp(): void
    {
        parent::setUp();

        $this->date = Carbon::tomorrow()->format('Y-m-d');
        config(['queue.default' => 'database']);
    }

    public function test_creating_booking_dispatches_job_to_database_queue(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor(['open_time' => '07:00', 'close_time' => '23:00']);

        $this->authAs($player)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '08:00', 'end_time' => '09:00']],
        ])->assertCreated();

        $jobs = DB::table('jobs')->where('payload', 'like', '%AutoCancelBooking%')->get();
        $this->assertCount(1, $jobs);

        $runAt = Carbon::parse($this->date . ' 08:00')->subMinutes(30)->timestamp;
        $this->assertSame($runAt, $jobs->first()->available_at);
    }

    public function test_waiting_confirmation_booking_is_cancelled_with_expired_reason(): void
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

        (new AutoCancelBooking($booking->id))->handle($this->app->make(BookingStatusService::class));

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => BookingStatus::CANCELLED->value,
            'cancel_reason' => 'Expired',
        ]);

        $this->assertNotNull(Booking::find($booking->id)->cancelled_at);
    }

    public function test_confirmed_booking_is_not_changed_by_job(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor();

        $booking = Booking::create([
            'user_id' => $player->id,
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'start_time' => '08:00',
            'end_time' => '09:00',
            'duration_minutes' => 60,
            'total_price' => 70000,
            'status' => BookingStatus::CONFIRMED->value,
            'approved_at' => now(),
            'expired_at' => now()->subMinute(),
        ]);

        (new AutoCancelBooking($booking->id))->handle($this->app->make(BookingStatusService::class));

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => BookingStatus::CONFIRMED->value,
        ]);
    }

    public function test_cancelled_booking_job_does_not_error(): void
    {
        $player = $this->userWithRole(UserRole::PLAYER);
        $field = $this->fieldFor();

        $booking = Booking::create([
            'user_id' => $player->id,
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'start_time' => '09:00',
            'end_time' => '10:00',
            'duration_minutes' => 60,
            'total_price' => 70000,
            'status' => BookingStatus::CANCELLED->value,
            'cancelled_at' => now()->subMinute(),
            'expired_at' => now()->subMinute(),
        ]);

        (new AutoCancelBooking($booking->id))->handle($this->app->make(BookingStatusService::class));

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => BookingStatus::CANCELLED->value,
        ]);
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
            'start_time' => '10:00',
            'end_time' => '11:00',
            'duration_minutes' => 60,
            'total_price' => 70000,
            'status' => BookingStatus::WAITING_CONFIRMATION->value,
            'expired_at' => now()->subMinute(),
        ]);

        (new AutoCancelBooking($booking->id))->handle($this->app->make(BookingStatusService::class));

        $this->authAs($playerB)->postJson('/api/bookings', [
            'field_id' => $field->id,
            'booking_date' => $this->date,
            'slots' => [['start_time' => '10:00', 'end_time' => '11:00']],
        ])->assertCreated();
    }

    private function userWithRole($role, bool $verifiedOwner = false): User
    {
        $user = User::factory()->create();

        Profile::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'full_name' => $user->name,
            'username' => 'queue_user_' . $user->id,
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
            'name' => 'Lapangan Queue Test',
            'sport_type' => 'futsal',
            'location' => 'Jl. Queue',
            'description' => 'Lapangan untuk pengujian queue booking.',
            'price_per_hour' => 70000,
            'open_time' => '07:00',
            'close_time' => '12:00',
            'session_duration_minutes' => 60,
            'buffer_duration_minutes' => 30,
        ], $overrides));

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
