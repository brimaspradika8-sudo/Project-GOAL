#!/bin/sh
set -e

echo "==> [GOAL] Menunggu PostgreSQL siap..."

# Pastikan konfigurasi memakai environment container, bukan cache dari host.
php artisan config:clear >/dev/null

# Tunggu sampai Laravel dapat membaca status migration dari PostgreSQL.
until php artisan migrate:status >/dev/null 2>&1; do
    echo "    PostgreSQL belum siap, menunggu 2 detik..."
    sleep 2
done

echo "==> [GOAL] PostgreSQL siap."

# Migrasi hanya dijalankan oleh service yang mengizinkan (app/scheduler default true)
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "==> [GOAL] Menjalankan migrasi..."
    php artisan migrate --force
fi

# Jika ada command override (queue:work, schedule:work, dsb), jalankan itu
if [ $# -gt 0 ]; then
    exec "$@"
fi

echo "==> [GOAL] Membersihkan cache konfigurasi..."
php artisan config:cache
php artisan route:cache

echo "==> [GOAL] Menjalankan Laravel server pada 0.0.0.0:8000..."
exec php artisan serve --host=0.0.0.0 --port=8000
