<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $missingNotifiableType = !Schema::hasColumn('notifications', 'notifiable_type');
        $missingNotifiableId = !Schema::hasColumn('notifications', 'notifiable_id');

        if (!$missingNotifiableType && !$missingNotifiableId) {
            return;
        }

        Schema::table('notifications', function (Blueprint $table) {
            if (!Schema::hasColumn('notifications', 'notifiable_type')) {
                $table->string('notifiable_type')->nullable()->after('id');
            }

            if (!Schema::hasColumn('notifications', 'notifiable_id')) {
                $table->unsignedBigInteger('notifiable_id')->nullable()->after('notifiable_type');
            }
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['notifiable_type', 'notifiable_id'], 'notifications_notifiable_type_notifiable_id_index');
        });
    }

    public function down(): void
    {
        // Compatibility migration for databases created before notifications
        // stored notifiable metadata. Keep rollback non-destructive because fresh
        // databases get these columns from the original create migration.
    }
};
