#!/usr/bin/env bash
# Arrete la stack CRM locale. Ajoute -v pour supprimer aussi les volumes (DB/redis).
set -euo pipefail
cd "$(dirname "$0")"
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.local.yml"
if [ "${1:-}" = "-v" ]; then
  echo "Arret + suppression des volumes (donnees CRM effacees)..."
  $COMPOSE down -v
else
  echo "Arret des conteneurs (donnees conservees)..."
  $COMPOSE down
fi
