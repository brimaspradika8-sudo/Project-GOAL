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
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Auth\Events\PasswordReset;
class PasswordResetController extends Controller
{
    public function forgot(ForgotPasswordRequest $request): JsonResponse
    {
        $email = strtolower(trim($request->email));

        $user = \App\Models\User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'Email tidak terdaftar di sistem kami.',
            ], 404);
        }

        $token = Password::broker('users')->createToken($user);
        
        try {
            Mail::to($email)->send(new ResetPasswordMail($token, $email));
        } catch (\Exception $e) {
            // If mail fails, we might still want to proceed in local development
            \Log::error('Mail fail: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Tautan reset password telah dikirim ke email Anda. Silakan cek inbox atau folder spam.',
            'email' => $email
        ]);
    }

    public function token(VerifyTokenRequest $request): JsonResponse
    {
        $user = \App\Models\User::where('email', strtolower(trim($request->email)))->first();

        if (!$user) {
            return response()->json(['valid' => false, 'message' => 'Token tidak valid.'], 422);
        }

        $tokenRecord = DB::table('password_reset_tokens')
            ->where('email', $user->email)
            ->first();

        if (!$tokenRecord) {
            return response()->json(['valid' => false, 'message' => 'Token tidak valid atau sudah kedaluwarsa.'], 422);
        }

        $createdAt = \Carbon\Carbon::parse($tokenRecord->created_at);
        $expire = config('auth.passwords.users.expire', 60);

        $isValid = Hash::check($request->token, $tokenRecord->token)
            && !$createdAt->copy()->addMinutes($expire)->isPast();

        if (!$isValid) {
            return response()->json(['valid' => false, 'message' => 'Token tidak valid atau sudah kedaluwarsa.'], 422);
        }

        return response()->json(['valid' => true]);
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
                    'password'       => Hash::make($password),
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
            return response()->json([
                'message' => 'Password berhasil direset. Silakan login.',
            ]);
        }

        return response()->json([
            'message' => 'Token tidak valid atau sudah kedaluwarsa.',
        ], 422);
    }
}
