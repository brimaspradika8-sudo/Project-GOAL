<?php

namespace App\Http\Controllers;

abstract class Controller
{
    protected function resourceResponse(string $message, mixed $resource, int $status = 200)
    {
        $data = method_exists($resource, 'resolve')
            ? $resource->resolve(request())
            : $resource;

        return $this->successResponse($message, $data, $status);
    }

    protected function successResponse(string $message, mixed $data = null, int $status = 200, array $meta = [])
    {
        $payload = [
            'success' => true,
            'message' => $message,
            'data' => $data,
        ];

        if ($meta !== []) {
            $payload['meta'] = $meta;
        }

        return response()->json($payload, $status);
    }

    protected function errorResponse(string $message, array $errors = [], int $status = 400)
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], $status);
    }
}
