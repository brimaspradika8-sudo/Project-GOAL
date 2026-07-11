# PROMPT — Onboarding G.O.A.L (ALL-IN-ONE, Final)
### Logika Sistem + UI/UX + Implementasi Kode Lengkap dalam Satu Dokumen

Dokumen ini menggantikan `PROMPT_Onboarding_Final.md` dan `PROMPT_Onboarding_Lengkap.md`. Cakupan: wizard 4 langkah — Username (pre-filled + acak nama), Foto Profil & Umur, Wilayah (Provinsi + Kabupaten/Kota), Hobi Olahraga. Sinkron dengan `PROMPT_Sistem_Login.md`, `PROMPT_GOAL_MVP_FINAL_AllInOne.md`, dan identitas visual "Kartu Pemain" (`GOAL_Auth_Mockup.html`).

---

## 1. Konsep

Onboarding = momen **"Aktivasi Kartu Pemain"**. Kartu sudah diterbitkan saat Register, tapi baru benar-benar aktif setelah identitas pemain dilengkapi. Identitas visual tetap memakai `<PlayerPassCard>` (header kop kartu + garis perforasi + tema stadium malam & emas floodlight) — sama seperti Login/Register, supaya terasa sebagai kelanjutan alur yang sama.

**Headline utama:** "AKTIFKAN KARTU PEMAIN"
**Subheadline:** "Lengkapi identitasmu sebelum masuk arena."

---

## 2. Kapan Onboarding Muncul (Route Guard)

```
Setelah login/register sukses:
  -> Cek profile.onboarding_completed
     -> false -> WAJIB tampilkan Onboarding, blokir akses ke halaman lain (tidak bisa di-skip/back)
     -> true  -> lewati, langsung ke Home/Dashboard sesuai role
```
Logic ini terpusat di root layout aplikasi (`app/_layout.tsx`), sama seperti dijelaskan di `PROMPT_Sistem_Login.md` — bukan dicek ulang di tiap halaman.

---

## 3. Struktur Wizard — 4 Langkah

```
Langkah 1/4 — Username            (pre-filled dari nama Register + editable + tombol Acak Nama)
Langkah 2/4 — Foto Profil & Umur   (foto opsional, umur wajib)
Langkah 3/4 — Wilayah              (Provinsi -> Kabupaten/Kota, wajib)
Langkah 4/4 — Hobi Olahraga        (multi-select, minimal 1, wajib)
```
Progress bar tipis di atas kartu (4 segmen, segmen terlewati/aktif berwarna `--floodlight`). Tombol "Lanjut" di tiap langkah; tombol di langkah terakhir berubah jadi "AKTIFKAN KARTU". Tidak ada tombol Lewati/Skip di langkah manapun, dan tidak ada tombol kembali ke Login/Register.

---

## 4. Logika Detail per Langkah

### 4.1 Langkah 1 — Username

**Pre-fill otomatis dari nama Register:**
```
"Andra Saputra" (nama saat register)
  -> slugify -> "andrasaputra"
  -> cek ketersediaan di backend -> jika sudah dipakai, coba "andrasaputra1", "andrasaputra2", dst
  -> field terisi otomatis dengan hasil ini, TETAP BISA DIEDIT BEBAS oleh user
```

**Fitur Acak Nama (tombol dadu di sebelah input):**
```
Tekan tombol Acak -> panggil backend -> generate kombinasi:
  [Adjektif Olahraga] + [Noun Arena] + [angka 2 digit]
  Contoh: "StrikerTangguh82", "KiperCepat14", "PivotElite37"
-> Field terisi otomatis dengan hasil acak (dicek dulu ketersediaannya sebelum ditampilkan)
-> User tetap bisa edit manual setelahnya
```
Kata dasar (di-seed backend): Adjektif — Tangguh, Cepat, Elite, Legend, Juara, Handal, Gesit, Solid. Noun — Striker, Kiper, Playmaker, Pivot, Smash, Ace, Sniper, Pemain.

**Live-check** tetap berjalan (debounce 500ms) baik untuk hasil pre-fill, hasil acak, maupun ketikan manual user.

