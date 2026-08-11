<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('profiles')
            ->where('role', 'admin')
            ->update(['role' => 'super_admin']);
    }

    public function down(): void
    {
        // Intentionally no-op: legacy "admin" role must not be restored.
    }
};
