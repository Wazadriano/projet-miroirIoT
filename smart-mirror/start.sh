#!/bin/bash
cd "$(dirname "$0")"

# CRM config
export CRM_BASE_URL="${CRM_BASE_URL:-https://api-kbeauty.a3n.fr/api}"
export CRM_TOKEN="${CRM_TOKEN:-CHANGEME_SET_VIA_ENV}"

# Start local backend (PostgreSQL + mock-api on port 8100) if Docker is available
if command -v docker &> /dev/null && docker info &> /dev/null; then
  echo "[Smart Mirror] Starting local services (PostgreSQL + API on :8100)..."
  docker compose up -d --wait 2>/dev/null || docker-compose up -d 2>/dev/null || true

  echo "[Smart Mirror] Waiting for local API..."
  for i in $(seq 1 10); do
    curl -s http://localhost:8100/api/health > /dev/null 2>&1 && break
    sleep 1
  done
else
  echo "[Smart Mirror] Docker not available -- running without local backend."
fi

# Start microscope proxy if not already running (needs sudo for button capture via tcpdump)
if ! curl -s http://localhost:9100/ > /dev/null 2>&1; then
  echo "[Smart Mirror] Starting microscope proxy on :9100 (sudo for button capture)..."
  cd microscope-proxy
  sudo -n node proxy.js > /tmp/microscope-proxy.log 2>&1 &
  cd ..
  sleep 1
  echo "[Smart Mirror] Microscope proxy started (log: /tmp/microscope-proxy.log)"
else
  echo "[Smart Mirror] Microscope proxy already running."
fi

echo "[Smart Mirror] CRM: $CRM_BASE_URL"
echo "[Smart Mirror] Starting mirror app..."
cd mirror-app
exec npx electron-vite dev
