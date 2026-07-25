# DOKUMENTASI FRONTEND — GOAL

> React Native (Expo SDK 54) + expo-router 6
> Platform: Web, iOS, Android

---

## 1. TECH STACK

| Package | Versi | Kegunaan |
|---------|-------|----------|
| expo | 54 | Framework React Native |
| expo-router | 6 | File-based routing |
| react-native | 0.81.5 | UI framework |
| zustand | 5.0.14 | State management |
| @expo/vector-icons | 14.x | Icon (MaterialIcons) |
| expo-image | 2.x | Optimized image loading |
| expo-image-picker | 16.x | Avatar/camera picker |
| expo-secure-store | 14.x | Encrypted storage |
| @react-native-async-storage/async-storage | 2.x | Local storage |
| react-native-reanimated | 4.1 | Animasi |
| react-native-gesture-handler | 2.24 | Gesture handling |
| react-native-web | 0.21 | Web support |
| typescript | 5.9.2 | Type safety |

---

## 2. STRUKTUR FOLDER

```
frontend/
├── app/                        # File-based routes (expo-router)
│   ├── _layout.tsx             # Root Stack — splash, auth check, routing
│   ├── index.tsx               # Redirect → /login
│   ├── login.tsx               # Login
│   ├── register.tsx            # Register
│   ├── forgot-password.tsx     # Lupa password
│   ├── reset-password.tsx      # Reset password via token
│   ├── change-password.tsx     # Ganti password (authenticated)
│   ├── onboarding.tsx          # Onboarding 2 langkah
│   ├── venue-detail.tsx        # Detail venue
│   ├── booking.tsx             # Booking (placeholder)
│   ├── e-ticket.tsx            # E-ticket
│   │
│   ├── (tabs)/                 # Tab utama user
│   │   ├── _layout.tsx         # Tab navigator (4 visible + 4 hidden)
│   │   ├── index.tsx           # Beranda (home)
│   │   ├── booking.tsx         # Tab booking
│   │   ├── matches.tsx         # Tab match
│   │   ├── profile.tsx         # Profile
│   │   ├── my-fields.tsx       # Lapangan saya (hidden tab)
│   │   ├── fields.tsx          # Browse lapangan (hidden tab)
│   │   ├── explore.tsx         # Explore (hidden tab)
│   │   └── admin.tsx           # Legacy redirect (hidden tab)
│   │
│   ├── (admin)/                # Panel admin
│   │   ├── _layout.tsx         # Sidebar (web) / Tabs (mobile)
│   │   ├── users.tsx           # Kelola user
│   │   ├── owner-requests.tsx  # Review request owner
│   │   ├── pending-fields.tsx  # Review lapangan (super_admin)
│   │   └── profile.tsx         # Profile admin
│   │
│   └── (owner)/                # Panel owner
│       ├── _layout.tsx         # Sidebar (web) / Tabs (mobile)
│       ├── fields.tsx          # Kelola lapangan
│       ├── bookings.tsx        # Kelola booking
│       ├── revenue.tsx         # Dashboard revenue
│       └── profile.tsx         # Profile owner
│
├── components/
│   ├── web/
│   │   ├── TopNavbar.tsx       # Navbar sticky (web only)
│   │   └── Sidebar.tsx         # Sidebar (admin & owner, web only)
│   ├── shared/
│   │   ├── DashboardHeader.tsx # Header halaman admin/owner
│   │   └── ConfirmDialog.tsx   # Dialog konfirmasi
│   ├── admin/                  # Komponen halaman admin
│   ├── owner/                  # Komponen halaman owner
│   ├── goalTheme.ts            # Warna, font, shadow, ukuran
│   ├── SplashScreen.tsx        # Splash screen
│   ├── AuthScreenLayout.tsx    # Layout untuk halaman auth
│   ├── SafeImage.tsx           # Image dengan fallback
│   ├── Skeleton.tsx            # Loading skeleton
│   ├── ScaleButton.tsx         # Button dengan animasi scale
│   ├── ThemeToggle.tsx         # Toggle dark/light mode
│   └── ...
│
├── store/
│   ├── profileStore.ts         # Profile state (Zustand)
│   └── fieldStore.ts           # Field state (Zustand)
│
├── lib/
│   ├── api.ts                  # Base URL + error handler
│   ├── auth.ts                 # Token key constant
│   ├── theme.tsx               # Theme provider + hook
│   └── secureStorage.ts        # Secure storage wrapper
│
├── hooks/
│   └── useDebounce.ts          # Debounce hook
│
├── data/
│   └── venues.ts               # Data statik venue & kategori
│
├── types/                      # TypeScript type definitions
├── constants/                  # App constants
└── assets/                     # Gambar, font
```

