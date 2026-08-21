<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('field_validation_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('max_name_length')->default(50);
            $table->unsignedInteger('max_description_length')->default(1000);
            $table->unsignedInteger('min_price')->default(10000);
            $table->unsignedInteger('max_price')->default(5000000);
            $table->unsignedTinyInteger('max_image_mb')->default(2);
            $table->timestamps();
        });

        // Seed the single settings row (id = 1). The table is a singleton:
        // there is only ever one active rule set for field validation.
        DB::table('field_validation_settings')->insert([
            'id'                      => 1,
            'max_name_length'         => 50,
            'max_description_length'  => 1000,
            'min_price'               => 10000,
            'max_price'               => 5000000,
            'max_image_mb'            => 2,
            'created_at'              => now(),
            'updated_at'              => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('field_validation_settings');
    }
};
