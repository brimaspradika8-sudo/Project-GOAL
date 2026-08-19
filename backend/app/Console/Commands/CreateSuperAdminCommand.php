<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateSuperAdminCommand extends Command
{
    protected $signature = 'make:super-admin {email=brimas.pradika14@smk.belajar.id} {password=Admin123} {name=Brimas Pradika}';
    protected $description = 'Membuat atau meng-upgrade pengguna menjadi Super Admin';

    public function handle(): int
    {
        $email = $this->argument('email');
        $password = $this->argument('password');
        $name = $this->argument('name');

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ]
        );

        $username = strtolower(str_replace(['@', '.'], '_', explode('@', $email)[0]));

        Profile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'email' => $email,
                'full_name' => $name,
                'username' => $username,
                'role' => UserRole::SUPER_ADMIN->value,
                'is_owner_verified' => true,
                'onboarding_completed' => true,
            ]
        );

        $this->info("✅ Akun Super Admin berhasil dibuat/diperbarui!");
        $this->line("   Email: {$email}");
        $this->line("   Password: {$password}");
        $this->line("   Role: super_admin");

        return Command::SUCCESS;
    }
}
