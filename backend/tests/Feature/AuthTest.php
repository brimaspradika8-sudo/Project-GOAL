<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('profiles');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('username', 20)->unique()->nullable();
            $table->string('email')->nullable();
            $table->string('full_name')->nullable();
            $table->string('region', 100)->nullable();
            $table->string('avatar_url', 2048)->nullable();
            $table->integer('age')->nullable();
            $table->boolean('onboarding_completed')->default(false);
            $table->string('role', 20)->default('player');
            $table->boolean('is_owner_verified')->default(false);
            $table->timestamps();
        });

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    private array $validRegisterData = [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'Password123',
        'password_confirmation' => 'Password123',
    ];

    public function test_register_success(): void
    {
        $response = $this->postJson('/api/auth/register', $this->validRegisterData);

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'token', 'user']);

        $this->assertDatabaseHas('users', ['email' => 'test@example.com']);
        $this->assertDatabaseHas('profiles', [
            'email' => 'test@example.com',
            'full_name' => 'Test User',
        ]);
    }

    public function test_register_duplicate_email_fails(): void
    {
        User::create([
            'name' => 'Existing',
            'email' => 'test@example.com',
            'password' => bcrypt('Password123'),
        ]);

        $response = $this->postJson('/api/auth/register', $this->validRegisterData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    public function test_login_success(): void
    {
        User::create([
            'name' => 'Login User',
            'email' => 'login@example.com',
            'password' => bcrypt('Password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'login@example.com',
            'password' => 'Password123',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['message', 'token', 'user']);
    }

    public function test_login_wrong_password_fails(): void
    {
        User::create([
            'name' => 'Login User',
            'email' => 'login@example.com',
            'password' => bcrypt('Password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'login@example.com',
            'password' => 'WrongPassword1',
        ]);

        $response->assertStatus(401)
            ->assertJson(['message' => 'Email atau password salah.']);
    }

    public function test_forgot_password_unregistered_email_returns_success(): void
    {
        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'notregistered@example.com',
        ]);

        $response->assertOk()
            ->assertJson(['message' => 'Tautan reset password telah dikirim ke email Anda jika terdaftar.']);
    }
}
