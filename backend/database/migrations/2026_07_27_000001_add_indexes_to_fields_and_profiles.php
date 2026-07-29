<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {   
        Schema::table('fields', function (Blueprint $table) {
            $table->index('sport_type');
          
        });

        Schema::table('profiles', function (Blueprint $table) {
            $table->index('role');
        });
    }

    public function down(): void
    {
        Schema::table('fields', function (Blueprint $table) {
            $table->dropIndex(['sport_type']);
            $table->dropIndex(['status']);
        });

        Schema::table('profiles', function (Blueprint $table) {
            $table->dropIndex(['role']);
        });
    }
};
