<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $email = 'superadmin@goal.com';
        $password = 'admin12345';

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name'              => 'Super Admin',
                'password'          => Hash::make($password),
                'email_verified_at' => now(),
            ]
        );

        Profile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'email'                => $email,
                'full_name'            => 'Super Admin GOAL',
                'username'             => 'superadmin',
                'role'                 => UserRole::SUPER_ADMIN->value,
                'is_owner_verified'    => false,
                'onboarding_completed' => true,
            ]
        );

        $this->command->info("Super Admin account seeded successfully!");
        $this->command->info("Email: {$email}");
        $this->command->info("Password: {$password}");
    }
}
