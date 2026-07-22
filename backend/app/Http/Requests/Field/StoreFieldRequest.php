<?php

namespace App\Http\Requests\Field;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Enums\SportType;

class StoreFieldRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            // keep existing name/description rules as-is per project guidelines
            'name'            => 'required|string|max:255',
            'sport_type'      => ['required', 'string', 'max:50', Rule::in(SportType::values())],
            'location'        => 'nullable|string|max:255',
            'description'     => 'nullable|string|max:1000',
            'price_per_hour'  => ['nullable', 'numeric', 'min:0'],
            'image_url'       => 'nullable|string|max:2048',
        ];

        // Apply configured business limits for price if set in config (null means not enforced)
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
            'name.required'       => 'Nama lapangan wajib diisi.',
            'sport_type.required' => 'Jenis olahraga wajib diisi.',
            'sport_type.in'       => 'Jenis olahraga tidak valid. Pilih salah satu kategori yang tersedia.',
            'location.required'   => 'Lokasi wajib diisi.',
            'price_per_hour.min'  => 'Harga tidak boleh negatif.',
            'price_per_hour.numeric' => 'Harga harus berupa angka.',
            'image.max'           => 'Ukuran gambar maksimal 5 MB.',
        ];
    }
}
