<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Field;
use App\Models\Notification;
use App\Models\Profile;
use App\Enums\UserRole;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;
    public function run(): void
    {
        $superAdmin = $this->user('Super Admin', 'superadmin@goal.test', UserRole::SUPER_ADMIN);
        $superAdminBrimas = $this->user('Brimas Pradika', 'brimas.pradika14@smk.belajar.id', UserRole::SUPER_ADMIN, false, 'Admin123');
        $owner = $this->user('Goal Owner', 'owner@goal.test', UserRole::OWNER, true);
        $player = $this->user('Goal Player', 'player@goal.test', UserRole::PLAYER);

        $field = Field::updateOrCreate(
            ['owner_id' => $owner->id, 'name' => 'Goal Arena Futsal'],
            [
                'sport_type' => 'futsal',
                'location' => 'Jakarta',
                'description' => 'Lapangan development untuk pengujian.',
                'price_per_hour' => 150000,
                'status' => 'approved',
                'approved_by' => $superAdmin->id,
                'approved_at' => now(),
            ]
        );

        Notification::updateOrCreate(
            ['user_id' => $superAdmin->id, 'type' => Notification::TYPE_FIELD_SUBMITTED, 'title' => 'Development seed'],
            ['body' => 'Data notifikasi development.', 'data' => ['field_id' => $field->id]]
        );

        // Keep the player referenced so seed data stays explicit and easy to discover.
        $player->profile()->update(['onboarding_completed' => true]);
    }

    private function user(string $name, string $email, UserRole $role, bool $verifiedOwner = false, string $password = 'Password123!'): User
    {
        $user = User::updateOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => Hash::make($password), 'email_verified_at' => now()]
        );

        Profile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'email' => $email,
                'full_name' => $name,
                'username' => strtolower(str_replace(['@', '.'], '_', explode('@', $email)[0])),
                'role' => $role->value,
                'is_owner_verified' => $verifiedOwner,
                'onboarding_completed' => true,
            ]
        );

        return $user->fresh('profile');
    }
}
