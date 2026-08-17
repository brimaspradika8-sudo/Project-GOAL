#!/bin/sh

echo "==> [GOAL] Menunggu PostgreSQL siap..."

# Bersihkan cache config lama (jangan pakai set -e — biarkan lanjut walau cache gagal)
php artisan config:clear >/dev/null 2>&1 || true

# Tunggu sampai PostgreSQL benar-benar siap — cek TCP socket langsung ke service DB.
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
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true
echo "==> [GOAL] Optimization selesai."

echo "==> [GOAL] Memulai PHP-FPM..."
exec php-fpm
