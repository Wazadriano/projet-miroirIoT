#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "[Smart Mirror] Starting local services (PostgreSQL + API)..."
docker compose up -d --wait 2>/dev/null || docker-compose up -d 2>/dev/null

echo "[Smart Mirror] Waiting for API health check..."
for i in $(seq 1 15); do
  if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "[Smart Mirror] Local API ready."
    break
  fi
  sleep 1
done

echo "[Smart Mirror] Starting mirror app..."
cd mirror-app
exec npx electron-vite dev