**UI:**
```
Eyebrow: LANGKAH 1/4
Headline: SIAPA NAMA ARENAMU?
Sub: Ini yang akan dilihat pemain lain. Sudah kami isi dari namamu, boleh diubah.

[ @ input username ..................... ✓/✕ ]  [ 🎲 ]
Username tersedia / Username sudah dipakai

[ LANJUT ]
```

### 4.2 Langkah 2 — Foto Profil & Umur

```
Eyebrow: LANGKAH 2/4
Headline: TAMBAHKAN FOTOMU
Sub: Opsional tapi bikin profil kamu lebih hidup.

  (lingkaran avatar besar, placeholder ikon kamera + badge kecil ikon "+")
  Ubah Foto

Umur
[ input angka ]

[ LANJUT ]
```
- Tap avatar/teks "Ubah Foto" -> action sheet: "Ambil Foto" / "Pilih dari Galeri"
- Foto **opsional** — tidak memblokir tombol Lanjut jika kosong
- Umur **wajib**, validasi 10-80

### 4.3 Langkah 3 — Wilayah (Wajib, Dua Tingkat)

```
Eyebrow: LANGKAH 3/4
Headline: DI MANA ARENAMU?
Sub: Pilih kabupaten/kota tempat kamu biasa main.

Provinsi
[ dropdown searchable ]

Kabupaten/Kota
[ dropdown searchable, muncul setelah Provinsi dipilih ]

[ LANJUT ]
```
- Dua tingkat: pilih Provinsi dulu, baru daftar Kabupaten/Kota termuat (34 provinsi, 514+ kabupaten/kota — wajib pakai dropdown searchable, bukan picker panjang biasa)
- **Wajib diisi**, tombol Lanjut disabled sampai Kabupaten/Kota terpilih
- Data wilayah disimpan di database sendiri (bukan panggil API eksternal saat runtime)

### 4.4 Langkah 4 — Hobi Olahraga

```
Eyebrow: LANGKAH 4/4
Headline: OLAHRAGA APA YANG KAMU SUKA?
Sub: Pilih minimal 1, boleh lebih.

Chip: Futsal | Basket | Badminton | Voli | Mini Soccer | Tenis | Tenis Meja | Lainnya

[ AKTIFKAN KARTU ]
```
- Multi-select chip, minimal 1 dipilih
- Tombol submit final: "AKTIFKAN KARTU"

### 4.5 Setelah Submit
```
POST /api/v1/me/onboarding { username, age, region_id, sports[], avatar_url? }
-> onboarding_completed = true
-> GET /api/v1/me (refresh profile di store)
-> Redirect otomatis:
   role='player' -> (player)/home
   role='owner'  -> is_owner_verified ? (owner)/dashboard : halaman "Menunggu Verifikasi"
```

---

## 5. Design Tokens (Sama Seperti Auth Screens)

```
--stadium-night:#0D1B1E   --stadium-panel:#142B2F
--floodlight:#F2B705      --floodlight-dim:#7A5C0A
--pitch-green:#2E7D5B     --chalk:#EDEBE3
--muted:#8A9A96           --error:#E5484D
--line:rgba(237,235,227,0.14)

Font Headline: 'Bebas Neue'   Font Body: 'Inter'   Font Data/Kode: 'JetBrains Mono'
Radius: 10px (input/tombol), 20px (card)
```

---

## 6. Fitur Ganti Profil (Setelah Onboarding, di Halaman Profil)

Semua field di atas bisa diubah kembali kapan saja lewat halaman Profil (bukan lewat endpoint onboarding lagi, karena itu hanya dipanggil sekali):
```
PUT /api/v1/me — untuk update: foto, username, umur, wilayah, hobi olahraga
```
Tampilan halaman Profil memakai komponen input yang SAMA dengan yang dipakai di wizard onboarding (`AvatarPicker`, `UsernameSuggestInput` tanpa fitur acak, `RegionSelect`, `SportChipGrid`) — hanya tanpa wizard/progress bar, karena di halaman Profil semua field tampil sekaligus dalam satu form biasa.

