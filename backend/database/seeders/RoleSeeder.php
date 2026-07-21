<?php
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
$hash = Hash::make('123456');
$hashAdmin = Hash::make('Admin123');
$uid = DB::getPdo()->lastInsertId();

DB::table('profiles')->where('user_id', 1)->update([
    'role' => 'player', 'onboarding_completed' => true, 'username' => 'player1',
]);
DB::table('profiles')->where('user_id', 2)->update([
    'role' => 'admin', 'onboarding_completed' => true, 'username' => 'admin1',
]);
DB::table('profiles')->insert([
    'user_id'              => (int) $uid,
    'role'                 => 'super_admin',
    'onboarding_completed' => true,
    'username'             => 'superadmin1',
    'created_at'           => now(),
    'updated_at'           => now(),
]);

DB::table('users')->insert([
    'name'       => 'brimassuperadmin',
    'email'      => 'brimassuperadmin@example.com',
    'password'   => $hashAdmin,
    'created_at' => now(),
    'updated_at' => now(),
]);
$uid2 = DB::getPdo()->lastInsertId();

DB::table('profiles')->insert([
    'user_id'              => (int) $uid2,
    'role'                 => 'super_admin',
    'onboarding_completed' => true,
    'username'             => 'brimassuperadmin',
    'created_at'           => now(),
    'updated_at'           => now(),
]);

echo "Users: " . DB::table('users')->count() . ", Profiles: " . DB::table('profiles')->count();
