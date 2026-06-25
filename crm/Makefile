.PHONY: up down restart logs migrate seed test shell-back shell-front build

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose down && docker-compose up -d

build:
	docker-compose build --no-cache

logs:
	docker-compose logs -f

migrate:
	docker-compose exec backend php artisan migrate

migrate-fresh:
	docker-compose exec backend php artisan migrate:fresh --seed

seed:
	docker-compose exec backend php artisan db:seed

test:
	docker-compose exec backend php artisan test

test-coverage:
	docker-compose exec backend php artisan test --coverage

shell-back:
	docker-compose exec backend sh

shell-front:
	docker-compose exec frontend sh

shell-db:
	docker-compose exec postgres psql -U $${DB_USERNAME} -d $${DB_DATABASE}

composer-install:
	docker-compose exec backend composer install

npm-install:
	docker-compose exec frontend npm install

key-generate:
	docker-compose exec backend php artisan key:generate

queue-work:
	docker-compose exec backend php artisan queue:work

reverb-start:
	docker-compose exec reverb php artisan reverb:start --debug

# Production
up-prod:
	docker-compose -f docker-compose.prod.yml up -d

down-prod:
	docker-compose -f docker-compose.prod.yml down
