<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('DROP TABLE IF EXISTS user_sport_preferences CASCADE');
        DB::statement('DROP TABLE IF EXISTS profiles CASCADE');

        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('username', 20)->unique()->nullable();
            $table->string('email')->nullable();
            $table->string('full_name')->nullable();
            $table->string('region', 100)->nullable();
            $table->string('avatar_url', 2048)->nullable();
            $table->integer('age')->nullable();
            $table->boolean('onboarding_completed')->default(false);
            $table->string('role', 20)->default('player');
            $table->boolean('is_owner_verified')->default(false);
            $table->timestamps();
        });

        Schema::create('user_sport_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('sport_type', 100);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_sport_preferences');
        Schema::dropIfExists('profiles');
    }
};
