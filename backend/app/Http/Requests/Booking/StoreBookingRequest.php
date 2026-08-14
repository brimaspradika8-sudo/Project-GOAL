<?php

namespace App\Http\Requests\Booking;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation()
    {
        $rawDate = $this->input('booking_date') ?? $this->input('date');

        if ($rawDate) {
            if (preg_match('/^(\d{4}-\d{2}-\d{2})/', (string) $rawDate, $matches)) {
                $rawDate = $matches[1];
            }
            $this->merge([
                'booking_date' => $rawDate,
                'date'         => $rawDate,
            ]);
        }

        if (! $this->input('payment_method')) {
            $this->merge(['payment_method' => 'cash']);
        }
    }

    public function rules(): array
    {
        return [
            'field_id'       => ['required', 'integer', 'exists:fields,id'],
            'booking_date'   => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'date'           => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'slots'          => ['required', 'array', 'min:1', 'max:3'],
            'slots.*'        => [
                'required',
                function ($attribute, $value, $fail) {
                    if (is_string($value)) {
                        if (!preg_match('/^(?:2[0-3]|[01][0-9]):[0-5][0-9]$/', $value)) {
                            $fail('Format slot tidak valid.');
                        }
                    } elseif (is_array($value)) {
                        if (!isset($value['start_time'])) {
                            $fail('Format slot tidak valid.');
                        }
                    } else {
                        $fail('Format slot tidak valid.');
                    }
                }
            ],
            'payment_method' => ['required', 'in:cash'],
        ];
    }

    public function messages(): array
    {
        return [
            'booking_date.after_or_equal' => 'Tanggal booking tidak boleh di masa lalu.',
            'date.after_or_equal'         => 'Tanggal booking tidak boleh di masa lalu.',
            'slots.required'              => 'Pilih minimal satu slot.',
            'slots.min'                   => 'Pilih minimal satu slot.',
            'slots.max'                   => 'Maksimal booking 3 jam.',
            'payment_method.required'     => 'Metode pembayaran tidak valid.',
            'payment_method.in'           => 'Metode pembayaran tidak valid.',
        ];
    }
}
