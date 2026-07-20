<?php

namespace App\Http\Requests\Field;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFieldRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'            => 'sometimes|required|string|max:255',
            'sport_type'      => 'sometimes|required|string|max:50',
            'location'        => 'nullable|string|max:255',
            'description'     => 'nullable|string|max:1000',
            'price_per_hour'  => 'nullable|integer|min:0',
            'image_url'       => 'nullable|string|max:2048',
        ];
    }
}
