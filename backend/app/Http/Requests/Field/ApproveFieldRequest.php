<?php

namespace App\Http\Requests\Field;

use Illuminate\Foundation\Http\FormRequest;

class ApproveFieldRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => 'required|in:approved,rejected',
            'reason' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Status wajib diisi.',
            'status.in'       => 'Status hanya boleh approved atau rejected.',
        ];
    }
}
