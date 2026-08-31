#!/bin/sh

echo "==> [GOAL] Memulai Laravel..."

# Migrasi hanya jika memang diperlukan
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    echo "==> [GOAL] Menjalankan migrasi database..."
    php artisan migrate --force
    echo "==> [GOAL] Migrasi selesai."
fi

echo "==> [GOAL] Menjalankan Laravel server..."

exec php artisan serve \
    --host=0.0.0.0 \
    --port="${PORT:-8000}"