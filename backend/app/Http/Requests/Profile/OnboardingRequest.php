<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class OnboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'username'   => ['required', 'string', 'min:3', 'max:20', 'regex:/^[a-zA-Z0-9_]+$/'],
            'sports'     => 'required|array|min:1',
            'sports.*'   => 'string|max:100',
            'region'     => 'nullable|string|max:100',
            'avatar_url' => 'nullable|string|max:2048',
        ];
    }

    public function messages(): array
    {
        return [
            'username.required' => 'Username wajib diisi.',
            'username.min'      => 'Username minimal 3 karakter.',
            'username.max'      => 'Username maksimal 20 karakter.',
            'username.regex'    => 'Username hanya boleh huruf, angka, dan underscore.',
            'sports.required'   => 'Pilih minimal 1 olahraga.',
            'sports.min'        => 'Pilih minimal 1 olahraga.',
        ];
    }
}
