#!/bin/bash
cd "$(dirname "$0")"

# Load local secrets if present. .env is gitignored and MUST NOT be committed.
# Copy .env.example to .env and fill in the rotated CRM token. See .env.example.
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

# CRM config. CRM_TOKEN must come from the environment or .env, never hardcoded.
export CRM_BASE_URL="${CRM_BASE_URL:-https://api-kbeauty.a3n.fr/api}"
: "${CRM_TOKEN:?CRM_TOKEN is required. Copy .env.example to .env and set the rotated CRM token, or export CRM_TOKEN.}"
export CRM_TOKEN

# Start local backend if Docker is available
if command -v docker &> /dev/null && docker info &> /dev/null; then
  : "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required. Set it in .env (see .env.example).}"
  echo "[Smart Mirror] Starting local services (PostgreSQL + API on 127.0.0.1:8100)..."
  docker compose up -d --wait 2>/dev/null || docker-compose up -d 2>/dev/null || true
  for i in $(seq 1 10); do
    curl -s http://localhost:8100/api/health > /dev/null 2>&1 && break
    sleep 1
  done
fi

# Start microscope proxy with sudo (needs tcpdump for button), app runs as normal user.
# With MICROSCOPE_SIMULE=1 (demo without hardware), the simulator serves synthetic frames instead.
if ! curl -s http://localhost:9100/ > /dev/null 2>&1; then
  if [ "${MICROSCOPE_SIMULE:-0}" = "1" ]; then
    echo "[Smart Mirror] Starting microscope simulator on 127.0.0.1:9100 (no hardware)..."
    node "$(pwd)/microscope-proxy/simulateur.js" > /tmp/microscope-proxy.log 2>&1 &
  else
    echo "[Smart Mirror] Starting microscope proxy on 127.0.0.1:9100..."
    sudo -n node "$(pwd)/microscope-proxy/proxy.js" > /tmp/microscope-proxy.log 2>&1 &
  fi
  sleep 1
fi

echo "[Smart Mirror] CRM: $CRM_BASE_URL"
echo "[Smart Mirror] Starting mirror app..."
cd mirror-app
exec npx electron-vite dev