---

## 7. Implementasi Teknis Lengkap

### 7.1 Skema Database

```sql
-- Tambahan ke tabel profiles yang sudah ada
ALTER TABLE profiles ADD COLUMN age INT;
ALTER TABLE profiles ADD COLUMN region_id VARCHAR(4) REFERENCES regions_regencies(id);
-- avatar_url dan username sudah ada dari skema sebelumnya

-- Tabel referensi wilayah (data di-import sekali dari dataset resmi, bukan API eksternal runtime)
CREATE TABLE regions_provinces (
    id VARCHAR(2) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE regions_regencies (
    id VARCHAR(4) PRIMARY KEY,
    province_id VARCHAR(2) NOT NULL REFERENCES regions_provinces(id),
    name VARCHAR(100) NOT NULL
);

-- Sudah ada dari skema sebelumnya
CREATE TABLE user_sport_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sport_type VARCHAR(50) NOT NULL,
    UNIQUE (user_id, sport_type)
);
```

### 7.2 API Endpoints

```
GET  /api/v1/me/onboarding/suggest-username?name=Andra%20Saputra
GET  /api/v1/me/onboarding/random-username
GET  /api/v1/me/onboarding/check-username?username=
GET  /api/v1/regions/provinces
GET  /api/v1/regions/provinces/{id}/regencies
POST /api/v1/me/onboarding        (submit final, sekali pakai)
POST /api/v1/me/avatar            (upload foto — dipakai onboarding maupun edit profil)
PUT  /api/v1/me                   (edit profil setelah onboarding selesai)
```

### 7.3 Backend — Controller (Laravel)

```php
// app/Http/Controllers/ProfileController.php

public function suggestUsername(Request $request)
{
    $name = $request->query('name', '');
    $base = strtolower(preg_replace('/[^a-zA-Z0-9\s]/', '', $name));
    $base = str_replace(' ', '', $base);
    $base = substr($base, 0, 15);

    $username = $base;
    $i = 0;
    while (DB::table('profiles')->whereRaw('LOWER(username) = ?', [strtolower($username)])->exists()) {
        $i++;
        $username = $base . $i;
    }

    return response()->json(['suggested' => $username]);
}

public function randomUsername()
{
    $adjectives = ['Tangguh','Cepat','Elite','Legend','Juara','Handal','Gesit','Solid'];
    $nouns = ['Striker','Kiper','Playmaker','Pivot','Smash','Ace','Sniper','Pemain'];

    do {
        $username = $nouns[array_rand($nouns)] . $adjectives[array_rand($adjectives)] . rand(10, 99);
    } while (DB::table('profiles')->whereRaw('LOWER(username) = ?', [strtolower($username)])->exists());

    return response()->json(['suggested' => $username]);
}

public function checkUsername(Request $request)
{
    $username = $request->query('username');
    $exists = DB::table('profiles')->whereRaw('LOWER(username) = ?', [strtolower($username)])->exists();
    return response()->json(['available' => !$exists]);
}

public function submitOnboarding(Request $request)
{
    $validated = $request->validate([
        'username' => 'required|string|min:3|max:20|regex:/^[a-zA-Z0-9_]+$/|unique:profiles,username',
        'age' => 'required|integer|min:10|max:80',
        'region_id' => 'required|string|exists:regions_regencies,id',
        'sports' => 'required|array|min:1',
        'sports.*' => 'string',
        'avatar_url' => 'nullable|string',
    ]);

    $userId = $request->attributes->get('auth_user_id');

    DB::table('profiles')->where('id', $userId)->update([
        'username' => $validated['username'],
        'age' => $validated['age'],
        'region_id' => $validated['region_id'],
        'avatar_url' => $validated['avatar_url'] ?? null,
        'onboarding_completed' => true,
    ]);

    foreach ($validated['sports'] as $sport) {
        DB::table('user_sport_preferences')->insert([
            'id' => Str::uuid(),
            'user_id' => $userId,
            'sport_type' => strtolower($sport),
        ]);
    }

    return response()->json(DB::table('profiles')->where('id', $userId)->first());
}

public function uploadAvatar(Request $request)
{
    $request->validate(['avatar' => 'required|image|max:5120']);
    $userId = $request->attributes->get('auth_user_id');

    // Upload ke Supabase Storage bucket 'avatars' (public)
    $path = "avatars/{$userId}.jpg";
    $url = app(SupabaseStorageService::class)->upload('avatars', $path, $request->file('avatar'));

    DB::table('profiles')->where('id', $userId)->update(['avatar_url' => $url]);

    return response()->json(['avatar_url' => $url]);
}

public function getProvinces()
{
    return response()->json(DB::table('regions_provinces')->orderBy('name')->get());
}

public function getRegencies($provinceId)
{
    return response()->json(
        DB::table('regions_regencies')->where('province_id', $provinceId)->orderBy('name')->get()
    );
}
```

