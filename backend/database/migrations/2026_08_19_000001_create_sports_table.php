<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sports', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 50)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Seed default sports
        $now = now();
        $defaultSports = [
            ['slug' => 'futsal', 'name' => 'Futsal', 'description' => 'Olahraga futsal indoor/outdoor', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['slug' => 'badminton', 'name' => 'Badminton', 'description' => 'Olahraga bulutangkis indoor', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['slug' => 'basketball', 'name' => 'Basket', 'description' => 'Olahraga bola basket', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['slug' => 'mini_soccer', 'name' => 'Mini Soccer', 'description' => 'Olahraga mini soccer / sepakbola mini', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['slug' => 'tennis', 'name' => 'Tenis', 'description' => 'Olahraga tenis lapangan', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['slug' => 'volleyball', 'name' => 'Voli', 'description' => 'Olahraga bola voli', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['slug' => 'padel', 'name' => 'Padel', 'description' => 'Olahraga padel tenis', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['slug' => 'other', 'name' => 'Lainnya', 'description' => 'Jenis olahraga lainnya', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ];

        DB::table('sports')->insert($defaultSports);
    }

    public function down(): void
    {
        Schema::dropIfExists('sports');
    }
};
