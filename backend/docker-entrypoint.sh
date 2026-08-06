#!/bin/sh
set -e

echo "==> [GOAL] Menunggu PostgreSQL siap..."

# Tunggu sampai PostgreSQL benar-benar menerima koneksi
until php artisan db:monitor --databases=pgsql 2>/dev/null | grep -q "OK"; do
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
