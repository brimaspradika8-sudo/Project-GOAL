<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private array $mapping = [
        'Futsal' => 'futsal',
        'FUTSAL' => 'futsal',
        'Basket' => 'basketball',
        'BASKET' => 'basketball',
        'basket' => 'basketball',
        'Badminton' => 'badminton',
        'BADMINTON' => 'badminton',
        'Voli' => 'volleyball',
        'VOLI' => 'volleyball',
        'voli' => 'volleyball',
        'Volleyball' => 'volleyball',
        'VOLLEYBALL' => 'volleyball',
        'Tenis' => 'tennis',
        'TENIS' => 'tennis',
        'tenis' => 'tennis',
        'Tennis' => 'tennis',
        'TENNIS' => 'tennis',
        'Mini Soccer' => 'mini_soccer',
        'MINI SOCCER' => 'mini_soccer',
        'mini_soccer' => 'mini_soccer',
        'Lainnya' => 'other',
        'LAINNYA' => 'other',
        'lainnya' => 'other',
        'Other' => 'other',
        'OTHER' => 'other',
    ];

    private array $valid = [
        'futsal', 'badminton', 'basketball', 'mini_soccer',
        'tennis', 'volleyball', 'padel', 'other',
    ];

    public function up(): void
    {
        $fields = DB::table('fields')->get(['id', 'sport_type']);

        foreach ($fields as $field) {
            $current = $field->sport_type;

            if (in_array($current, $this->valid, true)) {
                continue;
            }

            $normalized = $this->mapping[$current] ?? null;

            if ($normalized) {
                DB::table('fields')->where('id', $field->id)->update(['sport_type' => $normalized]);
            } else {
                DB::table('fields')->where('id', $field->id)->update(['sport_type' => 'other']);
            }
        }
    }

    public function down(): void
    {
        // no-op: data normalization cannot be reliably reversed
    }
};
