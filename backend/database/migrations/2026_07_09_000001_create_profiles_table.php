<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();   // matches Supabase auth.users.id
            $table->string('username', 20)->unique()->nullable();
            $table->boolean('onboarding_completed')->default(false);
            $table->string('role', 20)->default('player');    // player | owner
            $table->boolean('is_owner_verified')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
