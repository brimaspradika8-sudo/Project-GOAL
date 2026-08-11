<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fields', function (Blueprint $table) {
            $table->time('open_time')->nullable()->after('price_per_hour');
            $table->time('close_time')->nullable()->after('open_time');
            $table->unsignedSmallInteger('session_duration_minutes')->default(60)->after('close_time');
            $table->unsignedSmallInteger('buffer_duration_minutes')->default(0)->after('session_duration_minutes');
        });
    }

    public function down(): void
    {
        Schema::table('fields', function (Blueprint $table) {
            $table->dropColumn([
                'open_time',
                'close_time',
                'session_duration_minutes',
                'buffer_duration_minutes',
            ]);
        });
    }
};
