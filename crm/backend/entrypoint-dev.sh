#!/bin/sh
# Startup script for dev container (volumes override image, run setup at runtime)
php artisan storage:link --force 2>/dev/null || true
exec php-fpm
