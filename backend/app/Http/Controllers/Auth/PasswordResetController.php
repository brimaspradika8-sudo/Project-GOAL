<?php

namespace App\Http\Controllers\Auth;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\VerifyTokenRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Mail\ResetPasswordMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Auth\Events\PasswordReset;
/**
 * @tags Authentication
 */
class PasswordResetController extends Controller
{
    public function forgot(ForgotPasswordRequest $request): JsonResponse
    {
        $email = strtolower(trim($request->email));

        $user = \App\Models\User::where('email', $email)->first();

        if (!$user) {
            return $this->errorResponse('Email tidak terdaftar.', ['email' => ['Email tidak terdaftar.']], 422);
        }

        /** @var \Illuminate\Auth\Passwords\PasswordBroker $broker */
        $broker = Password::broker('users');
        $token = $broker->createToken($user);

        try {
            Mail::to($email)->send(new ResetPasswordMail($token, $email));
        } catch (\Exception $e) {
            Log::error('Password reset mail failed.', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);

            return $this->errorResponse('Email reset password gagal dikirim. Silakan coba lagi.', [], 503);
        }

        return $this->successResponse('Tautan reset password telah dikirim ke email Anda.');
    }

    public function token(VerifyTokenRequest $request): JsonResponse
    {
        $user = \App\Models\User::where('email', strtolower(trim($request->email)))->first();

        if (!$user) {
            return $this->errorResponse('Token tidak valid.', ['token' => ['Token tidak valid.']], 422);
        }

        $tokenRecord = DB::table('password_reset_tokens')
            ->where('email', $user->email)
            ->first();

        if (!$tokenRecord) {
            return $this->errorResponse('Token tidak valid atau sudah kedaluwarsa.', ['token' => ['Token tidak valid atau sudah kedaluwarsa.']], 422);
        }

        $createdAt = \Carbon\Carbon::parse($tokenRecord->created_at);
        $expire = config('auth.passwords.users.expire', 60);

        $isValid = Hash::check($request->token, $tokenRecord->token)
            && !$createdAt->copy()->addMinutes($expire)->isPast();

        if (!$isValid) {
            return $this->errorResponse('Token tidak valid atau sudah kedaluwarsa.', ['token' => ['Token tidak valid atau sudah kedaluwarsa.']], 422);
        }

        return $this->successResponse('Token valid.', ['valid' => true]);
    }

    public function reset(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::broker('users')->reset(
            [
                'email'                 => strtolower(trim($request->email)),
                'token'                 => $request->token,
                'password'              => $request->password,
                'password_confirmation' => $request->password_confirmation,
            ],
            function ($user, $password) {
                $user->forceFill([
                    'password'       => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                $user->tokens()->delete();

                DB::table('password_reset_tokens')
                    ->where('email', $user->email)
                    ->delete();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return $this->successResponse('Password berhasil direset. Silakan login.');
        }

        return $this->errorResponse('Token tidak valid atau sudah kedaluwarsa.', ['token' => ['Token tidak valid atau sudah kedaluwarsa.']], 422);
    }
}
