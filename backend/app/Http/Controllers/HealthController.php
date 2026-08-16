<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;

class HealthController extends Controller
{
    /**
     * Health check endpoint for monitoring & uptime services.
     * Returns 200 if all systems are operational, 503 if degraded.
     */
    public function check(): JsonResponse
    {
        $checks = [];
        $allHealthy = true;

        // ── Database check ──────────────────────────────────────────────
        try {
            DB::statement('SELECT 1');
            $checks['database'] = ['status' => 'ok'];
        } catch (\Throwable $e) {
            $checks['database'] = ['status' => 'error', 'message' => 'Database unreachable'];
            $allHealthy = false;
        }

        // ── Cache check ──────────────────────────────────────────────────
        try {
            $key = 'health_check_probe';
            Cache::put($key, 'ok', 5);
            $val = Cache::get($key);
            $checks['cache'] = $val === 'ok'
                ? ['status' => 'ok']
                : ['status' => 'error', 'message' => 'Cache read/write mismatch'];
            if ($val !== 'ok') {
                $allHealthy = false;
            }
        } catch (\Throwable $e) {
            $checks['cache'] = ['status' => 'error', 'message' => 'Cache unreachable'];
            $allHealthy = false;
        }

        // ── Queue check (pastikan tabel jobs ada) ─────────────────────────
        try {
            $failedCount = DB::table('failed_jobs')->count();
            $pendingCount = DB::table('jobs')->count();
            $checks['queue'] = [
                'status'        => 'ok',
                'pending_jobs'  => $pendingCount,
                'failed_jobs'   => $failedCount,
            ];
        } catch (\Throwable $e) {
            $checks['queue'] = ['status' => 'error', 'message' => 'Queue table unreachable'];
            $allHealthy = false;
        }

        // ── App info ──────────────────────────────────────────────────────
        $checks['app'] = [
            'status'  => 'ok',
            'env'     => config('app.env'),
            'version' => config('app.version', '1.0.0'),
        ];

        $httpStatus = $allHealthy ? 200 : 503;

        return response()->json([
            'status'    => $allHealthy ? 'healthy' : 'degraded',
            'timestamp' => now()->toISOString(),
            'checks'    => $checks,
        ], $httpStatus);
    }
}
