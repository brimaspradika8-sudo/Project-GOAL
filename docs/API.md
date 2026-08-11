# GOAL API

Base path: `/api`

All protected endpoints require `Authorization: Bearer <token>`.

## Response Format

Success:

```json
{
  "message": "Deskripsi berhasil",
  "data": {}
}
```

Error:

```json
{
  "message": "Deskripsi error",
  "errors": {}
}
```

## Authentication

| Method | Endpoint | Auth | Authorization |
| --- | --- | --- | --- |
| POST | `/auth/register` | No | Public |
| POST | `/auth/login` | No | Public |
| POST | `/auth/forgot-password` | No | Public |
| POST | `/auth/verify-token` | No | Public |
| POST | `/auth/reset-password` | No | Public |
| POST | `/auth/logout` | Yes | player, owner, super_admin |

## Profile

| Method | Endpoint | Auth | Authorization |
| --- | --- | --- | --- |
| GET | `/me` | Yes | Authenticated user |
| PUT | `/me` | Yes | Own profile only |
| PUT | `/me/password` | Yes | Own password only |
| POST | `/me/avatar` | Yes | Own avatar only |
| POST | `/me/onboarding` | Yes | Own profile only |
| GET | `/me/onboarding/check-username` | No | Public availability check |

Avatar upload accepts only `jpg`, `jpeg`, `png`, and `webp`, with backend MIME and size validation.

## Fields

| Method | Endpoint | Auth | Authorization |
| --- | --- | --- | --- |
| GET | `/fields` | No | Public, approved fields only |
| GET | `/fields/{id}` | No | Public, approved fields only |
| GET | `/fields/my/list` | Yes | Authenticated user own list |
| POST | `/fields` | Yes | owner, super_admin |
| PUT | `/fields/{id}` | Yes | owner of field, super_admin |
| DELETE | `/fields/{id}` | Yes | owner of field, super_admin |
| GET | `/fields/pending/list` | Yes | super_admin |
| GET | `/fields/trashed/list` | Yes | super_admin |
| POST | `/fields/{id}/approve` | Yes | super_admin |
| POST | `/fields/{id}/restore` | Yes | super_admin |
| DELETE | `/fields/{id}/force` | Yes | super_admin |

Owner-created fields default to `pending`. Super admin-created fields are approved immediately.

## Owner Requests

| Method | Endpoint | Auth | Authorization |
| --- | --- | --- | --- |
| POST | `/me/owner-request` | Yes | player |
| GET | `/me/owner-request` | Yes | Own request status |
| GET | `/owner-requests/pending` | Yes | super_admin |
| POST | `/owner-requests/{id}/review` | Yes | super_admin |

## User Management

| Method | Endpoint | Auth | Authorization |
| --- | --- | --- | --- |
| GET | `/super-admin/users` | Yes | super_admin |
| POST | `/super-admin/users` | Yes | super_admin |
| PUT | `/super-admin/users/{id}` | Yes | super_admin |
| PUT | `/super-admin/users/{id}/role` | Yes | super_admin |
| DELETE | `/super-admin/users/{id}` | Yes | super_admin |
| POST | `/super-admin/users/bulk-delete` | Yes | super_admin |
| GET | `/super-admin/audit-logs` | Yes | super_admin |

Valid roles are `player`, `owner`, and `super_admin`.

## Notifications

| Method | Endpoint | Auth | Authorization |
| --- | --- | --- | --- |
| GET | `/notifications` | Yes | Own notifications |
| GET | `/notifications/unread-count` | Yes | Own notifications |
| POST | `/notifications/{id}/read` | Yes | Own notifications |
| POST | `/notifications/read-all` | Yes | Own notifications |
| POST | `/notifications/clear-all` | Yes | Own notifications |
