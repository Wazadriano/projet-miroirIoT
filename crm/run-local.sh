#!/usr/bin/env bash
# =============================================================================
# Lancement LOCAL du CRM KBeauty (vendorise) + cablage automatique du device.
# Idempotent : relançable sans tout casser. Necessite le daemon Docker demarre.
#
#   ./run-local.sh           # up + composer + migrate + seed (si vide) + provisioning
#   ./run-local.sh --fresh   # repart d'une base vierge (migrate:fresh --seed)
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")"

CRM_DIR="$(pwd)"
DEVICE_ENV="$(cd "$CRM_DIR/../smart-mirror" && pwd)/.env"
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.local.yml"
DEV_TOKEN="smartmirror-dev-token-local-do-not-use-in-prod"
API_URL="http://localhost:8000"

say() { printf '\n\033[1;36m== %s\033[0m\n' "$*"; }

# 0. Pre-requis
if ! docker info >/dev/null 2>&1; then
  echo "ERREUR : le daemon Docker n'est pas demarre. Lance : sudo systemctl start docker" >&2
  exit 1
fi

# 1. Reseau externe attendu par la compose de prod (Traefik). Cree s'il manque.
say "Reseau admin_proxy"
docker network create admin_proxy >/dev/null 2>&1 && echo "cree" || echo "deja present"

# 2. Build + demarrage de toute la stack
say "Demarrage de la stack CRM (build au 1er lancement, peut prendre quelques minutes)"
$COMPOSE up -d --build

# 3. Attendre que postgres soit healthy
say "Attente PostgreSQL"
for i in $(seq 1 60); do
  if $COMPOSE exec -T postgres pg_isready -U kbeauty -d kbeauty_crm >/dev/null 2>&1; then echo "pret"; break; fi
  sleep 2; [ "$i" = 60 ] && { echo "timeout postgres" >&2; exit 1; }
done

# 4. Dependances PHP (vendor n'est pas dans le repo ; volume monte => install au runtime)
say "composer install (backend)"
$COMPOSE exec -T backend composer install --no-interaction --prefer-dist --no-progress
# composer install tourne en root dans le conteneur : on rend storage/ et
# bootstrap/cache a www-data (php-fpm), sinon "Permission denied" sur laravel.log
# masque les vraies erreurs en HTTP 500.
$COMPOSE exec -T backend chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

# 5. Migrations + seed
if [ "${1:-}" = "--fresh" ]; then
  say "migrate:fresh --seed (base vierge)"
  $COMPOSE exec -T backend php artisan migrate:fresh --seed --force
else
  say "migrate (--force)"
  $COMPOSE exec -T backend php artisan migrate --force
  # Seed seulement si la base est vide (table boutiques)
  COUNT=$($COMPOSE exec -T backend php artisan tinker --execute='echo \App\Models\Boutique::count();' 2>/dev/null | tail -1 | tr -dc '0-9')
  if [ "${COUNT:-0}" = "0" ]; then
    say "db:seed (base vide)"; $COMPOSE exec -T backend php artisan db:seed --force
  else
    echo "donnees deja presentes ($COUNT boutiques) : seed saute"
  fi
fi

# 6. MAC du device, calcule EXACTEMENT comme le fait l'app (config.service getMacAddress)
say "Detection du MAC device"
DEVICE_MAC=$(node -e '
  const {networkInterfaces}=require("os");
  const ifs=networkInterfaces();
  for(const name in ifs){for(const i of ifs[name]){
    if(!i.internal && i.mac && i.mac!=="00:00:00:00:00:00"){console.log(i.mac.toUpperCase());process.exit(0);}
  }}
  process.exit(1);
') || { echo "Impossible de detecter le MAC (node requis)" >&2; exit 1; }
echo "MAC device = $DEVICE_MAC"

# 7. Provisionne (ou met a jour) un miroir CRM aligne sur ce MAC + token connu
say "Provisioning du miroir device dans le CRM"
$COMPOSE exec -T backend php artisan tinker --execute="
  \$b = \App\Models\Boutique::first();
  \$m = \App\Models\Miroir::updateOrCreate(
    ['adresse_mac' => '$DEVICE_MAC'],
    ['boutique_id' => \$b->id, 'token_device' => '$DEV_TOKEN', 'nom' => 'Miroir Device (dev local)', 'version_app' => 'dev']
  );
  echo 'miroir='.\$m->nom.' boutique='.\$b->nom;
"

# 8. Cablage du device : pointer CRM_BASE_URL + CRM_TOKEN vers ce CRM local
say "Cablage du device ($DEVICE_ENV)"
touch "$DEVICE_ENV"
grep -vE '^CRM_BASE_URL=|^CRM_TOKEN=' "$DEVICE_ENV" > "$DEVICE_ENV.tmp" || true
{
  cat "$DEVICE_ENV.tmp"
  echo "CRM_BASE_URL=$API_URL/api"
  echo "CRM_TOKEN=$DEV_TOKEN"
} > "$DEVICE_ENV"
rm -f "$DEVICE_ENV.tmp"
echo "CRM_BASE_URL=$API_URL/api"
echo "CRM_TOKEN=<<defini>>"

# 9. Test de bout en bout : le device s'authentifierait-il ?
say "Test /api/miroir/auth"
HTTP=$(curl -s -o /tmp/crm-auth.json -w '%{http_code}' --max-time 15 \
  -X POST "$API_URL/api/miroir/auth" \
  -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -d "{\"adresse_mac\":\"$DEVICE_MAC\",\"token_device\":\"$DEV_TOKEN\"}")
if [ "$HTTP" = "200" ]; then
  echo "OK (HTTP 200) -- le device peut se connecter au CRM."
  node -e 'const r=require("/tmp/crm-auth.json");console.log("  miroir:",r.miroir?.nom,"| bearer recu:",r.token?"oui":"non","| produits:",(r.produits||[]).length)'
else
  echo "ECHEC (HTTP $HTTP). Reponse :"; cat /tmp/crm-auth.json; echo; exit 1
fi

say "Termine"
cat <<EOF
CRM local operationnel :
  - API        : $API_URL/api      (device -> CRM_BASE_URL)
  - Dashboard  : http://localhost:3000   (login: admin@kbeauty.fr / password)
  - IA service : http://localhost:3002
Le device (smart-mirror) est cable : lance-le avec 'npm run dev' dans smart-mirror/mirror-app.
Pour tout arreter : ./stop-local.sh
EOF