---

## 3. ROUTING & NAVIGASI

### 3.1 Auth Flow (Root Layout — `app/_layout.tsx`)

```
Splash Screen
    │
    ▼
Cek token di AsyncStorage
    │
    ├── Token valid → GET /me
    │       │
    │       ├── onboarding_completed = false → /onboarding
    │       ├── role = admin/super_admin → /admin/users
    │       └── role = player/owner → /(tabs)/index
    │
    └── Token tidak ada → /login
```

**Penting:** Menggunakan `router.replace()` (bukan push) agar user tidak bisa navigasi back ke layar yang terkunci.

### 3.2 Tab Navigator (`(tabs)/_layout.tsx`)

| Tab | Route | Icon | Visible |
|-----|-------|------|---------|
| Beranda | `/(tabs)/index` | home | ✅ |
| Booking | `/(tabs)/booking` | event-available | ✅ |
| Match | `/(tabs)/matches` | sports-soccer | ✅ |
| Profile | `/(tabs)/profile` | person | ✅ |
| Lapangan Saya | `/(tabs)/my-fields` | — | ❌ (hidden) |
| Browse Lapangan | `/(tabs)/fields` | — | ❌ (hidden) |
| Explore | `/(tabs)/explore` | — | ❌ (hidden) |
| Admin | `/(tabs)/admin` | — | ❌ (hidden) |

**Web:** Tab bar disembunyikan, digantikan `TopNavbar` sticky.
**Mobile:** Bottom tab bar ditampilkan.

### 3.3 Admin & Owner Layout

**Web:** Menggunakan `Sidebar` (256px, sticky) dengan navigasi side-by-side.
**Mobile:** Menggunakan bottom tab bar.

---

## 4. STATE MANAGEMENT (Zustand)

### 4.1 Profile Store (`store/profileStore.ts`)

```typescript
interface Profile {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  username: string;
  avatar_url: string | null;
  sports: string[];
  region: string | null;
  onboarding_completed: boolean;
  role: 'player' | 'owner' | 'admin' | 'super_admin';
  is_owner_verified: boolean;
  age: number | null;
}

// Actions
fetchProfile()    // GET /me → cache di AsyncStorage
clearProfile()    // Hapus cache + state
```

**Fitur:**
- Cache-first: load dari AsyncStorage dulu, lalu fetch dari API
- AbortController: mencegah duplicate concurrent requests
- Auto-fetch saat profile null

### 4.2 Field Store (`store/fieldStore.ts`)

```typescript
interface Field {
  id: number;
  name: string;
  sport_type: string;
  location: string | null;
  description: string | null;
  price_per_hour: number | null;
  image_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  approved_at: string | null;
  owner?: { id: number; name: string };
  created_at: string;
  updated_at: string;
}

// Actions
fetchFields(sport?, search?)   // GET /fields with filters
fetchMore()                     // Infinite scroll pagination
refreshFields()                 // Force refresh
clearCache()                    // Hapus AsyncStorage cache
```

**Fitur:**
- Per-query cache di AsyncStorage
- Infinite scroll dengan `fetchMore()`
- Pagination metadata (current_page, last_page, total)

---

## 5. THEMING

### 5.1 Mode

| Mode | Keterangan |
|------|------------|
| `light` | Selalu terang |
| `dark` | Selalu gelap |
| `auto` | Terang 06:00-18:00, gelap di luar jam itu |

### 5.2 Penggunaan

```typescript
import { useTheme } from './lib/theme';

function MyComponent() {
  const { colors, mode, setMode, toggleTheme } = useTheme();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Hello</Text>
    </View>
  );
}
```

### 5.3 Color Tokens Utama

**Light Mode:**
| Token | Nilai | Kegunaan |
|-------|-------|----------|
| `primary` | #1E8A4C | Warna utama (hijau) |
| `background` | #F3F7F4 | Background halaman |
| `surface` | #FFFFFF | Background card |
| `text` | #16201A | Teks utama |
| `textSecondary` | #5B6960 | Teks sekunder |
| `error` | #E0533D | Error/danger |
| `divider` | #E2E9E4 | Garis pemisah |

**Dark Mode:**
| Token | Nilai | Kegunaan |
|-------|-------|----------|
| `primary` | #34D07B | Warna utama (hijau terang) |
| `background` | #111827 | Background halaman |
| `surface` | #1F2937 | Background card |
| `text` | #F9FAFB | Teks utama |
| `textSecondary` | #9CA3AF | Teks sekunder |

---

## 6. KOMPONEN KUNCI

### 6.1 TopNavbar (`components/web/TopNavbar.tsx`)

