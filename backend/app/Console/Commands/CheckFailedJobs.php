<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CheckFailedJobs extends Command
{
    protected $signature = 'goal:check-failed-jobs';

    protected $description = 'Memeriksa job yang gagal dan mencatatnya ke log';

    public function handle(): int
    {
        $count = DB::table('failed_jobs')->count();

        if ($count === 0) {
            $this->info('Tidak ada failed jobs.');
            return self::SUCCESS;
        }

        Log::warning("[GOAL] Terdapat {$count} failed job(s). Jalankan 'php artisan queue:retry all' untuk mengulang.");

        $this->table(
            ['id', 'connection', 'queue', 'payload'],
            DB::table('failed_jobs')
                ->select('id', 'connection', 'queue', DB::raw('substring(payload, 1, 120) as payload'))
                ->limit(10)
                ->get()
                ->toArray()
        );

        return self::SUCCESS;
    }
}
