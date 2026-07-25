# DOKUMENTASI APLIKASI GOAL

> **Game Organizer & Arena League** — Platform booking lapangan olahraga
> Versi: 1.0.0 | Terakhir diperbarui: Juli 2026

---

## 1. RINGKASAN PROYEK

GOAL adalah aplikasi multi-platform untuk booking lapangan olahraga. Pengguna bisa mencari venue, melakukan booking, dan pemilik lapangan bisa mengelola lapangan mereka. Ada 4 level peran: Player, Owner, Admin, Super Admin.

### Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React Native (Expo SDK 54) + expo-router 6 |
| Backend | Laravel 12 (PHP 8.2+) + Sanctum |
| Database | PostgreSQL |
| State | Zustand (frontend), Cache facade (backend) |
| Auth | Laravel Sanctum (token-based) |

### Arsitektur

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  React Native (Expo) — Web, iOS, Android         │
│  ┌─────────┐  ┌──────────┐  ┌───────────────┐   │
│  │ (tabs)  │  │ (admin)  │  │    (owner)    │   │
│  │ Beranda │  │ Users    │  │ Fields        │   │
│  │ Booking │  │ Requests │  │ Bookings      │   │
│  │ Match   │  │ Fields   │  │ Revenue       │   │
│  │ Profile │  │ Profile  │  │ Profile       │   │
│  └─────────┘  └──────────┘  └───────────────┘   │
│         │             │              │            │
│         └─────────────┼──────────────┘            │
│                       │                           │
│              lib/api.ts (Base URL)                │
└───────────────────────┼──────────────────────────┘
                        │ HTTP/JSON (Sanctum Bearer)
┌───────────────────────┼──────────────────────────┐
│                   BACKEND                        │
│  Laravel 12 + Sanctum                            │
│  ┌──────────┐  ┌────────────┐  ┌─────────────┐  │
│  │  Auth    │  │  Profile   │  │   Field     │  │
│  │ Service  │  │  Service   │  │   Service   │  │
│  └──────────┘  └────────────┘  └─────────────┘  │
│       │              │               │            │
│  ┌──────────────────────────────────────────┐    │
│  │            PostgreSQL Database            │    │
│  │  users | profiles | fields | owner_requests│  │
│  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

---

## 2. STRUKTUR FOLDER

```
C:\GOAL\
├── frontend/                 # Aplikasi React Native (Expo)
│   ├── app/                  # File-based routing (expo-router)
│   ├── components/           # Komponen UI reusable
│   ├── store/                # Zustand state management
│   ├── lib/                  # Utilitas (api, auth, theme)
│   ├── hooks/                # Custom React hooks
│   ├── data/                 # Data statik (venues, categories)
│   └── assets/               # Gambar, font
│
├── backend/                  # API Laravel
│   ├── app/Http/Controllers/ # Controller per domain
│   ├── app/Services/         # Business logic layer
│   ├── app/Models/           # Eloquent models
│   ├── app/Enums/            # Constants (SportType)
│   ├── routes/api.php        # Semua route API
│   ├── database/migrations/  # Schema database
│   └── config/goal.php       # Konfigurasi sport types & harga
│
└── DOKUMENTASI.md            # Dokumentasi ini
```

---

## 3. FLOW APLIKASI

### 3.1 Autentikasi

```
User buka aplikasi
    │
    ▼
Cek token di AsyncStorage
    │
    ├── Token ada → GET /me
    │       │
    │       ├── onboarding_completed = false → /onboarding
    │       ├── role = admin/super_admin → /admin/dashboard
    │       └── role = player/owner → /(tabs)/beranda
    │
    └── Token tidak ada → /login
            │
            ├── Belum punya akun → /register → /onboarding
            └── Lupa password → /forgot-password → /reset-password
```

### 3.2 Onboarding (2 Langkah)

```
Langkah 1: Profil
    - Upload avatar
    - Pilih username (cek ketersediaan real-time)
    - Pilih provinsi/kota
    - Setujui syarat & ketentuan

Langkah 2: Preferensi Olahraga
    - Pilih minimal 1 dari 8 olahraga
    - POST /me/onboarding → redirect ke /(tabs)/beranda
```

### 3.3 Owner Upgrade

```
Player klik "Ajukan Jadi Pemilik" di Profile
    │
    ▼
Isi form: nama bisnis, alamat, telepon
    │
    ▼
POST /me/owner-request → status: pending
    │
    ▼
Admin/Super Admin review di /admin/owner-requests
    │
    ├── Approve → role: 'owner', is_owner_verified: true
    └── Reject → status: 'rejected', alasan ditolak
```

### 3.4 Field Approval

```
Owner buat lapangan → POST /fields → status: 'pending'
    │
    ▼
Super Admin review di /admin/pending-fields
    │
    ├── Approve → status: 'approved', field muncul di pencarian
    └── Reject → status: 'rejected', alasan ditolak

Owner edit field → status reset ke 'pending' → perlu review ulang
```

