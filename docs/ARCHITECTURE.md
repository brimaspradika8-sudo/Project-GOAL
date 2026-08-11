# GOAL Architecture

G.O.A.L is split into a Laravel backend and an Expo React Native frontend.

## Backend

- Laravel 12, PHP 8.2, PostgreSQL, Sanctum token authentication.
- Main domains: auth, profiles, owner requests, fields, notifications, and super admin user management.
- Role source of truth: `App\Enums\UserRole` with `player`, `owner`, and `super_admin`.
- Route authorization is enforced through Sanctum plus `role` middleware.
- Field ownership is enforced in `FieldController` and `FieldService`: owners can only update/delete their own fields, while `super_admin` can approve and manage fields.
- API responses use the controller helpers `successResponse`, `errorResponse`, and `resourceResponse`.
- API exceptions are rendered through Laravel's global exception handler and hide database details from users.

## Frontend

- React Native Expo, TypeScript, Expo Router, Zustand.
- Session token helpers live in `frontend/lib/auth.ts` and `frontend/lib/secureStorage.ts`.
- Profile and role state live in `frontend/store/profileStore.ts`.
- Role constants and route mapping live in `frontend/types/roles.ts`.
- Route groups:
  - `frontend/app/(tabs)` for player-facing screens.
  - `frontend/app/(owner)` for owner screens.
  - `frontend/app/(super-admin)` for super admin screens.
- Logout clears local token/session state before returning to auth screens.

## Database Relationships

- `users` has one `profiles`.
- `users` has many `fields` through `fields.owner_id`.
- `users` has many `owner_requests`.
- `users` has many `notifications`.
- `fields.approved_by` references the approving user and is nullable with null-on-delete behavior.
- `super_admin_audit_logs.actor_id` references the acting user and is nullable with null-on-delete behavior.

## Indexes And Preparation

- `fields.owner_id` is indexed for owner dashboards.
- `fields.status` is indexed for approval queues.
- `owner_requests.status` and `owner_requests.user_id/status` are indexed for review and user status checks.
- Booking tables are not implemented yet; when added, prioritize indexes on `field_id`, `booking_date`, and `status`.
