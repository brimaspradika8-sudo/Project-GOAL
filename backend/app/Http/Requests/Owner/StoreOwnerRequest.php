<?php

namespace App\Http\Requests\Owner;

use Illuminate\Foundation\Http\FormRequest;

class StoreOwnerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'           => 'required|string|min:3|max:50',
            'email'          => 'required|email|max:255',
            'business_name'  => 'required|string|min:3|max:50',
            'address'        => 'required|string|min:5|max:500',
            'phone'          => 'required|string|digits_between:8,15',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'          => 'Nama wajib diisi.',
            'name.min'               => 'Nama minimal 3 karakter.',
            'name.max'               => 'Nama tidak boleh lebih dari 50 karakter.',
            'email.required'         => 'Email wajib diisi.',
            'email.email'            => 'Format email tidak valid.',
            'business_name.required' => 'Nama usaha wajib diisi.',
            'business_name.min'      => 'Nama usaha minimal 3 karakter.',
            'business_name.max'      => 'Nama usaha tidak boleh lebih dari 50 karakter.',
            'address.required'       => 'Alamat wajib diisi.',
            'address.min'            => 'Alamat minimal 5 karakter.',
            'address.max'            => 'Alamat tidak boleh lebih dari 500 karakter.',
            'phone.required'         => 'Nomor telepon wajib diisi.',
            'phone.digits_between'   => 'Nomor telepon hanya boleh berisi angka dengan panjang 8-15 digit.',
        ];
    }
}
