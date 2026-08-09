# DOKUMENTASI BACKEND — GOAL

> Laravel 12 (PHP 8.2+) + Sanctum + PostgreSQL
> REST API untuk aplikasi booking lapangan olahraga

---

## 1. TECH STACK

| Package | Versi | Kegunaan |
|---------|-------|----------|
| laravel/framework | 12.x | Framework PHP |
| laravel/sanctum | 4.x | Token-based auth |
| firebase/php-jwt | 7.1 | JWT (password reset) |
| phpunit/phpunit | 11.5 | Testing |
| laravel/pint | 1.x | Code style fixer |

---

## 2. STRUKTUR FOLDER

```
backend/
├── app/
│   ├── Enums/
│   │   └── SportType.php              # Konstanta jenis olahraga
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/
│   │   │   │   ├── AuthController.php         # Register, login, logout
│   │   │   │   └── PasswordResetController.php # Forgot/reset password
│   │   │   ├── Profile/
│   │   │   │   ├── ProfileController.php      # GET/PUT /me
│   │   │   │   └── OnboardingController.php   # Onboarding + username check
│   │   │   ├── Field/
│   │   │   │   └── FieldController.php        # CRUD fields + approval
│   │   │   ├── Owner/
│   │   │   │   ├── OwnerRequestController.php # Submit owner request
│   │   │   │   └── AdminOwnerController.php   # Review owner request
│   │   │   ├── Admin/
│   │   │   │   └── UserController.php         # CRUD users (admin panel)
│   │   │   └── UploadController.php           # Image upload
│   │   ├── Middleware/
│   │   │   ├── RoleMiddleware.php      # Cek role user
│   │   │   └── Authenticate.php        # Auth guard
│   │   └── Requests/
│   │       ├── Auth/
│   │       │   ├── RegisterRequest.php
│   │       │   ├── LoginRequest.php
│   │       │   ├── ForgotPasswordRequest.php
│   │       │   ├── VerifyTokenRequest.php
│   │       │   └── ResetPasswordRequest.php
│   │       ├── Profile/
│   │       │   └── UpdateProfileRequest.php
│   │       └── Owner/
│   │           └── StoreOwnerRequest.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Profile.php
│   │   ├── Field.php
│   │   ├── OwnerRequest.php
│   │   └── UserSportPreference.php
│   ├── Resources/
│   │   ├── ProfileResource.php
│   │   ├── FieldResource.php
│   │   └── OwnerRequestResource.php
│   └── Services/
│       ├── AuthService.php
│       ├── ProfileService.php
│       ├── FieldService.php
│       ├── UserService.php
│       └── OwnerRequestService.php
│
├── config/
│   └── goal.php               # Sport types + price bounds
│
├── database/
│   └── migrations/            # 11 migration files
│
├── routes/
│   └── api.php                # Semua route API
│
├── tests/
│   └── Feature/
│       └── AuthTest.php       # Test autentikasi
│
├── .env                       # Environment config
├── composer.json              # PHP dependencies
└── phpunit.xml                # Test config
```

---

## 3. API REFERENCE

Semua endpoint menggunakan prefix `/api` (didefinisikan di `bootstrap/app.php`).

### 3.1 Autentikasi Publik

#### `POST /auth/register`
Registrasi user baru.

**Request:**
```json
{
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "password": "Password123",
  "password_confirmation": "Password123"
}
```

**Response (201):**
```json
{
  "message": "Registrasi berhasil.",
  "token": "1|abc123...",
  "user": {
    "id": 1,
    "name": "Budi Santoso",
    "email": "budi@example.com"
  }
}
```

**Validasi:**
| Field | Rule | Pesan Error |
|-------|------|-------------|
| name | required, string, max:255 | Nama wajib diisi |
| email | required, email, unique:users | Email sudah terdaftar |
| password | required, min:8, mixedCase, numbers, confirmed | Kata sandi minimal 8 karakter dengan huruf besar dan angka |

---

#### `POST /auth/login`
Login user.

**Request:**
```json
{
  "email": "budi@example.com",
  "password": "Password123"
}
```

