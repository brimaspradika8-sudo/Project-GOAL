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

# Jika ada command override (queue:work, schedule:work, dsb), jalankan langsung tanpa migrasi/cache-clear
if [ $# -gt 0 ]; then
    exec "$@"
fi

# Migrasi hanya dijalankan oleh service utama (app)
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    echo "==> [GOAL] Menjalankan migrasi database..."
    php artisan migrate --force || true
    echo "==> [GOAL] Migrasi selesai."
fi

if [ -f /usr/local/etc/php-fpm.d/zz-docker.conf ]; then
    grep -q "pm.max_children" /usr/local/etc/php-fpm.d/zz-docker.conf || echo "pm.max_children = 20" >> /usr/local/etc/php-fpm.d/zz-docker.conf
    grep -q "pm.max_requests" /usr/local/etc/php-fpm.d/zz-docker.conf || echo "pm.max_requests = 500" >> /usr/local/etc/php-fpm.d/zz-docker.conf
fi

echo "==> [GOAL] Memulai Laravel..."
php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
