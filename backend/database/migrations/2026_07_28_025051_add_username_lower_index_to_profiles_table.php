<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE INDEX profiles_username_lower_idx ON profiles (LOWER(username))');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX profiles_username_lower_idx');
    }
};
