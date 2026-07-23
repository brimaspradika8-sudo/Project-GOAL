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
            'name'            => 'required|string|min:5|max:50',
            'sport_type'      => ['required', 'string', 'max:50', Rule::in(SportType::values())],
            'location'        => 'nullable|string|max:255',
            'description'     => 'nullable|string|min:50|max:255',
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
            'name.required'           => 'Nama lapangan wajib diisi.',
            'name.string'             => 'Nama lapangan harus berupa teks.',
            'name.min'                => 'Nama lapangan minimal 5 karakter.',
            'name.max'                => 'Nama lapangan tidak boleh lebih dari 50 karakter.',
            'sport_type.required'     => 'Jenis olahraga wajib diisi.',
            'sport_type.string'       => 'Jenis olahraga harus berupa teks.',
            'sport_type.max'          => 'Jenis olahraga tidak boleh lebih dari 50 karakter.',
            'sport_type.in'           => 'Jenis olahraga tidak valid. Pilih salah satu kategori yang tersedia.',
            'location.string'         => 'Lokasi harus berupa teks.',
            'location.max'            => 'Lokasi tidak boleh lebih dari 255 karakter.',
            'description.string'      => 'Deskripsi harus berupa teks.',
            'description.min'         => 'Deskripsi minimal 50 karakter jika diisi.',
            'description.max'         => 'Deskripsi tidak boleh lebih dari 255 karakter.',
            'price_per_hour.numeric'  => 'Harga harus berupa angka.',
            'price_per_hour.min'      => 'Harga per jam tidak boleh kurang dari batas minimum.',
            'price_per_hour.max'      => 'Harga per jam terlalu besar dan tidak wajar.',
            'image_url.string'        => 'URL gambar harus berupa teks.',
            'image_url.max'           => 'URL gambar tidak boleh lebih dari 2048 karakter.',
        ];
    }
}
