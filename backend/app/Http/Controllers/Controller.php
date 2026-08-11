<?php

namespace App\Http\Controllers;

abstract class Controller
{
    protected function successResponse(string $message, mixed $data = null, int $status = 200)
    {
        return response()->json([
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    protected function errorResponse(string $message, array $errors = [], int $status = 400)
    {
        return response()->json([
            'message' => $message,
            'errors' => $errors,
        ], $status);
    }
}
