<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Profile extends Model
{
    const ROLE_PLAYER      = 'player';
    const ROLE_OWNER       = 'owner';
    const ROLE_ADMIN       = 'admin';
    const ROLE_SUPER_ADMIN = 'super_admin';

    protected $table = 'profiles';

    protected $fillable = [
        'user_id',
        'username',
        'email',
        'full_name',
        'region',
        'avatar_url',
        'role',
        'age',
        'is_owner_verified',
        'onboarding_completed',
    ];

    protected $casts = [
        'is_owner_verified' => 'boolean',
        'onboarding_completed' => 'boolean',
    ];

    public function hasRole(string ...$roles): bool
    {
        return in_array($this->role, $roles);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sportPreferences(): HasMany
    {
        return $this->hasMany(UserSportPreference::class, 'user_id', 'user_id');
    }
}