### 7.4 Frontend — React Native (Expo Router)

```typescript
// src/schemas/onboarding.ts
import { z } from 'zod';

export const onboardingSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Hanya huruf, angka, underscore'),
  age: z.number().int().min(10).max(80),
  regionId: z.string().min(1, 'Wilayah wajib dipilih'),
  sports: z.array(z.string()).min(1, 'Pilih minimal 1 olahraga'),
  avatarUrl: z.string().optional(),
});
```

```typescript
// src/hooks/useUsernameCheck.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/api/client';
import { useDebouncedValue } from './useDebouncedValue';

export function useUsernameCheck(rawUsername: string) {
  const username = useDebouncedValue(rawUsername, 500);
  return useQuery({
    queryKey: ['username-check', username],
    queryFn: async () => (await apiClient.get(`/me/onboarding/check-username?username=${username}`)).data.available,
    enabled: username.length >= 3,
    staleTime: 0,
  });
}
```

```typescript
// app/(onboarding)/index.tsx — kerangka wizard 4 langkah
import { useState } from 'react';
import { router } from 'expo-router';
import { apiClient } from '@/src/api/client';
import { useAuthStore } from '@/src/stores/authStore';

const TOTAL_STEPS = 4;

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    username: '', age: '', regionId: '', avatarUrl: '', sports: [] as string[],
  });
  const { setProfile } = useAuthStore();

  function next() { setStep((s) => Math.min(s + 1, TOTAL_STEPS)); }

  async function handleFinalSubmit() {
    await apiClient.post('/me/onboarding', {
      username: form.username,
      age: Number(form.age),
      region_id: form.regionId,
      sports: form.sports,
      avatar_url: form.avatarUrl || undefined,
    });
    const profileRes = await apiClient.get('/me');
    setProfile(profileRes.data);

    if (profileRes.data.role === 'owner') {
      router.replace(profileRes.data.is_owner_verified ? '/(owner)/dashboard' : '/(auth)/pending-verification');
    } else {
      router.replace('/(player)/home');
    }
  }

  return (
    // <PlayerPassCard>
    //   <ProgressBar step={step} total={TOTAL_STEPS} />
    //   {step === 1 && <StepUsername value={form.username} onChange={...} onNext={next} />}
    //   {step === 2 && <StepPhotoAge ... onNext={next} />}
    //   {step === 3 && <StepRegion ... onNext={next} />}
    //   {step === 4 && <StepSports ... onSubmit={handleFinalSubmit} />}
    // </PlayerPassCard>
  );
}
```

```typescript
// Contoh Step 1: Username dengan pre-fill + acak nama
function StepUsername({ value, onChange, onNext, registerName }: Props) {
  const { data: isAvailable, isFetching } = useUsernameCheck(value);

  useEffect(() => {
    if (!value && registerName) {
      apiClient.get(`/me/onboarding/suggest-username?name=${registerName}`)
        .then((res) => onChange(res.data.suggested));
    }
  }, []);

  async function handleRandomize() {
    const res = await apiClient.get('/me/onboarding/random-username');
    onChange(res.data.suggested);
  }

  const canProceed = value.length >= 3 && isAvailable && !isFetching;

  return (
    // Eyebrow "LANGKAH 1/4", headline "SIAPA NAMA ARENAMU?"
    // <UsernameInput value={value} onChange={onChange} status={...} />
    // <DiceButton onPress={handleRandomize} />
    // <StampButton title="LANJUT" disabled={!canProceed} onPress={onNext} />
  );
}
```

