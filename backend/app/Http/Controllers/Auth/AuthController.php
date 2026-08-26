<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @tags Authentication
 */
class AuthController extends Controller
{
    public function __construct(
        private AuthService $auth
    ) {}
    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $result = $this->auth->register($request->validated());

            return $this->successResponse('Registrasi berhasil.', $result, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse('Validasi gagal.', $e->errors(), 422);

        } catch (\Illuminate\Database\QueryException $e) {
            if ((int) $e->errorInfo[0] === 23505) {
                return $this->errorResponse('Email sudah terdaftar.', ['email' => ['Email sudah terdaftar.']], 422);
            }

            return $this->errorResponse('Registrasi gagal. Silakan coba lagi nanti.', [], 500);
        } catch (\Exception $e) {
            report($e);
            return $this->errorResponse('Registrasi gagal. Silakan coba lagi nanti.', [], 500);
        }
    }
    
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $result = $this->auth->login(
                $request->email,
                $request->password
            );

            return $this->successResponse('Login berhasil.', $result);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $firstError = collect($e->errors())->flatten()->first() ?? 'Email atau password salah.';
            return $this->errorResponse($firstError, [], 401);
        } catch (\Exception $e) {
            report($e);
            return $this->errorResponse('Login gagal. Silakan coba lagi nanti.', [], 500);
        }
    }

    public function logout(Request $request): JsonResponse
    {
        $this->auth->logout($request->user());

        return $this->successResponse('Logout berhasil.');
    }
}
