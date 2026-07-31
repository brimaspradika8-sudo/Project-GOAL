# Setup Supabase Storage

## 1. Buat Bucket "images"

1. Buka [Supabase Dashboard](https://app.supabase.com) → pilih project anda
2. Masuk ke **Storage** → **Create a new bucket**
3. Isi:
   - **Name:** `images`
   - **Public bucket:** ✅ Centang (gambar perlu diakses publik tanpa autentikasi)
4. Klik **Create bucket**

## 2. Atur Policy RLS (Row Level Security)

### a. Izinkan public read (untuk menampilkan gambar)

Buka tab **Policies** di bucket `images`, jalankan SQL:

```sql
CREATE POLICY "Public read access for images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');
```

### b. Izinkan upload hanya untuk authenticated user dengan role owner/admin

Penting: Upload gambar dilakukan dari **backend Laravel** menggunakan **Service Role Key**, bukan dari frontend. Jadi policy ini hanya sebagai lapisan keamanan tambahan:

```sql
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');
```

### Alternatif: Gunakan SQL Editor langsung

Jalankan script lengkap berikut di **SQL Editor** Supabase:

```sql
-- 1. Buat bucket (jika belum ada)
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- 2. Public read untuk semua orang
create policy "Public read"
on storage.objects for select
using (bucket_id = 'images');

-- 3. Authenticated users bisa upload
create policy "Authenticated upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'images');
```

## 3. Dapatkan Kredensial

1. Masuk ke **Project Settings** → **API**
2. Salin nilai berikut:

| Variable | Dari mana |
|---|---|
| `SUPABASE_URL` | **Project URL** (kolom Project URL) |
| `SUPABASE_SERVICE_KEY` | **service_role key** (bukan anon key!) |

> ⚠️ **Service Role Key** memiliki akses penuh (bypass RLS). **Jangan pernah** expose key ini ke frontend/clientside. Hanya dipakai di server backend Laravel.

## 4. Set Environment Variable

Tambahkan ke `C:\GOAL\backend\.env`:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6Ik9...  # service_role key
SUPABASE_BUCKET=images
```

## 5. Verifikasi

Jalankan test upload via artisan tinker atau langsung dari aplikasi:

```bash
php artisan tinker
```

```php
$storage = app(\App\Services\SupabaseStorageService::class);
$url = $storage->upload('fields/test.txt', 'hello world', 'text/plain');
echo $url; // Harus mengembalikan public URL
$storage->delete($url); // Hapus file test
```

## Struktur Folder

File akan otomatis tersimpan dengan path:

```
images/fields/{timestamp}_{random}.{ext}
```

- `images` = nama bucket
- `fields` = folder untuk gambar lapangan
- `{timestamp}_{random}.{ext}` = nama file unik

## Troubleshooting

| Error | Kemungkinan Penyebab | Solusi |
|---|---|---|
| `404 Not Found` | Bucket belum dibuat | Buat bucket "images" via dashboard |
| `401 Unauthorized` | Service Role Key salah | Periksa SUPABASE_SERVICE_KEY di .env |
| `413 Payload Too Large` | File > 2MB | Perkecil ukuran file |
| File bisa diupload tapi tidak tampil | Bucket tidak public | Set `public = true` pada bucket |
