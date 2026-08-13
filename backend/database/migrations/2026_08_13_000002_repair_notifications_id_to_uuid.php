<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Repair databases created before notifications.id switched from
     * auto-increment bigint to UUID. Those databases fail every notification
     * write because the app always generates a UUID primary key.
     *
     * Fresh databases already use uuid and are skipped.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            // SQLite (tests) / MySQL fresh schemas are created by the original
            // migration and already accept UUID string keys.
            return;
        }

        $type = DB::selectOne(
            "select data_type as type from information_schema.columns where table_name = 'notifications' and column_name = 'id'"
        )?->type ?? null;

        if (strtolower((string) $type) === 'uuid') {
            return;
        }

        Schema::dropIfExists('notifications');

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('notifiable_type')->nullable();
            $table->unsignedBigInteger('notifiable_id')->nullable();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 50);
            $table->string('title');
            $table->text('body')->nullable();
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'read_at']);
            $table->index(['notifiable_type', 'notifiable_id']);
        });
    }

    public function down(): void
    {
        // Non-destructive: recreating the legacy bigint id is not meaningful
        // for a repair migration and would only re-break notification writes.
    }
};
