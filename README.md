# DreamTech - Smart Mirror K-Beauty

DreamTech Smart Mirror is a connected mirror solution designed for K-Beauty hair salons, providing AI-powered scalp and hair diagnostics. The system combines a kiosk touchscreen application with a USB microscope (Ninyoon 4K, x50-x200 magnification), a multi-tenant CRM backend, and an AI microservice to deliver real-time scalp analysis, before/after comparisons, and downloadable PDF reports -- all while ensuring strict RGPD compliance and offline-first resilience.

---

## Architecture

```
+---------------------+          HTTPS/REST          +---------------------+
|                     | <-------------------------->  |                     |
|    Mirror App       |                               |    CRM Backend      |
|  (Electron + React) |          WebSocket            |  (Laravel + PHP)    |
|   localhost:5173    | <-------------------------->  |   :8000             |
|                     |                               |                     |
+---------------------+                               +---------------------+
        |                                                      |
        |  HTTP :3002                                          |
        v                                                      v
+---------------------+                               +---------------------+
|                     |                               |                     |
|    IA Service       |                               |    PostgreSQL 16    |
|  (Node.js/Express)  |                               |    + Redis 7        |
|   :3002             |                               |    :5432 / :6379    |
|                     |                               |                     |
+---------------------+                               +---------------------+

        |
        |  MJPEG :9100
        v
+---------------------+
|                     |
|  Microscope Proxy   |
| (Node.js + Python)  |
|  USB UVC -> MJPEG   |
|   :9100             |
|                     |
+---------------------+
```

---

## Tech Stack

| Layer             | Technology                                        |
|-------------------|---------------------------------------------------|
| Frontend          | Electron 33, React 19, TypeScript 5.7, Zustand 5  |
| Build             | electron-vite, electron-builder                    |
| UI                | Glass design, CSS custom, react-simple-keyboard    |
| Backend (CRM)     | Laravel 13, PHP 8.4, Sanctum                       |
| Database          | PostgreSQL 16, Redis 7                             |
| AI Service        | Node.js, Express, GitHub Models API                |
| AI Models         | Llama 3.2 -> Phi 3.5 -> GPT-4o mini (fallback)    |
| Microscope        | Ninyoon 4K USB UVC, MJPEG via Python/Node proxy    |
| PDF               | DomPDF (server-side)                               |
| Orchestration     | Docker Compose, N8N                                |
| Testing           | Vitest (unit), Playwright (E2E), 65+ tests         |

---

## Prerequisites

- **Node.js** >= 20 LTS
- **pnpm** >= 9 (or npm)
- **Docker** and **Docker Compose**
- **Python 3** (for microscope proxy)
- USB microscope (Ninyoon 4K) for capture features

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

This starts PostgreSQL on :5432, the mock API on :8000, and the IA mock on :3002.

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
python3 stream.py &
node proxy.js
```

MJPEG stream available at http://localhost:9100.

---

## Project Structure

```
dreamtech/
  smart-mirror/
    mirror-app/                 # Electron + React kiosk application
      src/
        main/                   # Electron main process (window, IPC, safeStorage)
        preload/                # Preload scripts (IPC bridge)
        renderer/src/
          screens/              # 9 screens (Home, Welcome, Search, NewClient, ...)
          components/           # Shared UI (GlassCard, VirtualKeyboard, StatusBar, ...)
          stores/               # Zustand state management
          styles/               # Global CSS, glass design
    mock-api/                   # Express mock API (dev) + PostgreSQL init
    microscope-proxy/           # USB microscope MJPEG stream proxy
      stream.py                 # Python V4L2 capture
      proxy.js                  # Node.js HTTP relay
      button-listener.py        # Physical button input handler
    device-setup/               # Linux device provisioning
      configs/                  # System configurations
      scripts/                  # Setup and bootstrap scripts
      systemd/                  # Service unit files
      udev/                     # USB device rules
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

65+ tests covering component rendering, navigation, store logic, and E2E flows.

---

## License

Proprietary -- All rights reserved.

---

## Team

**DreamTech**
