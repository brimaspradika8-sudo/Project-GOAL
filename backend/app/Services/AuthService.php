<?php
namespace App\Services;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthService
{
    public function register(array $data): array
    {
        $email = strtolower(trim($data['email']));
        $password = $data['password'];
        $name = trim($data['name']);

        return DB::transaction(function () use ($email, $password, $name) {
            if (User::whereRaw('LOWER(email) = ?', [$email])->exists()) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'email' => ['Email sudah terdaftar.'],
                ]);
            }

            $user = User::create([
                'name'     => $name,
                'email'    => $email,
                'password' => $password,
            ]);

            Profile::create([
                'user_id' => $user->id,
                'email' => $email,
                'full_name' => $name,
                'username' => 'user_' . $user->id,
            ]);

            $token = $user->createToken('app-token')->plainTextToken;

            return [
                'token' => $token,
                'user'  => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                ],
            ];
        });
    }

    public function login(string $email, string $password): array
    {
        $email = strtolower(trim($email));
        Log::info('[LOGIN] attempt', ['email_raw' => $email]);

        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        if ($user) {
            Log::info('[LOGIN] user found', ['id' => $user->id, 'name' => $user->name]);
        } else {
            Log::warning('[LOGIN] user not found', ['email' => $email]);
        }

        if (!$user) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'email' => ['Email tidak terdaftar.'],
            ])->status(401);
        }

        if (!Hash::check($password, $user->password)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ])->status(401);
        }

        $token = $user->createToken('Mobile App')->plainTextToken;

        return [
            'token' => $token,
            'user'  => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
            ],
        ];
    }

    public function logout(User $user): void
    {
        try {
            $token = $user->currentAccessToken();
            if ($token && method_exists($token, 'delete')) {
                $token->delete();
            } else {
                $user->tokens()->delete();
            }
        } catch (\Exception $e) {
            Log::warning('Logout failed: ' . $e->getMessage());
        }
    }

    public function checkEmail(string $email): bool
    {
        return User::whereRaw('LOWER(email) = ?', [strtolower(trim($email))])->exists();
    }
}
