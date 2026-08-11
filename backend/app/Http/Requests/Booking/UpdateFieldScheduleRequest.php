<?php

namespace App\Http\Requests\Booking;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFieldScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'open_time' => ['required', 'date_format:H:i', 'before:close_time'],
            'close_time' => ['required', 'date_format:H:i', 'after:open_time'],
            'session_duration_minutes' => ['required', 'integer', 'min:1', 'in:30,60,90,120'],
            'buffer_duration_minutes' => ['required', 'integer', 'min:0', 'in:0,15,30,45'],
        ];
    }
}
