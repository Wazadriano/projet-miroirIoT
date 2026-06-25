FROM php:8.4-cli-alpine

RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    linux-headers \
    $PHPIZE_DEPS \
    && docker-php-ext-install pdo pdo_pgsql zip pcntl \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del $PHPIZE_DEPS linux-headers

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
RUN printf 'upload_max_filesize=200M\npost_max_size=210M\nmemory_limit=256M\nmax_execution_time=120\nopcache.enable=1\nopcache.enable_cli=1\nopcache.memory_consumption=128\nopcache.interned_strings_buffer=8\nopcache.max_accelerated_files=4000\nopcache.validate_timestamps=1\n' > /usr/local/etc/php/conf.d/upload.ini

WORKDIR /var/www/html

EXPOSE 8000

ENV PHP_CLI_SERVER_WORKERS=4

CMD ["sh", "-c", "php artisan config:cache && php artisan route:cache && php artisan event:cache && php artisan serve --host=0.0.0.0 --port=8000 --no-reload"]
