<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function register(array $data): array
    {
        $user = User::create([
            'name'     => trim($data['name']),
            'email'    => strtolower(trim($data['email'])),
            'password' => Hash::make($data['password']),
        ]);

        $token = $user->createToken('app-token', ['*'], now()->addDay())->plainTextToken;

        return [
            'token' => $token,
            'user'  => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
            ],
        ];
    }

    public function login(string $email, string $password): array
    {
        $user = User::where('email', strtolower(trim($email)))->first();

        if (!$user || !Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau kata sandi salah.'],
            ])->status(401);
        }

        $token = $user->createToken('Mobile App', ['*'], now()->addMonths(3))->plainTextToken;

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
        $token = $user->currentAccessToken();
        if ($token) {
            $token->delete();
        } else {
            $user->tokens()->delete();
        }
    }

    public function checkEmail(string $email): bool
    {
        return User::where('email', strtolower(trim($email)))->exists();
    }
}
