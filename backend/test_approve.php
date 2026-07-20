<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\OwnerRequest;
use App\Models\User;
use App\Services\OwnerRequestService;

try {
    $req = OwnerRequest::first();
    if (!$req) {
        echo "No owner requests found.\n";
        exit;
    }
    
    $admin = User::first();
    
    $service = app(OwnerRequestService::class);
    $result = $service->approve($req, $admin);
    echo "Approved successfully. New Status: " . $result->status . "\n";
} catch (\Throwable $e) {
    echo "Exception: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
