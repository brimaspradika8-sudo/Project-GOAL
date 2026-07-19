<?php

namespace App\Http\Requests\Owner;

use Illuminate\Foundation\Http\FormRequest;

class ReviewOwnerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status'  => 'required|in:approved,rejected',
            'reason'  => 'required_if:status,rejected|nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Status wajib diisi.',
            'status.in'       => 'Status hanya boleh approved atau rejected.',
            'reason.required_if' => 'Alasan penolakan wajib diisi.',
        ];
    }
}
