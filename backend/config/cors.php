<?php

$isProduction = config('app.env') === 'production';

$origins = $isProduction
    ? array_filter(array_map('trim', explode(',', env('FRONTEND_URL', ''))))
    : [
        'http://localhost:8081',
        'http://localhost:19006',
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://127.0.0.1:8081',
        'http://9.9.8.117:8000',
        'http://9.9.8.117:8081',
    ];

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    'allowed_origins' => $origins,
    'allowed_origins_patterns' => $isProduction ? [] : [
        '/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|9\.\d+\.\d+\.\d+)(:\d+)?$/',
        '/^https?:\/\/.*\.loca\.lt(:\d+)?$/',
    ],
    'allowed_headers' => ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    'exposed_headers' => [],
    'max_age' => 86400,
    'supports_credentials' => false,
];
