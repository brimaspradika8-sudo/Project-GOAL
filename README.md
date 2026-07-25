# GOAL — Game Organizer & Arena League

Platform booking lapangan olahraga dan komunitas sparring. Cari venue, booking lapangan, buat match sparring, atau kelola lapanganmu sendiri.

**Stack:** React Native (Expo SDK 54) · Laravel 12 · PostgreSQL · Sanctum

---

## Fitur Utama

- **Cari & Booking Lapangan** — Filter berdasarkan kota, jenis olahraga, fasilitas. Booking dengan pemilihan tanggal, jam, metode pembayaran, dan QR code e-tiket.
- **Komunitas & Sparring** — Buat jadwal sparring tim atau main bareng. Gabung match yang sudah ada, lihat level dan biaya patungan.
- **Manajemen Lapangan (Owner)** — Buat, edit, dan hapus lapangan. Status review oleh super admin sebelum tayang.
- **Admin Panel (Super Admin)** — Kelola semua user, review pengajuan owner, approve/reject lapangan.
- **Dark Mode** — Toggle tema terang/gelap di seluruh aplikasi.
- **Onboarding** — Pilih username, avatar, kota, dan preferensi olahraga saat pertama kali daftar.

---

## Struktur Proyek

```
GOAL/
├── frontend/                  # React Native (Expo)
│   ├── app/                   # File-based routing (expo-router)
│   │   ├── (tabs)/            # Tab utama: Beranda, Eksplor, Match, Pesanan, Profil
│   │   ├── (admin)/           # Admin panel: Users, Owner Requests, Pending Fields
│   │   ├── (owner)/           # Owner: Fields, Bookings, Revenue
│   │   ├── login/             # Autentikasi
│   │   ├── register/
│   │   ├── onboarding/        # Onboarding 2 langkah
│   │   └── _layout.tsx        # Root layout & auth routing
│   ├── components/            # Komponen UI reusable
│   ├── store/                 # Zustand state management
│   ├── lib/                   # Utilitas (api, auth, theme)
│   └── assets/                # Gambar, font
│
├── backend/                   # Laravel 12 API
│   ├── app/
│   │   ├── Http/Controllers/  # Controller per domain (Auth, Profile, Field, Admin, Owner)
│   │   ├── Http/Requests/     # Form request validation
│   │   ├── Services/          # Business logic (Auth, User, Profile, Field, OwnerRequest)
│   │   ├── Models/            # Eloquent models (User, Profile, Field, OwnerRequest)
│   │   ├── Enums/             # SportType enum
│   │   └── Resources/         # API resource transformers
│   ├── routes/api.php         # Semua route API
│   ├── database/migrations/   # Schema database
│   ├── config/goal.php        # Konfigurasi sport types & harga
│   └── tests/                 # Feature tests
│
└── DOKUMENTASI.md             # Dokumentasi lengkap (Bahasa Indonesia)
```

---

## Sistem Peran

___________________________________________________________
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

## Database

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

---

## Setup

### Backend

**Prerequisites:** PHP 8.2+, PostgreSQL, Composer

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Edit `.env` — isi koneksi PostgreSQL:

```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=goal
DB_USERNAME=your_user
DB_PASSWORD=your_password
```

```bash
php artisan migrate
php artisan db:seed --class=RoleSeeder
php artisan storage:link
php artisan serve
```

Backend berjalan di `http://localhost:8000/api`.

### Frontend

**Prerequisites:** Node.js 18+, npm

```bash
cd frontend
npm install
cp .env.example .env
npx expo start
```

Frontend auto-detect API base URL per platform. Untuk web, buka `http://localhost:8081`.

---

## API Endpoints

### Public

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/auth/register` | Daftar akun baru |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/check-email` | Cek email terdaftar |
| POST | `/api/auth/forgot-password` | Minta reset password |
| POST | `/api/auth/verify-token` | Verifikasi token reset |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/fields` | Daftar lapangan (public) |
| GET | `/api/fields/{id}` | Detail lapangan |
| GET | `/api/me/onboarding/check-username` | Cek username tersedia |

### Protected (Bearer Token)

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/auth/logout` | Logout |
| GET | `/api/me` | Profil saya |
| PUT | `/api/me` | Update profil |
| PUT | `/api/me/password` | Ganti password |
| POST | `/api/me/onboarding` | Submit onboarding |
| POST | `/api/upload/image` | Upload gambar |
| POST | `/api/me/owner-request` | Ajukan jadi owner |
| GET | `/api/me/owner-request` | Status pengajuan owner |
| GET | `/api/fields/my/list` | Daftar lapangan milik saya |
| POST | `/api/fields` | Buat lapangan *(owner/super_admin)* |
| PUT | `/api/fields/{id}` | Edit lapangan *(owner/super_admin)* |
| DELETE | `/api/fields/{id}` | Hapus lapangan *(owner/super_admin)* |
| GET | `/api/fields/pending/list` | Lapangan pending *(super_admin)* |
| GET | `/api/fields/trashed/list` | Lapangan terhapus *(super_admin)* |
| POST | `/api/fields/{id}/approve` | Approve/reject lapangan *(super_admin)* |
| POST | `/api/fields/{id}/restore` | Pulihkan lapangan *(super_admin)* |
| DELETE | `/api/fields/{id}/force` | Hapus permanen *(super_admin)* |
| GET | `/api/owner-requests/pending` | Pengajuan owner pending *(super_admin)* |
| POST | `/api/owner-requests/{id}/review` | Review pengajuan owner *(super_admin)* |
| GET | `/api/admin/users` | Daftar semua user *(super_admin)* |
| POST | `/api/admin/users` | Buat user baru *(super_admin)* |
| PUT | `/api/admin/users/{id}` | Edit user *(super_admin)* |
| PUT | `/api/admin/users/{id}/role` | Ubah role user *(super_admin)* |
| DELETE | `/api/admin/users/{id}` | Hapus user *(super_admin)* |

---

## Testing

```bash
cd backend
php artisan test
```

```bash
cd frontend
npx tsc --noEmit    # Type check
npm run lint         # Lint
```

---

## License

MIT
