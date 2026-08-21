<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\FieldValidationSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FieldValidationSettingController extends Controller
{
    /**
     * Get the current field validation rule set.
     * Readable by Owner (needs it to build the Tambah/Edit Lapangan form)
     * and Super Admin (needs it for the settings screen).
     */
    public function show(): JsonResponse
    {
        return $this->successResponse(
            'Pengaturan validasi lapangan berhasil dimuat.',
            FieldValidationSetting::current()
        );
    }

    /**
     * Update the field validation rule set (Super Admin only).
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'max_name_length'        => 'required|integer|min:5|max:255',
            'max_description_length' => 'required|integer|min:10|max:5000',
            'min_price'               => 'required|integer|min:0',
            'max_price'               => 'required|integer|gt:min_price',
            'max_image_mb'            => 'required|integer|min:1|max:20',
        ], [
            'max_name_length.required'        => 'Maksimal karakter nama lapangan wajib diisi.',
            'max_name_length.min'             => 'Maksimal karakter nama lapangan minimal 5.',
            'max_description_length.required' => 'Maksimal karakter deskripsi wajib diisi.',
            'max_description_length.min'      => 'Maksimal karakter deskripsi minimal 10.',
            'min_price.required'              => 'Harga minimum wajib diisi.',
            'max_price.required'              => 'Harga maksimum wajib diisi.',
            'max_price.gt'                    => 'Harga maksimum harus lebih besar dari harga minimum.',
            'max_image_mb.required'           => 'Batas maksimal ukuran foto wajib diisi.',
            'max_image_mb.max'                => 'Batas maksimal ukuran foto tidak boleh lebih dari 20MB.',
        ]);

        $setting = FieldValidationSetting::current();
        $setting->update($validated);

        return $this->successResponse(
            'Aturan validasi lapangan berhasil diperbarui.',
            $setting->fresh()
        );
    }
}
