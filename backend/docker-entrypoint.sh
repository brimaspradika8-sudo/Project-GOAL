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

# Migrasi hanya dijalankan oleh service utama (app), bukan queue/scheduler
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "==> [GOAL] Menjalankan migrasi database..."
    php artisan migrate --force
    echo "==> [GOAL] Migrasi selesai."
fi

# Jika ada command override (queue:work, schedule:work, php-fpm, dsb), jalankan itu
if [ $# -gt 0 ]; then
    exec "$@"
fi

# Default: optimasi Laravel lalu jalankan PHP-FPM
echo "==> [GOAL] Menjalankan Laravel optimization..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
echo "==> [GOAL] Optimization selesai."

echo "==> [GOAL] Memulai PHP-FPM..."
exec php-fpm
