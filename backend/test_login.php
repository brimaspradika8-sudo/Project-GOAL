<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$json = '{"email":"superadmin@gmail.com","password":"password123"}';

$request = new Illuminate\Http\Request();
$request->initialize(
    [],
    [],
    [],
    [],
    [],
    [
        'REQUEST_METHOD' => 'POST',
        'CONTENT_TYPE' => 'application/json',
        'HTTP_ACCEPT' => 'application/json',
        'REQUEST_URI' => '/api/auth/login',
        'SERVER_NAME' => 'localhost',
    ],
    $json
);

$response = $kernel->handle($request);

echo "=== HTTP Status: " . $response->getStatusCode() . " ===" . PHP_EOL;
echo $response->getContent() . PHP_EOL;
