<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$secret = config('services.supabase.jwt_secret');
echo "JWT Secret: " . substr($secret, 0, 20) . "...\n";

$payload = [
    'iss' => 'supabase',
    'sub' => '679a73af-2ec5-4fd6-8588-9e529eba9126',
    'email' => 'brimaspradika8@gmail.com',
    'role' => 'authenticated',
    'iat' => time(),
    'exp' => time() + 3600
];

$token = Firebase\JWT\JWT::encode($payload, $secret, 'HS256');
echo "Token: " . $token . "\n";
