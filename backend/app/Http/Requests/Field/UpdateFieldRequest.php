<?php

namespace App\Http\Requests\Field;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Enums\SportType;

class UpdateFieldRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'name'            => 'sometimes|required|string|max:255',
            'sport_type'      => ['sometimes', 'required', 'string', 'max:50', Rule::in(SportType::values())],
            'location'        => 'nullable|string|max:255',
            'description'     => 'nullable|string|max:1000',
            'price_per_hour'  => ['nullable', 'numeric', 'min:0'],
            'image_url'       => 'nullable|string|max:2048',
        ];

        $min = config('goal.price_min');
        $max = config('goal.price_max');

        if (is_numeric($min)) {
            $rules['price_per_hour'][] = 'min:' . (int) $min;
        }

        if (is_numeric($max)) {
            $rules['price_per_hour'][] = 'max:' . (int) $max;
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'sport_type.in'       => 'Jenis olahraga tidak valid. Pilih salah satu kategori yang tersedia.',
            'price_per_hour.numeric' => 'Harga harus berupa angka.',
            'image.max'           => 'Ukuran gambar maksimal 5 MB.',
        ];
    }
}
