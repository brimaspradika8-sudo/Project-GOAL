<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password as PasswordRule;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'                  => 'required|string|max:255',
            'email'                 => 'required|email|unique:users,email',
            'password'              => ['required', 'string', PasswordRule::min(8)->mixedCase()->numbers(), 'confirmed'],
            'password_confirmation' => 'required|string',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'                 => 'Nama wajib diisi.',
            'email.required'                => 'Email wajib diisi.',
            'email.email'                   => 'Format email tidak valid.',
            'email.unique'                  => 'Email sudah terdaftar.',
            'password.required'             => 'Kata sandi wajib diisi.',
            'password.min'                  => 'Kata sandi minimal 8 karakter dengan huruf besar dan angka.',
            'password.confirmed'            => 'Konfirmasi kata sandi tidak sesuai.',
            'password_confirmation.required'=> 'Konfirmasi kata sandi wajib diisi.',
        ];
    }
}
