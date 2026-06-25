# DreamTech - Smart Mirror K-Beauty

DreamTech Smart Mirror is a connected mirror solution designed for K-Beauty hair salons, providing scalp and hair diagnostics. The system combines a kiosk touchscreen application with a WiFi microscope (TCP 192.168.34.1:8080, JHCMD protocol, transcoded to MJPEG), a CRM backend, and an analysis service to deliver scalp capture, before/after comparisons, and downloadable PDF reports -- all while ensuring strict RGPD compliance and offline-first resilience.

---

## Etat reel (MVP) vs Cible (roadmap)

Ce depot distingue strictement ce qui est REALISE (verifiable dans le code) de ce qui est CIBLE (roadmap, non implemente).

| Brique | REALISE (MVP) | CIBLE [ROADMAP - non implemente] |
|--------|---------------|-----------------------------------|
| Backend | Mock Express (`mock-api/server.js`), API metier :8100 | Laravel 13 / PHP 8.4 + Sanctum :8000 |
| Base de donnees | PostgreSQL 15-alpine (docker-compose) | PostgreSQL 16 |
| Cache / files | Fichier JSON poll 30s (`sync.service.ts`) | Redis 7 |
| IA | Mockee, scores `Math.random` (`server.js:514-545`), service :3001 | OpenRouter (LLM vision reel) |
| Microscope | WiFi/TCP 192.168.34.1:8080 (JHCMD) -> ffmpeg H.264->MJPEG :9100 | inchange |
| Chiffrement (device) | Photos cuir chevelu (`.jpg.enc`), file de sync et tokens CHIFFRES au repos AES-256-GCM via cryptoVault (`crypto-vault.service.ts`) | Backend mock + pgcrypto + object storage chiffres ; CI audit deps bloquante |
| Tests | 42 tests unitaires Vitest + 136 e2e Playwright (178 cas) | Couverture etendue, CI bloquante |

Toute mention de Laravel, Redis, OpenRouter ou PostgreSQL 16 ci-dessous releve de la CIBLE roadmap, jamais de l'etat realise.

---

## Architecture

État réel (MVP). La cible Laravel 13 / Redis 7 / PostgreSQL 16 est documentée en roadmap, non implémentée.

```
+---------------------+            HTTP/REST          +---------------------+
|                     | <-------------------------->  |                     |
|    Mirror App       |                               |  Mock API (Express) |
|  (Electron + React) |                               |   API metier :8100  |
|                     |                               |                     |
+---------------------+                               +---------------------+
        |                                                      |
        |  HTTP :3001                                          |
        v                                                      v
+---------------------+                               +---------------------+
|                     |                               |                     |
|    IA mock          |                               |   PostgreSQL 15     |
|  (Node.js/Express)  |                               |   (docker-compose)  |
|   :3001             |                               |   :5432             |
|  scores Math.random |                               |                     |
+---------------------+                               +---------------------+

        |
        |  MJPEG :9100
        v
+---------------------+
|                     |
|  Microscope Proxy   |
|    (Node.js)        |
|  WiFi/TCP JHCMD     |
|  192.168.34.1:8080  |
|  ffmpeg -> MJPEG    |
|   :9100             |
+---------------------+
```

CIBLE roadmap (non implementee) : backend Laravel 13 / PHP 8.4 + Sanctum (:8000), PostgreSQL 16, Redis 7 (:6379), IA reelle via OpenRouter.

---

## Tech Stack

REALISE (MVP) sauf mention CIBLE explicite.

| Layer             | Technology                                                      |
|-------------------|----------------------------------------------------------------|
| Frontend          | Electron 33, React 19, TypeScript 5.7, Zustand 5               |
| Build             | electron-vite, electron-builder                                |
| UI                | Glass design, CSS custom, react-simple-keyboard               |
| Backend (CRM)     | Mock Express (`server.js`), API metier :8100                   |
| Database          | PostgreSQL 15-alpine (docker-compose)                         |
| AI Service        | Node.js, Express -- IA mockee (scores `Math.random`), :3001    |
| Microscope        | WiFi/TCP 192.168.34.1:8080 (JHCMD) -> ffmpeg H.264->MJPEG :9100 |
| PDF               | pdfkit (server-side, synchrone)                               |
| Orchestration     | Docker Compose                                                 |
| Testing           | Vitest (42 unit) + Playwright (136 e2e) = 178 cas             |
| **CIBLE roadmap** | Laravel 13 / PHP 8.4 / Sanctum, PostgreSQL 16, Redis 7, OpenRouter (LLM vision), n8n -- non implementes |