**Response (200):**
```json
{
  "message": "Login berhasil.",
  "token": "2|abc123...",
  "user": {
    "id": 1,
    "name": "Budi Santoso",
    "email": "budi@example.com"
  }
}
```

**Error (401):**
```json
{
  "message": "Email atau password salah."
}
```

---

#### `POST /auth/forgot-password`
Kirim email reset password. Hanya mengirim jika email terdaftar; jika tidak, return 422.

**Request:**
```json
{
  "email": "budi@example.com"
}
```

**Response (200):**
```json
{
  "message": "Tautan reset password telah dikirim ke email Anda."
}
```

**Response (422 - email tidak terdaftar):**
```json
{
  "message": "Email tidak terdaftar."
}
```

**Rate limit:** 5/menit

---

#### `POST /auth/verify-token`
Verifikasi token reset password.

**Request:**
```json
{
  "email": "budi@example.com",
  "token": "abc123..."
}
```

**Response (200):**
```json
{ "valid": true }
```

**Error (422):**
```json
{ "valid": false, "message": "Token tidak valid atau sudah kedaluwarsa." }
```

---

#### `POST /auth/reset-password`
Reset password dengan token.

**Request:**
```json
{
  "email": "budi@example.com",
  "token": "abc123...",
  "password": "NewPassword123",
  "password_confirmation": "NewPassword123"
}
```

**Response (200):**
```json
{ "message": "Password berhasil direset. Silakan login." }
```

---

#### `POST /auth/check-email`
Cek apakah email sudah terdaftar.

**Request:**
```json
{ "email": "budi@example.com" }
```

**Response (200):**
```json
{ "exists": true }
```

---

### 3.2 Profil (Authenticated)

> Semua endpoint di bawah memerlukan header `Authorization: Bearer {token}`

#### `GET /me`
Ambil profil user yang sedang login.

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "user_id": 1,
    "full_name": "Budi Santoso",
    "email": "budi@example.com",
    "username": "budi_1",
    "avatar_url": "http://localhost/storage/avatars/1.jpg",
    "sports": ["futsal", "basketball"],
    "region": "Jakarta",
    "onboarding_completed": true,
    "role": "player",
    "is_owner_verified": false,
    "age": 25
  }
}
```

---

#### `PUT /me`
Update profil.

**Request:**
```json
{
  "full_name": "Budi Santoso Baru",
  "region": "Bandung",
  "avatar_url": "http://localhost/storage/avatars/1.jpg",
  "age": 26
}
```

**Validasi `avatar_url`:** Harus diawali dengan `{APP_URL}/storage/` (hanya URL dari storage sendiri).

---

#### `PUT /me/password`
Ganti password.

**Request:**
```json
{
  "current_password": "OldPassword123",
  "password": "NewPassword123",
  "password_confirmation": "NewPassword123"
}
```

**Error (422):**
```json
{ "message": "Password saat ini tidak sesuai." }
```

---

### 3.3 Onboarding

#### `GET /me/onboarding/check-username`
Cek ketersediaan username.

**Request:** `?username=budi_1`

**Response (200):**
```json
{ "available": true }
```

---

#### `POST /me/onboarding`
Selesaikan onboarding.

**Request:**
```json
{
  "username": "budi_1",
  "full_name": "Budi Santoso",
  "region": "Jakarta",
  "avatar_url": "http://localhost/storage/avatars/1.jpg",
  "age": 25,
  "sports": ["futsal", "basketball"]
}
```

---

### 3.4 Upload

#### `POST /upload/image`
Upload gambar (max 5MB).

**Request:** `multipart/form-data` dengan field `image`

**Response (200):**
```json
{
  "url": "http://localhost/storage/uploads/1.jpg"
}
```

---

### 3.5 Owner Request

#### `POST /me/owner-request`
Submit permintaan jadi pemilik lapangan.

**Rate limit:** 5/menit

**Request:**
```json
{
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "business_name": "Budi Futsal Arena",
  "address": "Jl. Sudirman No. 123, Jakarta",
  "phone": "08123456789"
}
```

**Response (201):**
```json
{
  "data": {
    "id": 1,
    "status": "pending",
    "business_name": "Budi Futsal Arena",
    ...
  }
}
```

**Error (422):**
- "Anda sudah memiliki peran yang memadai."
- "Anda sudah terverifikasi sebagai pemilik."
- "Anda sudah memiliki pengajuan yang sedang diproses."

---

#### `GET /me/owner-request`
Cek status permintaan owner.

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "status": "pending",
    "business_name": "Budi Futsal Arena",
    ...
  }
}
// atau null jika belum pernah submit
```

