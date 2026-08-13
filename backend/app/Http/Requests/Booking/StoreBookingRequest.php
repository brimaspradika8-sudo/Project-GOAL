<?php

namespace App\Http\Requests\Booking;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'field_id'     => ['required', 'integer', 'exists:fields,id'],
            'booking_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'slots'        => ['required', 'array', 'min:1', 'max:3'],
            'slots.*.start_time' => ['required', 'date_format:H:i'],
            'slots.*.end_time'   => ['required', 'date_format:H:i', 'after:slots.*.start_time'],
            'payment_method' => ['sometimes', 'in:cash'],
        ];
    }

    public function messages(): array
    {
        return [
            'booking_date.after_or_equal' => 'Tanggal booking tidak boleh di masa lalu.',
            'slots.required'              => 'Pilih minimal satu slot.',
            'slots.min'                   => 'Pilih minimal satu slot.',
            'slots.max'                   => 'Maksimal 3 slot per booking.',
            'payment_method.in'           => 'Metode pembayaran tidak valid.',
        ];
    }
}
