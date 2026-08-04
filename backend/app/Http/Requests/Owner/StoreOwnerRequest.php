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
            'name'           => 'required|string|max:255',
            'email'          => 'required|email|max:255',
            'business_name'  => 'required|string|max:255',
            'address'        => 'required|string|max:500',
            'phone'          => 'required|string|digits_between:8,15',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'          => 'Nama wajib diisi.',
            'email.required'         => 'Email wajib diisi.',
            'email.email'            => 'Format email tidak valid.',
            'business_name.required' => 'Nama usaha wajib diisi.',
            'address.required'       => 'Alamat wajib diisi.',
            'phone.required'         => 'Nomor telepon wajib diisi.',
            'phone.digits_between'   => 'Nomor telepon hanya boleh berisi angka dengan panjang 8-15 digit.',
        ];
    }
}
