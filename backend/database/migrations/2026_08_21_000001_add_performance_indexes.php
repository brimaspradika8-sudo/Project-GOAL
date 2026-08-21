<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('fields', function (Blueprint $table) {
            $table->index(['owner_id', 'status'], 'fields_owner_status_perf_idx');
            $table->index(['status', 'sport_type'], 'fields_status_sport_perf_idx');
        });

        if (Schema::hasTable('field_schedules')) {
            Schema::table('field_schedules', function (Blueprint $table) {
                $table->index(['field_id', 'day_of_week'], 'schedules_field_day_perf_idx');
            });
        }

        if (Schema::hasTable('notifications')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->index(['notifiable_type', 'notifiable_id'], 'notif_target_perf_idx');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fields', function (Blueprint $table) {
            $table->dropIndex('fields_owner_status_perf_idx');
            $table->dropIndex('fields_status_sport_perf_idx');
        });

        if (Schema::hasTable('field_schedules')) {
            Schema::table('field_schedules', function (Blueprint $table) {
                $table->dropIndex('schedules_field_day_perf_idx');
            });
        }

        if (Schema::hasTable('notifications')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->dropIndex('notif_target_perf_idx');
            });
        }
    }
};
