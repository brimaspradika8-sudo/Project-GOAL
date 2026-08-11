# Dockerfile untuk backend Laravel Project GOAL
FROM php:8.2-fpm

# Install dependency sistem + ekstensi PHP yang dibutuhkan Laravel + Postgres
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpq-dev \
    libzip-dev \
    zip \
    unzip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && docker-php-ext-install pdo pdo_pgsql zip \
    && rm -rf /var/lib/apt/lists/*

# Install Composer (ambil dari image resmi composer, bukan curl manual)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copy file composer dulu (biar cache layer Docker lebih efisien —
# dependency cuma di-install ulang kalau composer.json berubah)
COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader --prefer-dist

# Baru copy semua kode
COPY . .

RUN composer dump-autoload --optimize

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Pastikan folder storage & cache bisa ditulis
RUN chmod -R 775 storage bootstrap/cache

EXPOSE 8000

# Gunakan entrypoint script yang menunggu PostgreSQL, migrate, lalu serve
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Default: jalankan server. Service lain (queue-worker, scheduler) meng-override CMD ini.
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
