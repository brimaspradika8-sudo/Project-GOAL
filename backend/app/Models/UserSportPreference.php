<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSportPreference extends Model
{
    protected $table = 'user_sport_preferences';

    protected $fillable = [
        'user_id',
        'sport_type',
    ];

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'user_id', 'user_id');
    }
}
