<?php

namespace App\Http\Requests\Field;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Enums\SportType;
use App\Models\FieldValidationSetting;

class StoreFieldRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $settings = FieldValidationSetting::current();

        return [
            'name'            => 'required|string|min:5|max:' . $settings->max_name_length,
            'sport_type'      => ['required', 'string', 'max:50', Rule::exists('sports', 'slug')->where('is_active', true)],
            'location'        => 'nullable|string|max:255',
            'description'     => 'nullable|string|min:10|max:' . $settings->max_description_length,
            'price_per_hour'  => ['nullable', 'integer', 'min:' . $settings->min_price, 'max:' . $settings->max_price],
            'image_url'       => 'required|url|max:2048',
        ];
    }

    public function messages(): array
    {
        $settings = FieldValidationSetting::current();
        $fmt = fn (int $v) => 'Rp ' . number_format($v, 0, ',', '.');

        return [
            'name.required'           => 'Nama lapangan wajib diisi.',
            'name.string'             => 'Nama lapangan harus berupa teks.',
            'name.min'                => 'Nama lapangan minimal 5 karakter.',
            'name.max'                => 'Nama lapangan tidak boleh lebih dari ' . $settings->max_name_length . ' karakter.',
            'sport_type.required'     => 'Jenis olahraga wajib diisi.',
            'sport_type.string'       => 'Jenis olahraga harus berupa teks.',
            'sport_type.max'          => 'Jenis olahraga tidak boleh lebih dari 50 karakter.',
            'sport_type.in'           => 'Jenis olahraga tidak valid. Pilih salah satu kategori yang tersedia.',
            'location.string'         => 'Lokasi harus berupa teks.',
            'location.max'            => 'Lokasi tidak boleh lebih dari 255 karakter.',
            'description.string'      => 'Deskripsi harus berupa teks.',
            'description.min'         => 'Deskripsi minimal 10 karakter jika diisi.',
            'description.max'         => 'Deskripsi tidak boleh lebih dari ' . $settings->max_description_length . ' karakter.',
            'price_per_hour.integer'  => 'Harga harus berupa angka bulat.',
            'price_per_hour.numeric'  => 'Harga harus berupa angka bulat.',
            'price_per_hour.min'      => 'Harga per jam tidak boleh kurang dari ' . $fmt($settings->min_price) . '.',
            'price_per_hour.max'      => 'Harga per jam tidak boleh lebih dari ' . $fmt($settings->max_price) . '.',
            'image_url.required'      => 'Gambar utama lapangan wajib diisi.',
            'image_url.url'           => 'URL gambar harus berformat URL yang valid.',
            'image_url.max'           => 'URL gambar tidak boleh lebih dari 2048 karakter.',
        ];
    }
}