---

### 3.6 Lapangan

#### `GET /fields`
Daftar lapangan yang sudah di-approve (publik).

**Query params:**
| Param | Tipe | Keterangan |
|-------|------|------------|
| page | int | Nomor halaman |
| sport | string | Filter jenis olahraga |
| search | string | Filter nama/lokasi |

**Response (200):**
```json
{
  "data": [...],
  "current_page": 1,
  "last_page": 5,
  "per_page": 20,
  "total": 100
}
```

---

#### `GET /fields/{id}`
Detail satu lapangan (publik).

---

#### `GET /fields/my/list`
Daftar lapangan milik owner yang sedang login.

---

#### `POST /fields`
Buat lapangan baru. **Role:** owner, admin, super_admin

**Request:**
```json
{
  "name": "Futsal Arena Gemilang",
  "sport_type": "futsal",
  "location": "Jakarta Selatan",
  "description": "Lapangan futsal dengan rumput sintetis terbaik",
  "price_per_hour": 150000,
  "image_url": "http://localhost/storage/uploads/field1.jpg"
}
```

**Response (201):** Field object dengan `status: "pending"`

---

#### `PUT /fields/{id}`
Update lapangan. **Role:** owner (lapangan sendiri), admin, super_admin

**Catatan:** Update oleh owner akan mereset status ke `"pending"` (perlu review ulang).

---

#### `DELETE /fields/{id}`
Hapus lapangan (soft delete). **Role:** owner (lapangan sendiri), admin, super_admin

---

### 3.7 Field Approval (Super Admin Only)

#### `GET /fields/pending/list`
Daftar lapangan yang menunggu approval.

#### `GET /fields/trashed/list`
Daftar lapangan yang sudah di-soft-delete.

#### `POST /fields/{id}/approve`
Approve atau reject lapangan.

**Request:**
```json
{
  "status": "approved",
  "rejection_reason": null
}
// atau
{
  "status": "rejected",
  "rejection_reason": "Gambar tidak sesuai"
}
```

#### `POST /fields/{id}/restore`
Restore lapangan dari trash.

#### `DELETE /fields/{id}/force`
Force delete (permanen).

---

### 3.8 Admin — Owner Requests

#### `GET /owner-requests/pending`
Daftar request owner yang pending. **Role:** admin, super_admin

#### `POST /owner-requests/{id}/review`
Approve atau reject request owner.

**Request:**
```json
{
  "status": "approved"
}
// atau
{
  "status": "rejected",
  "rejection_reason": "Dokumen tidak lengkap"
}
```

**Effect saat approve:**
- Role user berubah ke `'owner'`
- `is_owner_verified` = true

---

### 3.9 Admin — User Management

#### `GET /admin/users`
Daftar semua user (paginated, 20/halaman). **Role:** admin, super_admin

**Query params:**
| Param | Tipe | Keterangan |
|-------|------|------------|
| search | string | Filter nama/email |
| role | string | Filter role |

---

#### `POST /admin/users`
Buat user baru. **Role:** admin, super_admin

**Request:**
```json
{
  "name": "User Baru",
  "email": "baru@example.com",
  "password": "Password123",
  "role": "player"
}
```

**Catatan:**
- Hanya super_admin yang bisa buat akun admin/super_admin
- Default role: `'player'` (jika tidak diisi)

---

#### `PUT /admin/users/{id}`
Update user. **Role:** admin, super_admin

---

#### `PUT /admin/users/{id}/role`
Ganti role user. **Role:** admin, super_admin