---

## Prerequisites

- **Node.js** >= 20 LTS
- **pnpm** >= 9 (or npm)
- **Docker** and **Docker Compose**
- **ffmpeg** (for the WiFi microscope proxy: H.264 -> MJPEG transcoding)
- WiFi microscope reachable at 192.168.34.1:8080 (JHCMD protocol) for capture features

---

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url> dreamtech
cd dreamtech/smart-mirror
```

### 2. Start CRM backend (PostgreSQL + mock API)

```bash
docker-compose up -d
```

This starts PostgreSQL 15 on :5432, the mock API (business endpoints) on :8100, and the IA mock on :3001.

### 3. Start the Mirror App

```bash
cd mirror-app
pnpm install
pnpm dev
```

The Electron app launches in development mode with hot-reload.

### 4. (Optional) Start the microscope proxy

```bash
cd microscope-proxy
node proxy.js
```

The proxy connects to the WiFi microscope over TCP (192.168.34.1:8080, JHCMD handshake), transcodes the H.264 stream to MJPEG via ffmpeg, and serves it at http://localhost:9100.

---

## Project Structure

```
dreamtech/
  smart-mirror/
    mirror-app/                 # Electron + React kiosk application
      src/
        main/                   # Electron main process (window, IPC, crypto-vault AES-256-GCM)
        preload/                # Preload scripts (IPC bridge)
        renderer/src/
          screens/              # 9 screens (Home, Welcome, Search, NewClient, ...)
          components/           # Shared UI (GlassCard, VirtualKeyboard, StatusBar, ...)
          stores/               # Zustand state management
          styles/               # Global CSS, glass design
    mock-api/                   # Express mock API (server.js) + PostgreSQL 15 init
    microscope-proxy/           # WiFi microscope MJPEG stream proxy
      proxy.js                  # Node.js TCP (JHCMD) -> ffmpeg H.264->MJPEG relay
      button-listener.py        # Physical button input handler
    device-setup/               # Linux device provisioning
      configs/                  # System configurations
      scripts/                  # Setup and bootstrap scripts
      systemd/                  # Service unit files
      vm/                       # QEMU/KVM test VM setup
    docker-compose.yml          # PostgreSQL + mock-api + adminer
  docs/                         # Project documentation
  figma-exports/                # UI design exports
```

---

## User Flow

1. **Home** -- Idle screen with animated background and media player (attract mode)
2. **Welcome** -- Salon branding, start session button
3. **Client Search** -- Search existing client by name or phone
4. **New Client** -- Register new client (name, phone, date of birth) via virtual keyboard
5. **RGPD Consent** -- Explicit consent for photo capture and data processing
6. **Session** -- Microscope live preview, capture photos (up to 4 zones), trigger AI analysis
7. **Before/After** -- Side-by-side comparison with previous sessions
8. **QR Code** -- Download PDF report via QR code scan (no email required)

---

## Testing

### Unit tests (Vitest)

```bash
cd smart-mirror/mirror-app
pnpm test
```

### End-to-end tests (Playwright)

```bash
cd smart-mirror/mirror-app
npx playwright test
```

42 unit tests (Vitest) + 136 e2e cases (Playwright) = 178 cases, covering API client, config, sync and crypto-vault services, navigation, store logic, and Electron E2E flows. The new `crypto-vault.service.test.ts` (7 tests) asserts that the JPEG written to disk does not start with FF D8 and that the store never holds the token in clear. Note: 4 of 9 main services are covered in unit tests; `crm-sync.service.ts` is not yet tested.

---

## License

Proprietary -- All rights reserved.

---

## Team

**DreamTech**
