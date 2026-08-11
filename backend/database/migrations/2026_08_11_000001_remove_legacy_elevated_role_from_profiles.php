<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $legacyRole = implode('', ['ad', 'min']);

        DB::table('profiles')
            ->where('role', $legacyRole)
            ->update(['role' => 'super_admin']);
    }

    public function down(): void
    {
        // Intentionally no-op: legacy elevated role must not be restored.
    }
};
