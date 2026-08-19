#!/bin/sh

echo "==> [GOAL] Menunggu PostgreSQL siap..."

# Tunggu sampai PostgreSQL benar-benar siap
until php -r '
$host = getenv("DB_HOST") ?: "127.0.0.1";
$port = (int) (getenv("DB_PORT") ?: 5432);
$socket = @fsockopen($host, $port, $errno, $errstr, 2);
if ($socket === false) { exit(1); }
 fclose($socket);
' >/dev/null 2>&1; do
    echo "    PostgreSQL belum siap, menunggu 2 detik..."
    sleep 2
done

echo "==> [GOAL] PostgreSQL siap."

# Bersihkan cache lama & regenerate
rm -f bootstrap/cache/packages.php 2>/dev/null || true
php artisan config:clear >/dev/null 2>&1 || true
php artisan package:discover --ansi >/dev/null 2>&1 || true

# Migrasi hanya dijalankan oleh service utama (app), bukan queue/scheduler
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "==> [GOAL] Menjalankan migrasi database..."
    php artisan migrate --force
    echo "==> [GOAL] Migrasi selesai."
fi

# Dalam development, selalu bersihkan cache agar perubahan .env/routes langsung aktif
echo "==> [GOAL] Membersihkan cache Laravel..."
php artisan config:clear || true
php artisan route:clear  || true
php artisan view:clear   || true
php artisan cache:clear  || true
echo "==> [GOAL] Cleanup cache selesai."

# Jika ada command override (queue:work, schedule:work, php-fpm, dsb), jalankan itu
if [ $# -gt 0 ]; then
    exec "$@"
fi

echo "==> [GOAL] Memulai PHP-FPM..."
exec php-fpm

