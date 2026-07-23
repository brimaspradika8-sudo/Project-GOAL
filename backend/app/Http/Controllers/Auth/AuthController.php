<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\CheckEmailRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private AuthService $auth
    ) {}
    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $result = $this->auth->register($request->validated());

            return response()->json([
                'message' => 'Registrasi berhasil.',
                ...$result,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
            
        } catch (\Exception $e) {
            return response()->json(['message' => 'Registrasi gagal. Silakan coba lagi nanti.'], 500);
        }
    }
    
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $result = $this->auth->login(
                $request->email,
                $request->password
            );

            return response()->json([
                'message' => 'Login berhasil.',
                ...$result,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 401);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Login gagal. Silakan coba lagi nanti.',
            ], 500);
        }
    }

    public function logout(Request $request): JsonResponse
    {
        $this->auth->logout($request->user());

        return response()->json([
            'message' => 'Logout berhasil.',
        ]);
    }

    public function checkEmail(CheckEmailRequest $request): JsonResponse
    {
        $exists = $this->auth->checkEmail($request->email);

        return response()->json(['exists' => $exists]);
    }
}
