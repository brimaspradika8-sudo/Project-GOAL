<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Profile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $player = User::firstOrCreate(
            ['email' => 'player@example.com'],
            ['name' => 'Player One', 'password' => Hash::make('Player123')]
        );
        Profile::firstOrCreate(
            ['user_id' => $player->id],
            ['role' => 'player', 'onboarding_completed' => true, 'username' => 'player1']
        );

        $superAdmin = User::firstOrCreate(
            ['email' => 'superadmin@example.com'],
            ['name' => 'Super Admin', 'password' => Hash::make('SuperAdmin123')]
        );
        Profile::firstOrCreate(
            ['user_id' => $superAdmin->id],
            ['role' => 'super_admin', 'onboarding_completed' => true, 'username' => 'superadmin1']
        );
    }
}
