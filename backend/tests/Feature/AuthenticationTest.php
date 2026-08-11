<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_creates_hashed_password_and_standard_response(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'New Player',
            'email' => 'new-player@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.user.email', 'new-player@example.com');

        $this->assertTrue(Hash::check('Password123!', User::firstOrFail()->password));
    }

    public function test_login_returns_token_in_standard_data_envelope(): void
    {
        $user = User::factory()->create(['email' => 'login@example.com', 'password' => 'Password123!']);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'Password123!',
        ])->assertOk()
            ->assertJsonStructure(['message', 'data' => ['token', 'user']]);
    }

    public function test_wrong_password_is_rejected_without_a_token(): void
    {
        $user = User::factory()->create(['email' => 'wrong-password@example.com', 'password' => 'Password123!']);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'WrongPassword123!',
        ])->assertUnauthorized()
            ->assertJsonStructure(['message', 'errors']);
    }

    public function test_forgot_password_rejects_unknown_email(): void
    {
        $this->postJson('/api/auth/forgot-password', [
            'email' => 'unknown@example.com',
        ])->assertStatus(422)
            ->assertJsonStructure(['message', 'errors']);
    }
}