```typescript
// Upload foto (dipakai di Step 2 maupun halaman Profil)
import * as ImagePicker from 'expo-image-picker';

async function pickAndUploadAvatar(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsEditing: true,
    aspect: [1, 1],
  });
  if (result.canceled) return null;

  const file = result.assets[0];
  const formData = new FormData();
  formData.append('avatar', { uri: file.uri, name: 'avatar.jpg', type: 'image/jpeg' } as any);

  const res = await apiClient.post('/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.avatar_url;
}
```

### 7.5 Komponen yang Perlu Dibangun

```
<PlayerPassCard>                — wrapper kartu + header kop + garis perforasi (reuse dari Auth)
<OnboardingProgressBar step total />
<UsernameInput value onChange status="checking|available|taken" />
<DiceButton onPress />           — tombol acak nama
<AvatarPicker value onChange />  — lingkaran foto + action sheet kamera/galeri
<AgeInput value onChange />
<RegionSelect provinceId regencyId onProvinceChange onRegencyChange />  — 2 dropdown searchable bertingkat
<SportChipGrid options selected onToggle />
<StampButton title disabled onPress />  — reuse dari Auth
```

---

## 8. Business Rules Kritis

1. Username disarankan otomatis dari nama Register, **selalu bisa diedit bebas** — bukan field terkunci
2. Fitur Acak Nama menghasilkan kombinasi bertema olahraga, **dicek ketersediaannya dulu** sebelum ditampilkan ke user
3. Foto profil **opsional saat onboarding**; username, umur, wilayah, dan hobi **wajib**
4. Wilayah wajib dipilih 2 tingkat (Provinsi lalu Kabupaten/Kota) — tidak boleh submit hanya Provinsi
5. Data wilayah Indonesia disimpan di database sendiri (import sekali dari dataset resmi), **bukan** dipanggil dari API pihak ketiga saat runtime
6. Username **dicek dua kali**: live-check saat mengetik (UX) dan validasi ulang saat submit di backend (mencegah race condition)
7. Onboarding wajib diselesaikan sebelum akses ke halaman lain — tidak ada tombol skip atau kembali
8. Setelah onboarding selesai, **seluruh field bisa diubah lagi** lewat halaman Profil menggunakan endpoint `PUT /api/v1/me`
9. Redirect setelah submit final ditentukan otomatis oleh role dan status verifikasi Owner — logic yang sama seperti root layout, tidak diduplikasi

---

## 9. Acceptance Criteria

- [ ] Username di Langkah 1 otomatis terisi dari nama Register, tetap bisa diedit manual
- [ ] Tombol Acak Nama menghasilkan username unik bertema olahraga dan langsung mengisi field
- [ ] Live-check username berfungsi untuk suggestion, hasil acak, maupun ketikan manual
- [ ] Foto profil di Langkah 2 bisa diambil dari kamera/galeri, ter-crop persegi, ter-upload ke Supabase Storage; tombol Lanjut tetap aktif meski foto kosong
- [ ] Umur wajib diisi dengan validasi 10-80 sebelum lanjut dari Langkah 2
- [ ] Wilayah di Langkah 3: dropdown Kabupaten/Kota hanya muncul setelah Provinsi dipilih, dan wajib diisi sebelum lanjut
- [ ] Hobi olahraga di Langkah 4 minimal 1 dipilih sebelum tombol "AKTIFKAN KARTU" aktif
- [ ] Setelah submit final, redirect otomatis sesuai role & status verifikasi Owner
- [ ] Progress bar 4 segmen akurat mengikuti langkah aktif
- [ ] Tidak ada tombol skip atau kembali ke Login/Register di seluruh wizard
- [ ] Semua field (foto, username, umur, wilayah, hobi) bisa diedit ulang lewat halaman Profil setelah onboarding selesai