<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SupabaseStorageService
{
    private string $baseUrl;
    private string $projectUrl;
    private string $serviceKey;
    private string $bucket;
    private string $publicBase;

    public function __construct()
    {
        $this->projectUrl = rtrim(config('services.supabase.url'), '/');
        $this->serviceKey = config('services.supabase.key');
        $this->bucket = config('services.supabase.bucket', 'images');
        $this->baseUrl = "{$this->projectUrl}/storage/v1/object";
        $this->publicBase = "{$this->projectUrl}/storage/v1/object/public";
    }

    private function auth(): PendingRequest
    {
        return Http::withToken($this->serviceKey)
            ->acceptJson()
            ->throw();
    }

    public function upload(string $path, string $contents, string $contentType = 'image/jpeg'): string
    {
        $fullPath = "{$this->bucket}/{$path}";

        $response = $this->auth()->withBody($contents, $contentType)
            ->post("{$this->baseUrl}/{$fullPath}");

        if (!$response->successful()) {
            Log::error('Supabase upload failed', [
                'path' => $fullPath,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException('Gagal mengunggah gambar ke penyimpanan.');
        }

        return "{$this->publicBase}/{$fullPath}";
    }

    public function delete(string $publicUrl): bool
    {
        $bucketPath = $this->extractBucketPath($publicUrl);
        if (!$bucketPath) {
            return false;
        }

        $response = $this->auth()->delete("{$this->baseUrl}/{$bucketPath}");

        if ($response->status() === 400) {
            Log::warning('Supabase delete returned 400 (possibly file does not exist)', [
                'path' => $bucketPath,
                'body' => $response->body(),
            ]);
            return true;
        }

        if (!$response->successful()) {
            Log::error('Supabase delete failed', [
                'path' => $bucketPath,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return false;
        }

        return true;
    }

    public function getPublicUrl(string $path): string
    {
        return "{$this->publicBase}/{$this->bucket}/{$path}";
    }

    public function extractBucketPath(string $publicUrl): ?string
    {
        $prefix = "{$this->publicBase}/{$this->bucket}/";
        if (str_starts_with($publicUrl, $prefix)) {
            return "{$this->bucket}/" . substr($publicUrl, strlen($prefix));
        }

        $prefixLegacy = "{$this->publicBase}/";
        if (str_starts_with($publicUrl, $prefixLegacy)) {
            return substr($publicUrl, strlen($prefixLegacy));
        }

        return null;
    }
}
