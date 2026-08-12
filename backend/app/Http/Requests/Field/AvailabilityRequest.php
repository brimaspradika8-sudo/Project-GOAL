<?php

namespace App\Http\Requests\Field;

use Illuminate\Foundation\Http\FormRequest;

class AvailabilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date' => ['required_without:tanggal', 'date_format:Y-m-d'],
            'tanggal' => ['required_without:date', 'date_format:Y-m-d'],
        ];
    }
}
