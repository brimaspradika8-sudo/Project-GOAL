<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('booking_slots') && ! Schema::hasIndex('booking_slots', ['booking_id'])) {
            Schema::table('booking_slots', function (Blueprint $table) {
                $table->index('booking_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('booking_slots') && Schema::hasIndex('booking_slots', ['booking_id'])) {
            Schema::table('booking_slots', function (Blueprint $table) {
                $table->dropIndex(['booking_id']);
            });
        }
    }
};