---

## 4. Matriks Izin Peran

| Fitur                    | Player | Owner | Super Admin |
|-------|--------|---------|--------|-------|-------------|
| Cari & lihat lapangan    |   ✅   |  ✅  |      ✅     |
| Booking lapangan         |   ✅   |  ✅  |      ✅     |
| Buat lapangan sendiri    |   ❌   |  ✅  |      ✅     |
| Edit lapangan sendiri    |   ❌   |  ✅  |      ✅     |
| Hapus lapangan sendiri   |   ❌   |  ✅  |      ✅     |
| Lihat daftar lapangan    |   ❌   |  ✅  |      ✅     |
| Approve/reject lapangan  |   ❌   |  ❌  |      ✅     |
| Kelola user              |   ❌   |  ❌  |      ✅     |
| Buat akun admin          |   ❌   |  ❌  |      ✅     |
| Review request owner     |   ❌   |  ❌  |      ✅     |
| Hapus akun super_admin   |   ❌   |  ❌  |      ✅     |
| Trash/restore field      |   ❌   |  ❌  |      ✅     |

---

## 5. DATABASE

### ERD (Entity Relationship)

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

### Tabel Utama

#### `users`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint PK | Auto-increment |
| name | string | Nama tampilan |
| email | string, unique | Email login |
| email_verified_at | timestamp, nullable | Waktu verifikasi email |
| password | string | Hashed |
| remember_token | string | |
| timestamps | | created_at, updated_at |

#### `profiles`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id    | bigint PK |       |
| user_id | FK→users, unique | Cascade on delete |
| username | string(20), unique, nullable | Username unik |
| full_name | string, nullable | Nama lengkap |
| email | string, nullable | |
| region | string(100), nullable | Provinsi/kota |
| avatar_url | string(2048), nullable | URL avatar dari /upload/image |
| age | integer, nullable | Usia |
| role | string(20), default 'player' | player/owner/admin/super_admin |
| is_owner_verified | boolean, default false | Status verifikasi owner |
| onboarding_completed | boolean, default false | Status onboarding |
| timestamps | | |

#### `user_sport_preferences`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint PK | |
| user_id | FK→users | Cascade on delete |
| sport_type | string(100) | Jenis olahraga |
| timestamps | | |

#### `fields`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint PK | |
| owner_id | FK→users | Cascade on delete |
| name | string | Nama lapangan |
| sport_type | string(50) | Jenis olahraga |
| location | string, nullable | Lokasi |
| description | text, nullable | Deskripsi |
| price_per_hour | integer, nullable | Harga per jam (Rupiah) |
| image_url | string(2048), nullable | URL gambar |
| status | enum | pending/approved/rejected |
| approved_by | FK→users, nullable | Null on delete |
| approved_at | timestamp, nullable | |
| rejection_reason | text, nullable | Alasan penolakan |
| deleted_at | timestamp, nullable | Soft delete |
| timestamps | | |

#### `owner_requests`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint PK | |
| user_id | FK→users | Cascade on delete |
| name | string | Nama pemohon |
| email | string | |
| business_name | string | Nama bisnis |
| address | text | Alamat |
| phone | string(20) | Telepon |
| status | enum | pending/approved/rejected |
| rejection_reason | text, nullable | |
| reviewed_by | FK→users, nullable | Null on delete |
| reviewed_at | timestamp, nullable | |
| deleted_at | timestamp, nullable | Soft delete |
| timestamps | |

---

## 6. ENVIRONMENT

### Frontend (`.env`)
```
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

### Backend (`.env`)
```
APP_URL=http://localhost
DB_CONNECTION=pgsql
DB_HOST=your-db-host
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

---

## 7. SETUP & JALANKAN

### Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan storage:link
php artisan serve
```

### Frontend
```bash
cd frontend
npm install
npx expo start          # Development
npx expo start --web    # Web only
npx expo start --web -c # Clear cache
```

### Testing
```bash
cd backend
php artisan test                    # Semua test
php artisan test --filter=AuthTest  # Auth test saja
```

---

## 8. RATE LIMITING

| Endpoint | Limit | Keterangan |
|----------|-------|------------|
| `POST /auth/*` | 10/menit | Register, login, verifikasi token |
| `POST /auth/forgot-password` | 5/menit | Reset password email |
| `POST /me/owner-request` | 5/menit | Submit request owner |
| Semua protected routes | 60/menit | General API limit |

---

## 9. KONFIGURASI

### `config/goal.php`
```php
return [
    'sport_types' => [
        'futsal', 'badminton', 'basketball', 'basket',
        'mini_soccer', 'tennis', 'tenis', 'volleyball',
        'voli', 'other', 'lainnya',
        'Futsal', 'Badminton', 'Basket', 'Mini Soccer',
        'Tenis', 'Voli', 'Lainnya',
    ],
    'price_min' => 5000,        // Rupiah
    'price_max' => 50000000,    // Rupiah
];
```
