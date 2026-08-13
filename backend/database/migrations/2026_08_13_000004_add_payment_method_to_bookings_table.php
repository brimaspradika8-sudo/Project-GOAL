<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('bookings', 'payment_method')) {
            Schema::table('bookings', function (Blueprint $table) {
                $table->string('payment_method')->default('cash');
            });
        }

        DB::table('bookings')->whereNull('payment_method')->update(['payment_method' => 'cash']);

        DB::table('bookings')->where('status', 'WAITING_OWNER_APPROVAL')->update(['status' => 'WAITING_CONFIRMATION']);

        DB::table('bookings')->where('status', 'APPROVED')->update(['status' => 'CONFIRMED']);
    }

    public function down(): void
    {
        if (Schema::hasColumn('bookings', 'payment_method')) {
            Schema::table('bookings', function (Blueprint $table) {
                $table->dropColumn('payment_method');
            });
        }
    }
};
