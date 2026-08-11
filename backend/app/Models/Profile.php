<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Profile extends Model
{
    const ROLE_PLAYER      = UserRole::PLAYER->value;
    const ROLE_OWNER       = UserRole::OWNER->value;
    const ROLE_SUPER_ADMIN = UserRole::SUPER_ADMIN->value;

    protected $table = 'profiles';

    protected $fillable = [
        'user_id',
        'username',
        'email',
        'full_name',
        'region',
        'avatar_url',
        'age',
        'role',
        'is_owner_verified',
        'onboarding_completed',
    ];

    protected $casts = [
        'is_owner_verified' => 'boolean',
        'onboarding_completed' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sportPreferences(): HasMany
    {
        return $this->hasMany(UserSportPreference::class, 'user_id', 'user_id');
    }
}
