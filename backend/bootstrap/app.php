<?php

use App\Exceptions\BookingAlreadyExpiredException;
use App\Exceptions\BookingAlreadyProcessedException;
use App\Exceptions\BookingCannotBeCancelledException;
use App\Exceptions\BookingConflictException;
use App\Exceptions\InvalidBookingStatusException;
use App\Exceptions\InvalidBookingStatusTransitionException;
use App\Exceptions\UnauthorizedBookingActionException;
use App\Http\Middleware\Authenticate;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\NotFoundHttpException;
use Illuminate\Http\Middleware\HandleCors;
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
            'role' => RoleMiddleware::class,
            'auth' => Authenticate::class,
        ]);
        $middleware->api(prepend: [
            HandleCors::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->renderable(function (Throwable $e) {
            $request = request();
            $isApi = str_starts_with(trim($request->path(), '/'), 'api') || $request->is('api/*') || $request->expectsJson();

            if (! $isApi) {
                return null;
            }

            if ($e instanceof AuthenticationException) {
                return response()->json(['message' => 'Unauthorized.', 'errors' => []], 401);
            }

            if ($e instanceof ValidationException) {
                return response()->json([
                    'message' => 'Validasi gagal.',
                    'errors' => $e->errors(),
                ], 422);
            }

            if ($e instanceof NotFoundHttpException) {
                return response()->json(['message' => 'Endpoint tidak ditemukan.', 'errors' => []], 404);
            }

            if ($e instanceof MethodNotAllowedHttpException) {
                return response()->json(['message' => 'Method tidak diizinkan.', 'errors' => []], 405);
            }

            if ($e instanceof AccessDeniedHttpException) {
                return response()->json(['message' => 'Akses ditolak.', 'errors' => []], 403);
            }

            if ($e instanceof TooManyRequestsHttpException) {
                return response()->json(['message' => 'Terlalu banyak permintaan. Coba lagi nanti.', 'errors' => []], 429);
            }

            if ($e instanceof UnauthorizedBookingActionException) {
                return response()->json(['message' => 'Anda tidak memiliki akses untuk melakukan ini.', 'errors' => []], 403);
            }

            if ($e instanceof BookingCannotBeCancelledException
                || $e instanceof BookingAlreadyProcessedException
                || $e instanceof BookingAlreadyExpiredException
                || $e instanceof InvalidBookingStatusException
                || $e instanceof InvalidBookingStatusTransitionException
                || $e instanceof BookingConflictException
            ) {
                return response()->json(['message' => $e->getMessage(), 'errors' => []], 409);
            }

            $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;

            report($e);

            if ($status >= 500) {
                return response()->json([
                    'message' => 'Terjadi kesalahan server.',
                    'errors' => [],
                ], 500);
            }

            return response()->json([
                'message' => 'Terjadi kesalahan.',
                'errors' => [],
            ], $status);
        });
    })->create();