Sticky navbar untuk web. Menampilkan:
- Logo "GOAL" (kiri)
- Navigasi: Beranda, Booking, Match, Profile (tengah)
- Bell notifikasi + Avatar profile (kanan)

### 6.2 Sidebar (`components/web/Sidebar.tsx`)

Sidebar 256px untuk admin & owner panel di web. Props:
```typescript
interface SidebarProps {
  title: string;           // Judul section
  items: SidebarItem[];    // Menu items
  accentColor?: string;    // Warna aksen
}
```

### 6.3 SafeImage (`components/SafeImage.tsx`)

Image dengan fallback otomatis jika gagal load.
```typescript
<SafeImage
  source={{ uri: 'https://...' }}
  style={styles.image}
  resizeMode="cover"
  fallbackSize={32}  // Ukuran icon fallback
/>
```

### 6.4 Skeleton (`components/Skeleton.tsx`)

Loading placeholder untuk konten yang sedang dimuat:
- `SkeletonProfile()` — placeholder profile
- `SkeletonVenueList()` — placeholder daftar venue
- `SkeletonHorizontalCards()` — placeholder kartu horizontal

---

## 7. HALAMAN UTAMA

### 7.1 Login (`app/login.tsx`)

- Email + password
- Rate limit: 5 detik antar percobaan
- Setelah login → fetch profile → redirect berdasarkan role
- UI: Glass card dengan background image, animasi

### 7.2 Register (`app/register.tsx`)

- Name + email + password + konfirmasi
- Validasi klien: 8+ karakter, huruf besar, angka
- Auto-login setelah register berhasil

### 7.3 Onboarding (`app/onboarding.tsx`)

**Langkah 1 — Profil:**
- Upload avatar (expo-image-picker)
- Username (cek ketersediaan real-time via `/me/onboarding/check-username`)
- Generator username random
- Pilih provinsi/kota
- Setujui syarat & ketentuan

**Langkah 2 — Preferensi Olahraga:**
- Pilih minimal 1 dari 8 olahraga
- Multi-select chips

### 7.4 Beranda (`app/(tabs)/index.tsx`)

- Hero panel: "Halo, {nama}" + "Temukan lapangan terbaik hari ini"
- Search bar dengan debounce 300ms
- Kategori horizontal scroll (Futsal, Basket, Badminton, dll)
- Promo card
- Venue Populer (grid, max 5)
- Rekomendasi Terdekat (grid)
- Olahraga Favorit chips
- FAB untuk browse lapangan

### 7.5 Profile (`app/(tabs)/profile.tsx`)

- Avatar + nama + role badge
- Preferensi olahraga
- Flow request owner:
  - Status: pending / approved / rejected
  - Form submit jika belum submit
- Settings:
  - Edit profil
  - Notifikasi (placeholder)
  - Ganti password
  - Bantuan
- Logout dengan konfirmasi

### 7.6 Venue Detail (`app/venue-detail.tsx`)

- Hero image
- Status badge (Tersedia/Menunggu)
- Info: jenis olahraga + harga/jam
- Deskripsi
- Info pemilik
- Bottom bar: harga + tombol booking

---

## 8. API LAYER

### 8.1 Base URL (`lib/api.ts`)

Otomatis deteksi environment:
| Platform | Base URL |
|----------|----------|
| Web | `http://localhost:8000/api` |
| Android Emulator | `http://10.0.2.2:8000/api` |
| iOS/Expo Go | Auto-detect Expo host IP |
| Production | `EXPO_PUBLIC_API_URL` env var |

### 8.2 Error Handler

```typescript
getErrorMessage(error) // Ekstrak message dari response Laravel validation
```

### 8.3 Contoh Penggunaan

```typescript
import { API_BASE_URL } from '../lib/api';

const res = await fetch(`${API_BASE_URL}/fields`, {
  headers: { Accept: 'application/json' },
});
const body = await res.json();
```

---

## 9. LAYOUT RESPONSIF

### Web (width ≥ 900px)
- **User:** TopNavbar sticky + konten full-width
- **Admin/Owner:** Sidebar 256px + konten

### Mobile (width < 900px)
- **User:** Bottom tab bar
- **Admin/Owner:** Bottom tab bar

---

## 10. COMMANDS

```bash
# Development
npm install                    # Install dependencies
npx expo start                 # Start dev server (all platforms)
npx expo start --web           # Web only
npx expo start --web -c        # Clear Metro cache

# Build
npx expo export --platform web # Static web export
eas build --platform android   # Android build (EAS)
eas build --platform ios       # iOS build (EAS)

# Type check
npx tsc --noEmit               # Cek error TypeScript

# Lint
npx eslint .                   # Cek error ESLint
```