**Request:**
```json
{ "role": "owner" }
```

**Catatan:** Hanya super_admin yang bisa mengelola role super_admin.

---

#### `DELETE /admin/users/{id}`
Hapus user. **Role:** admin, super_admin

**Catatan:**
- Tidak bisa hapus akun sendiri
- Hanya super_admin yang bisa hapus super_admin

---

## 4. MIDDLEWARE

### 4.1 RoleMiddleware

```
role:player          → hanya player
role:owner,admin     → owner ATAU admin
role:admin,super_admin → admin ATAU super_admin
role:super_admin     → hanya super_admin
```

**Cara kerja:**
1. Cek user terauthentikasi → 401 jika tidak
2. Ambil `$user->profile->role`
3. Cek apakah role ada di daftar yang diizinkan → 403 jika tidak

### 4.2 Rate Limiting

| Middleware | Limit | Keterangan |
|-----------|-------|------------|
| `throttle:10,1` | 10/menit | Auth publik (register, login) |
| `throttle:5,1` | 5/menit | Forgot password, owner request |
| `throttle:60,1` | 60/menit | Semua protected routes |

---

## 5. SERVICE LAYER

### 5.1 AuthService

```
register(data) → ['token', 'user']
login(email, password) → ['token', 'user']
logout(user) → void
checkEmail(email) → bool
```

### 5.2 ProfileService

```
getPayload(user) → profile + sport preferences
validateUsername(username, userId?) → bool
submitOnboarding(user, data) → profile (transaction)
```

### 5.3 FieldService

```
listApproved(sport?, search?, page) → paginated fields
listByOwner(user) → owner's fields
listPending() → paginated pending fields
listTrashed() → paginated trashed fields
getField(id) → field
createField(user, data) → field
updateField(field, data, user) → field (resets status if owner)
deleteField(field, user) → void
approveField(field, status, reason, admin) → void
restoreField(field) → void
forceDeleteField(field) → void
invalidateCache() → void
```

**Cache Strategy:**
- Key pattern: `fields:approved_all`, `fields:approved_{sport}`
- TTL: 300 detik
- Invalidated saat create/update/delete/approve

### 5.4 UserService

```
listUsers(search?, role) → paginated users
createUser(data) → user + profile
updateUser(user, data) → user
updateRole(user, role, currentUser) → void
deleteUser(user, currentUser) → void
```

**Proteksi:**
- `updateRole`: Hanya super_admin yang bisa set/ubah super_admin
- `deleteUser`: Tidak bisa hapus diri sendiri, hanya super_admin yang bisa hapus super_admin

### 5.5 OwnerRequestService

```
submit(user, data) → ownerRequest
getPendingRequest(user) → ownerRequest|null
review(ownerRequest, status, reason, reviewer) → void
listByUser(user) → ownerRequest|null
```

---

## 6. DATABASE

### 6.1 ERD

```
users ──1:1──▶ profiles
  │               │
  │               └──< user_sport_preferences
  │
  ├──< owner_requests
  │       └── reviewed_by ──▶ users
  │
  └──< fields (owner_id)
          └── approved_by ──▶ users
```

### 6.2 Tabel

| Tabel | Keterangan |
|-------|------------|
| `users` | User utama (name, email, password) |
| `profiles` | Profil user (role, avatar, onboarding status) |
| `user_sport_preferences` | Preferensi olahraga user |
| `fields` | Data lapangan (nama, jenis, harga, status) |
| `owner_requests` | Permintaan upgrade ke owner |
| `personal_access_tokens` | Sanctum tokens |
| `password_reset_tokens` | Token reset password |
| `sessions` | Session data |
| `cache` | Cache data |
| `jobs` | Queue jobs |

### 6.3 Enum Values

**Field status:** `pending`, `approved`, `rejected`
**Owner request status:** `pending`, `approved`, `rejected`
**User role:** `player`, `owner`, `admin`, `super_admin`
**Sport types:** futsal, badminton, basketball, basket, mini_soccer, tennis, tenis, volleyball, voli, other, lainnya + title case variants

---


```


`