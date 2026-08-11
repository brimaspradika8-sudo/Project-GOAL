export type UserRole = 'player' | 'owner' | 'super_admin';

export const USER_ROLES: Record<string, UserRole> = {
  PLAYER: 'player',
  OWNER: 'owner',
  SUPER_ADMIN: 'super_admin',
};

export function isUserRole(value: unknown): value is UserRole {
  return value === USER_ROLES.PLAYER || value === USER_ROLES.OWNER || value === USER_ROLES.SUPER_ADMIN;
}

export function routeForRole(role: UserRole): '/(tabs)' | '/(owner)' | '/(super-admin)/dashboard' {
  if (role === USER_ROLES.SUPER_ADMIN) return '/(super-admin)/dashboard';
  if (role === USER_ROLES.OWNER) return '/(owner)';
  return '/(tabs)';
}

export function profileFromApi<T>(payload: T | { data?: T }): T {
  if (payload && typeof payload === 'object' && 'data' in payload && (payload as { data?: T }).data) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}
