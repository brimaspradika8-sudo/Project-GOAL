<?php
namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    public function register(array $data): array
    {
        $email = strtolower(trim($data['email']));
        $password = $data['password'];
        $name = trim($data['name']);

        // Create or return local database user
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name'     => $name,
                'password' => Hash::make($password),
            ]
        );

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
        $email = strtolower(trim($email));

        // Find or create local user record
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name'     => $email,
                'password' => Hash::make($password),
            ]
        );

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
        try {
            $token = $user->currentAccessToken();
            if ($token && method_exists($token, 'delete')) {
                $token->delete();
            } else {
                $user->tokens()->delete();
            }
        } catch (\Exception $e) {
            // swallow errors for logout
        }
    }

    public function checkEmail(string $email): bool
    {
        return User::where('email', strtolower(trim($email)))->exists();
    }
}
