# Dockerfile untuk backend Laravel Project GOAL (Production)
FROM php:8.2-fpm

# Install dependency sistem + ekstensi PHP yang dibutuhkan Laravel + Postgres
RUN apt-get update && apt-get install -y \
    git \
    curl \
    netcat-openbsd \
    libpq-dev \
    libzip-dev \
    libicu-dev \
    zip \
    unzip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && docker-php-ext-install pdo pdo_pgsql zip pcntl intl \
    && rm -rf /var/lib/apt/lists/*

# PHP-FPM: tuning untuk production
RUN echo "expose_php = Off" >> /usr/local/etc/php/conf.d/security.ini \
    && echo "display_errors = Off" >> /usr/local/etc/php/conf.d/security.ini \
    && echo "log_errors = On" >> /usr/local/etc/php/conf.d/security.ini \
    && echo "error_log = /var/log/php_errors.log" >> /usr/local/etc/php/conf.d/security.ini \
    && echo "upload_max_filesize = 2M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "post_max_size = 4M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "memory_limit = 256M" >> /usr/local/etc/php/conf.d/uploads.ini

# Install Composer (ambil dari image resmi composer)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copy file composer dulu (biar cache layer Docker lebih efisien —
# dependency cuma di-install ulang kalau composer.json berubah)
COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader --prefer-dist --no-dev

# Baru copy semua kode
COPY . .

RUN composer dump-autoload --optimize --classmap-authoritative

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Pastikan folder storage & cache bisa ditulis oleh www-data (user PHP-FPM)
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Healthcheck: memastikan PHP-FPM benar-benar sudah listening di port 9000
# sebelum container dianggap "healthy". Ini mencegah race condition di mana
# Nginx sudah start dan menerima request padahal PHP-FPM (setelah migrasi &
# cache clear di entrypoint) belum siap -> menyebabkan 502 Bad Gateway.
HEALTHCHECK --interval=5s --timeout=3s --start-period=90s --retries=20 \
    CMD nc -z 127.0.0.1 9000 || exit 1

EXPOSE 8000

# Gunakan entrypoint script yang menunggu PostgreSQL, migrate, lalu jalankan PHP-FPM
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Default: jalankan PHP-FPM. Service lain (queue-worker, scheduler) meng-override CMD ini.
CMD ["php-fpm"]