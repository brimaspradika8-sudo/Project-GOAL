<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password as PasswordRule;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email'                 => 'required|email',
            'token'                 => 'required|string',
            'password'              => ['required', 'confirmed', PasswordRule::min(8)->mixedCase()->numbers()],
            'password_confirmation' => 'required|string',
        ];
    }

    public function messages(): array
    {
        return [
            'email.required'                 => 'Email wajib diisi.',
            'email.email'                    => 'Format email tidak valid.',
            'token.required'                 => 'Token wajib diisi.',
            'password.required'              => 'Password wajib diisi.',
            'password.min'                   => 'Password minimal 8 karakter dengan huruf besar dan angka.',
            'password.confirmed'             => 'Konfirmasi password tidak sesuai.',
            'password_confirmation.required' => 'Konfirmasi password wajib diisi.',
        ];
    }
}
