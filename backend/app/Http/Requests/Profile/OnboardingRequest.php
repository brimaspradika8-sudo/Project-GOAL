<?php

namespace App\Http\Requests\Profile;

use App\Enums\SportType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'sports.*'   => ['string', 'max:100', Rule::in(SportType::values())],
            'region'     => 'nullable|string|max:100',
            'avatar_url' => ['nullable', 'url', 'max:2048', 'regex:/^https?:\/\//i'],
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
            'avatar_url.url'    => 'URL avatar harus berformat URL yang valid.',
        ];
    }
}
