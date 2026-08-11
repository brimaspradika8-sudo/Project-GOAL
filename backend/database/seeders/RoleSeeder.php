<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use App\Models\Profile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $player = User::firstOrCreate(
            ['email' => 'player@goal.test'],
            ['name' => 'Player One', 'password' => Hash::make('Player123')]
        );
        Profile::firstOrCreate(
            ['user_id' => $player->id],
            ['role' => UserRole::PLAYER->value, 'onboarding_completed' => true, 'username' => 'player1']
        );

        $owner = User::firstOrCreate(
            ['email' => 'owner@goal.test'],
            ['name' => 'Owner One', 'password' => Hash::make('Owner1234')]
        );
        Profile::firstOrCreate(
            ['user_id' => $owner->id],
            ['role' => UserRole::OWNER->value, 'is_owner_verified' => true, 'onboarding_completed' => true, 'username' => 'owner1']
        );

        $superAdmin = User::firstOrCreate(
            ['email' => 'superadmin@goal.test'],
            ['name' => 'Super Admin', 'password' => Hash::make('SuperAdmin123')]
        );
        Profile::firstOrCreate(
            ['user_id' => $superAdmin->id],
            ['role' => UserRole::SUPER_ADMIN->value, 'onboarding_completed' => true, 'username' => 'superadmin1']
        );
    }
}
