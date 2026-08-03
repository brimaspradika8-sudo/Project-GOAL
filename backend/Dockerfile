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

# Pastikan folder storage & cache bisa ditulis
RUN chmod -R 775 storage bootstrap/cache

EXPOSE 8000

# Jalankan Laravel dev server, bind ke semua interface (0.0.0.0) supaya
# bisa diakses dari luar container (bukan cuma dari dalam container itu
# sendiri, yang mana yang terjadi kalau bind ke 127.0.0.1 / localhost)
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
