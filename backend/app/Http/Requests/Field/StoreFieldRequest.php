<?php

namespace App\Http\Requests\Field;

use Illuminate\Foundation\Http\FormRequest;

class StoreFieldRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'            => 'required|string|max:255',
            'sport_type'      => 'required|string|max:50',
            'location'        => 'required|string|max:255',
            'description'     => 'nullable|string|max:1000',
            'price_per_hour'  => 'nullable|integer|min:0',
            'image_url'       => 'nullable|string|max:2048',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'       => 'Nama lapangan wajib diisi.',
            'sport_type.required' => 'Jenis olahraga wajib diisi.',
            'location.required'   => 'Lokasi wajib diisi.',
            'price_per_hour.min'  => 'Harga tidak boleh negatif.',
        ];
    }
}
