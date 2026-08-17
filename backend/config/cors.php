<?php

$isProduction = config('app.env') === 'production';

$origins = array_values(array_filter(array_map('trim', explode(',', env('FRONTEND_URL', ''))))) ?: [
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:19006',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:8082',
    'http://172.19.192.179:8000',
    'http://172.19.192.179:8081',
    'http://172.19.192.179:8082',
];

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    'allowed_origins' => $origins,
    'allowed_origins_patterns' => $isProduction ? [] : [
        '/^https?:\/\/(localhost|127\.0\.0\.1|172\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|9\.\d+\.\d+\.\d+)(:\d+)?$/',
        '/^https?:\/\/.*\.loca\.lt(:\d+)?$/',
        '/^https?:\/\/.*\.ngrok-free\.app$/',
        '/^https?:\/\/.*\.ngrok-free\.dev$/',
        '/^https?:\/\/.*\.ngrok\.app$/',
        '/^https?:\/\/.*\.ngrok\.io$/',
        '/^https?:\/\/.*\.exp\.direct(:\d+)?$/',
    ],
    'allowed_headers' => ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'ngrok-skip-browser-warning'],
    'exposed_headers' => [],
    'max_age' => 86400,
    'supports_credentials' => false,
];
