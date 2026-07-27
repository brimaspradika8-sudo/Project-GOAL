<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class SupabaseInitBucket extends Command
{
    protected $signature = 'supabase:init-bucket';
    protected $description = 'Create and configure the Supabase Storage bucket';

    public function handle(): int
    {
        $url    = config('services.supabase.url');
        $key    = env('SUPABASE_SERVICE_KEY');
        $bucket = config('services.supabase.bucket');

        if (!$url || !$key || !$bucket) {
            $this->error('SUPABASE_URL, SUPABASE_SERVICE_KEY, or SUPABASE_STORAGE_BUCKET is missing in .env');
            return 1;
        }

        $this->info("Creating bucket: {$bucket}");

        $createResponse = Http::withHeaders([
            'Authorization' => "Bearer {$key}",
            'Content-Type'  => 'application/json',
        ])->timeout(15)->post("{$url}/storage/v1/bucket", [
            'id'    => $bucket,
            'name'  => $bucket,
            'public' => true,
        ]);

        if ($createResponse->successful()) {
            $this->info('Bucket created successfully (public).');
        } else {
            $status = $createResponse->status();
            $body   = $createResponse->body();
            if (str_contains($body, 'already exists')) {
                $this->info('Bucket already exists.');
            } else {
                $this->error("Failed to create bucket (HTTP {$status}): {$body}");
                return 1;
            }
        }

        $updateResponse = Http::withHeaders([
            'Authorization' => "Bearer {$key}",
            'Content-Type'  => 'application/json',
        ])->timeout(15)->post("{$url}/storage/v1/bucket/{$bucket}", [
            'public' => true,
        ]);

        if ($updateResponse->successful()) {
            $this->info('Bucket is now public.');
        }

        $testUpload = Http::withHeaders([
            'Authorization' => "Bearer {$key}",
            'Content-Type'  => 'application/octet-stream',
        ])->timeout(15)->post("{$url}/storage/v1/object/{$bucket}/test/ping.txt", 'ok');

        if ($testUpload->successful()) {
            $this->info('Test upload successful!');
        } else {
            $this->error('Test upload failed: ' . $testUpload->body());
            return 1;
        }

        $deleteTest = Http::withHeaders([
            'Authorization' => "Bearer {$key}",
        ])->timeout(15)->delete("{$url}/storage/v1/object/{$bucket}/test/ping.txt");

        if ($deleteTest->successful()) {
            $this->info('Test file cleaned up.');
        }

        $this->info("Done! Public URL format: {$url}/storage/v1/object/public/{$bucket}/{{path}}");
        return 0;
    }
}
