<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sprint 5 — Production Readiness
 * Tambahkan index yang diperlukan untuk optimasi query di production:
 * 1. notifications(notifiable_id, read_at)  — query unread notifications
 * 2. bookings(booking_date)                  — single-column date filter
 * 3. fields(owner_id, status)                — composite untuk owner field list
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── notifications ──────────────────────────────────────────────────
        // Query: WHERE notifiable_id = ? AND read_at IS NULL (unread count)
        if (Schema::hasTable('notifications') && ! Schema::hasIndex('notifications', 'notifications_notifiable_id_read_at_index')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->index(['notifiable_id', 'read_at'], 'notifications_notifiable_id_read_at_index');
            });
        }

        // ── bookings ───────────────────────────────────────────────────────
        // Single-column index untuk filter booking_date (tanpa field_id / status)
        if (Schema::hasTable('bookings') && ! Schema::hasIndex('bookings', 'bookings_booking_date_index')) {
            Schema::table('bookings', function (Blueprint $table) {
                $table->index('booking_date', 'bookings_booking_date_index');
            });
        }

        // ── fields ─────────────────────────────────────────────────────────
        // Composite (owner_id, status) untuk owner melihat daftar lapangan per status
        if (Schema::hasTable('fields') && ! Schema::hasIndex('fields', 'fields_owner_id_status_index')) {
            Schema::table('fields', function (Blueprint $table) {
                $table->index(['owner_id', 'status'], 'fields_owner_id_status_index');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('notifications')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->dropIndexIfExists('notifications_notifiable_id_read_at_index');
            });
        }

        if (Schema::hasTable('bookings')) {
            Schema::table('bookings', function (Blueprint $table) {
                $table->dropIndexIfExists('bookings_booking_date_index');
            });
        }

        if (Schema::hasTable('fields')) {
            Schema::table('fields', function (Blueprint $table) {
                $table->dropIndexIfExists('fields_owner_id_status_index');
            });
        }
    }
};
