<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Exceptions\NotFoundHttpException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'auth' => \App\Http\Middleware\Authenticate::class,
        ]);
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->renderable(function (\Throwable $e) {
            $request = request();
            $isApi = str_starts_with($request->path(), 'api/') || $request->is('api/*');

            if (!$isApi) {
                return null;
            }

            if ($e instanceof AuthenticationException) {
                return response()->json(['message' => 'Unauthorized.'], 401);
            }

            if ($e instanceof ValidationException) {
                return response()->json([
                    'message' => 'Validasi gagal.',
                    'errors'  => $e->errors(),
                ], 422);
            }

            if ($e instanceof NotFoundHttpException) {
                return response()->json(['message' => 'Endpoint tidak ditemukan.'], 404);
            }

            if ($e instanceof MethodNotAllowedHttpException) {
                return response()->json(['message' => 'Method tidak diizinkan.'], 405);
            }

            if ($e instanceof AccessDeniedHttpException) {
                return response()->json(['message' => 'Akses ditolak.'], 403);
            }

            if ($e instanceof TooManyRequestsHttpException) {
                return response()->json(['message' => 'Terlalu banyak permintaan. Coba lagi nanti.'], 429);
            }

            $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;

            report($e);

            return response()->json([
                'message' => $status === 500
                    ? 'Terjadi kesalahan server. Silakan coba lagi.'
                    : 'Terjadi kesalahan.',
            ], $status);
        });
    })->create();
