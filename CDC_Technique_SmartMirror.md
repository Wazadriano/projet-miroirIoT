# CDC Technique — Smart Mirror

**K Beauty Cosmetics / Bubble Hair Spa**
Version 1.0 — Mars 2026
Equipe DreamTech

*Document de reference pour l'implementation. A lire conjointement avec le CDC Fonctionnel (CDC_DreamTech.md).*

---

## 1. Architecture Globale

### 1.1 Vue Containers

```
                          +---------------------+
                          |   Shopify (externe)  |
                          |   API Products/CRM   |
                          +----------+----------+
                                     |
                                     | REST API
                                     v
+------------------+       +-------------------+       +--------------------+
|  Miroir (Device) | <---> |   API Backend     | <---> | Panel de Controle  |
|  Electron/Linux  |  WS   |   Bun + Hono      |  REST |  React + Tailwind  |
|  Raspberry Pi 5  |  REST |   Docker/Railway   |       |  Vercel            |
+------------------+       +--------+----------+       +--------------------+
                                    |
                           +--------+----------+
                           |    Supabase        |
                           |  PostgreSQL + RLS  |
                           |  Auth + Storage    |
                           +-------------------+
                                    |
                           +--------+----------+
                           |   OpenRouter API   |
                           |   Vision LLM       |
                           +-------------------+
```

### 1.2 Flux de donnees

```
Miroir                    API                     Supabase              OpenRouter
  |                        |                        |                      |
  |-- device:online ------>|                        |                      |
  |-- POST /sessions ----->|-- INSERT session ----->|                      |
  |-- snapshot (JPEG) ---->|-- upload Storage ----->|                      |
  |                        |-- POST /chat/compl --->|                      |
  |                        |<-- JSON diagnostic ----|                      |
  |<-- diagnosis result ---|                        |                      |
  |-- session:ended ------>|-- UPDATE session ----->|                      |
  |                        |-- generate PDF ------->|                      |
  |<-- QR code URL --------|                        |                      |
```

### 1.3 Principes architecturaux

| Principe | Description |
|----------|-------------|
| **Offline-first** | Le miroir fonctionne sans internet (flux video local, cache media, buffer snapshots) |
| **Multi-tenant** | Isolation par RLS Supabase — un tenant ne voit jamais les donnees d'un autre |
| **Stateless API** | Pas d'etat serveur — JWT + Supabase gere tout l'etat |
| **Single source of truth** | Supabase PostgreSQL est la source unique. Le cache device est ephemere |
| **Cross-architecture** | Tout le code tourne sur ARM64 (Pi) ET x86-64 (dev/prod) |
| **Fail visible** | Chaque erreur hardware ou reseau a une representation visuelle dans l'UI |

---

## 2. Structure Monorepo

```
dreamtech/
  packages/
    api/                    # Backend Bun + Hono
      src/
        routes/             # Groupes d'endpoints
        middleware/          # Auth, tenant-scope, validation
        services/           # Logique metier
        ws/                 # WebSocket handlers
        db/
          schema/           # Drizzle schema definitions
          migrations/       # SQL migration files
          seed/             # Seed data (dev)
        ai/                 # OpenRouter integration
          prompts/          # Prompt versions (scalp-analysis-v{N}.md)
        lib/                # Utilitaires partages
      Dockerfile
      bun.lock

    mirror-app/             # Electron + React
      src/
        main/               # Main process (Electron)
          services/          # WiFi, microscope, API client, config
          ipc/               # IPC handlers (typed)
        renderer/            # React app
          pages/             # Ecrans (Home, Search, Consent, Stream, Compare, QR)
          components/        # Composants reutilisables
          hooks/             # Custom hooks (useStream, useOffline, useWS)
          stores/            # State management (Zustand)
        preload/             # Preload scripts (contextBridge)
      electron.vite.config.ts
      electron-builder.yml

    control-panel/          # React web (Panel tenant)
      src/
        pages/              # Statut, Medias, Produits, Config, Export
        components/
        hooks/
        api/                # API client + WebSocket client
      vite.config.ts

    shared/                 # Types partages entre packages
      types/
        api.ts              # Types endpoints (request/response)
        ws.ts               # Types WebSocket events
        db.ts               # Types entites DB
        ai.ts               # Types diagnostic IA
      constants/
        categories.ts       # Categories d'analyse capillaire
        errors.ts           # Codes d'erreur structures

  scripts/
    setup-pi.sh             # Script provisioning Raspberry Pi
    build-device.sh         # Cross-build ARM64 + x86-64
    seed-db.sh              # Seed Supabase dev

  .github/
    workflows/
      ci.yml                # Test + build sur PR
      deploy-api.yml        # Deploy API sur Railway
      deploy-panel.yml      # Deploy Panel sur Vercel
      build-device.yml      # Build Electron ARM64 + x86-64

  supabase/
    migrations/             # SQL migrations (drizzle-kit)
    seed.sql                # Seed data

  docs/
    architecture.md         # Ce document
    api-reference.md        # Reference API auto-generee
    deployment-guide.md     # Guide de deploiement
    practitioner-guide.md   # Guide praticien (utilisation miroir)
```

### 2.1 Gestion des dependances

| Package | Runtime | Package manager |
|---------|---------|-----------------|
| api | Bun | bun |
| mirror-app | Node (Electron) | npm |
| control-panel | Node (Vite) | npm |
| shared | - | typescript (compile) |

Le package `shared` est reference via TypeScript path aliases dans chaque package.

### 2.2 Versions cibles

| Outil | Version |
|-------|---------|
| Bun | >= 1.1 |
| Node | >= 20 LTS (Electron) |
| Electron | >= 30 LTS |
| React | 19 |
| TypeScript | >= 5.4 |
| Drizzle ORM | >= 0.36 |
| Hono | >= 4 |
| Tailwind CSS | 4 |
| Vite | >= 6 |
| electron-vite | >= 2 |

---

## 3. Device — Application Miroir

### 3.1 Systeme d'exploitation & Boot

```
Distribution  : Raspberry Pi OS Lite 64-bit (Debian 12 Bookworm, headless)
Kernel        : 6.x aarch64
Serveur X     : X11 minimal (xorg, xinit)
WM            : Openbox (config minimale, pas de decorations)
Auto-login    : utilisateur dedie `mirror`
Service app   : systemd smart-mirror.service
SSH           : actif, port 2222, cle uniquement (PasswordAuthentication no)
Updates OS    : unattended-upgrades (security only)
Swap          : desactive (preserve la microSD, force le respect du budget RAM)
```

**Service systemd :**

```ini
# /etc/systemd/system/smart-mirror.service
[Unit]
Description=Smart Mirror Electron App
After=graphical-session.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=mirror
Environment=DISPLAY=:0
Environment=ELECTRON_NO_ASAR=1
ExecStart=/usr/bin/electron /opt/smart-mirror/app --kiosk --no-sandbox --disable-infobars --disable-notifications --hide-crash-restore-bubble --disable-pinch --overscroll-history-navigation=0
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=graphical-session.target
```

**Sequence de boot cible :**

```
power on
  → systemd init
    → network-online.target (nmcli connexion WiFi)
    → X11 (xinit sur tty1)
    → Openbox (WM minimal)
    → smart-mirror.service
      → Electron kiosk fullscreen
        → Si config absente → mode provisioning
        → Si config presente → mode normal
```

**Temps de boot cible :** < 30 secondes de power-on a l'ecran d'accueil Electron.

### 3.2 Architecture Electron

```
Main Process (Node.js)
├── app.ts                    # Lifecycle Electron (ready, window-all-closed, activate)
├── window.ts                 # BrowserWindow creation (kiosk flags)
├── ipc/
│   ├── handlers.ts           # Registration de tous les IPC handlers
│   ├── microscope.ipc.ts     # IPC: start-stream, stop-stream, capture-snapshot
│   ├── wifi.ipc.ts           # IPC: get-status, scan-networks, connect, get-signal
│   ├── config.ipc.ts         # IPC: get-config, set-config, get-device-id
│   ├── api.ipc.ts            # IPC: fetch-wrapper (proxy API calls from renderer)
│   └── system.ipc.ts         # IPC: get-system-info, restart-app, get-logs
├── services/
│   ├── microscope.service.ts # Detection V4L2, hot-plug udev, device enumeration
│   ├── wifi.service.ts       # nmcli wrapper (connect, scan, signal, status)
│   ├── api-client.service.ts # HTTP client vers backend + WebSocket connection
│   ├── config.service.ts     # electron-store (read/write, safeStorage encryption)
│   ├── media-cache.service.ts# Sync et cache local des medias (/var/smart-mirror/media/)
│   └── updater.service.ts    # electron-updater (check, download, install)
└── preload/
    └── preload.ts            # contextBridge — expose API securisee au renderer

Renderer (React + TypeScript)
├── App.tsx                   # Router principal
├── pages/
│   ├── HomePage.tsx          # Ecran accueil/veille (logo, recherche client)
│   ├── SearchClientPage.tsx  # Recherche client (nom, email, tel)
│   ├── NewClientPage.tsx     # Creation fiche client
│   ├── ConsentPage.tsx       # Ecran consentement RGPD
│   ├── SessionPage.tsx       # Ecran principal seance (stream + IA + produits)
│   ├── ComparePage.tsx       # Comparaison avant/apres
│   ├── QRCodePage.tsx        # QR code grand format
│   └── ProvisioningPage.tsx  # Config WiFi first boot
├── components/
│   ├── VideoStream.tsx       # Composant flux microscope (getUserMedia / fallback)
│   ├── SnapshotGallery.tsx   # Galerie des captures de la seance
│   ├── DiagnosisCard.tsx     # Resultat IA pour un snapshot
│   ├── ProductCard.tsx       # Produit recommande (image, nom, lien)
│   ├── MediaPlayer.tsx       # Player medias promotionnels (video/image, boucle)
│   ├── AnimatedBackground.tsx# Fond anime tsParticles
│   ├── StatusBar.tsx         # Barre statut (WiFi, API, heure, logo)
│   ├── ConsentForm.tsx       # Formulaire consentement
│   └── OfflineIndicator.tsx  # Indicateur mode degrade
├── hooks/
│   ├── useStream.ts          # Hook gestion flux video microscope
│   ├── useOffline.ts         # Hook detection mode offline
│   ├── useWebSocket.ts       # Hook connexion WebSocket backend
│   └── useSession.ts         # Hook gestion etat seance en cours
└── stores/
    ├── sessionStore.ts       # Zustand — etat seance (client, snapshots, diagnostics)
    ├── deviceStore.ts        # Zustand — etat device (online, microscope, wifi)
    └── mediaStore.ts         # Zustand — playlist medias, mode affichage
```

### 3.3 IPC Channels (types)

```typescript
// shared/types/ipc.ts

// Microscope
type MicroscopeIPC = {
  'microscope:detect': () => MicroscopeDevice | null;
  'microscope:get-capabilities': (deviceId: string) => V4L2Capabilities;
  'microscope:start-stream': (deviceId: string) => { success: boolean };
  'microscope:stop-stream': () => void;
  'microscope:capture-snapshot': () => { blob: ArrayBuffer; timestamp: number };
  'microscope:on-connect': (callback: (device: MicroscopeDevice) => void) => void;
  'microscope:on-disconnect': (callback: () => void) => void;
};

// WiFi
type WiFiIPC = {
  'wifi:status': () => WiFiStatus;
  'wifi:scan': () => WiFiNetwork[];
  'wifi:connect': (ssid: string, password: string) => { success: boolean; error?: string };
  'wifi:signal-strength': () => number; // dBm
};

// Config
type ConfigIPC = {
  'config:get': <K extends keyof DeviceConfig>(key: K) => DeviceConfig[K];
  'config:set': <K extends keyof DeviceConfig>(key: K, value: DeviceConfig[K]) => void;
  'config:get-all': () => DeviceConfig;
  'config:is-provisioned': () => boolean;
};

// API Proxy
type ApiIPC = {
  'api:fetch': (path: string, options: RequestInit) => Response;
  'api:upload-snapshot': (blob: ArrayBuffer, sessionId: string, phase: 'before' | 'after') => { url: string; snapshotId: string };
  'api:ws-send': (event: string, data: unknown) => void;
  'api:ws-on': (event: string, callback: (data: unknown) => void) => void;
};

// System
type SystemIPC = {
  'system:info': () => SystemInfo;
  'system:restart': () => void;
  'system:logs': (lines: number) => string[];
  'system:check-update': () => UpdateInfo | null;
  'system:install-update': () => void;
};
```

### 3.4 Pipeline Video Microscope

**Detection et identification :**

```typescript
// Scan /dev/video* au demarrage et sur event udev
// Identifier le microscope par:
//   1. Vendor ID USB (Jiusion: a surveiller apres reception hardware)
//   2. V4L2 capabilities (resolution 1920x1080+, formats MJPEG/YUYV)
//   3. Device name contenant "microscope" ou "Jiusion" (fallback)

interface MicroscopeDevice {
  devicePath: string;       // /dev/video0
  vendorId: string;         // USB vendor ID
  productId: string;        // USB product ID
  name: string;             // V4L2 device name
  capabilities: {
    resolutions: Resolution[];  // ex: [1920x1080, 3840x2160]
    formats: string[];          // ex: ['MJPEG', 'YUYV']
    frameRates: number[];       // ex: [30, 15]
  };
}
```

**Pipeline prioritaire — getUserMedia (UVC) :**

```typescript
// Renderer — composant VideoStream
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    deviceId: { exact: microscopeDeviceId },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 }
  }
});

videoRef.current.srcObject = stream;
```

**Capture snapshot :**

```typescript
function captureSnapshot(video: HTMLVideoElement): Blob {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.92);
  });
}

// Upload async — non bloquant pour le stream
async function uploadSnapshot(blob: Blob, sessionId: string, phase: 'before' | 'after') {
  try {
    const result = await window.electronAPI.uploadSnapshot(blob, sessionId, phase);
    return result;
  } catch (err) {
    // Offline: buffer localement
    await bufferLocally(blob, sessionId, phase);
  }
}
```

**Fallback GStreamer (si USB non-UVC) :**

```bash
# Pipeline GStreamer -> WebSocket -> Canvas dans le renderer
gst-launch-1.0 v4l2src device=/dev/video0 \
  ! image/jpeg,width=1920,height=1080,framerate=30/1 \
  ! jpegdec ! videoconvert \
  ! jpegenc quality=85 \
  ! tcpserversink host=127.0.0.1 port=9000
```

Le renderer se connecte en TCP localhost et affiche via Canvas. Latence: 100-200ms.

**Fallback MJPEG HTTP (microscope WiFi) :**

```html
<!-- Dernier recours — microscope WiFi avec hotspot propre -->
<img src="http://192.168.1.1:8080/stream" alt="microscope" />
```

Latence: 200-400ms. Necessite double WiFi.

**Gestion deconnexion :**

```
USB unplug
  → udev event
    → Main Process detecte disparition /dev/videoX
      → IPC 'microscope:on-disconnect' → Renderer
        → Overlay "Microscope deconnecte — reconnectez l'appareil"
        → Stream arrete proprement

USB replug
  → udev event
    → Main Process detecte nouveau /dev/videoX
      → Verification V4L2 capabilities
        → IPC 'microscope:on-connect' → Renderer
          → Overlay disparait
          → Stream redemarre automatiquement
```

### 3.5 WiFi & Provisioning

**Mode provisioning (first boot) :**

```
Condition: electron-store vide (pas de device.id ni device.token)

1. Main Process detecte config absente
2. Demarre hostapd + dnsmasq:
   - SSID: "SmartMirror-Setup-{4 derniers chars MAC}"
   - IP device: 192.168.4.1
   - DHCP range: 192.168.4.10-50
3. Ouvre BrowserWindow NON-kiosk (permet fermeture si besoin)
4. Affiche ProvisioningPage.tsx:
   - Champ SSID boutique
   - Champ mot de passe WiFi
   - Champ Tenant ID (fourni par admin)
   - Bouton "Connecter"
5. Au submit:
   a. Stop hostapd/dnsmasq
   b. nmcli device wifi connect "{ssid}" password "{password}"
   c. Timeout 15s — si echec: reaffiche formulaire avec erreur
   d. Si succes: ping API backend (GET /health)
   e. POST /auth/device/register { tenantId, macAddress, hostname }
   f. Reponse: { deviceId, token }
   g. Sauvegarde electron-store (safeStorage encrypted)
   h. Redemarrage smart-mirror.service (systemctl restart)
   i. Boot en mode normal (kiosk)
```

**Gestion reseau runtime :**

```typescript
// WiFi service — monitoring continu
class WiFiService {
  private checkInterval = 30_000; // 30s

  async monitor() {
    setInterval(async () => {
      const status = await this.getStatus();
      if (!status.connected) {
        await this.reconnect();
      }
      this.emit('wifi:status', status);
    }, this.checkInterval);
  }

  async getStatus(): Promise<WiFiStatus> {
    // nmcli -t -f GENERAL,WIFI device show wlan0
    const signal = await exec('nmcli -t -f SIGNAL device wifi list --rescan no');
    const connected = await exec('nmcli -t -f STATE general');
    return { connected: connected.includes('connected'), signal: parseInt(signal) };
  }

  async reconnect() {
    // nmcli device wifi connect "{saved_ssid}" --wait 10
    await exec(`nmcli device wifi connect "${this.savedSSID}" --wait 10`);
  }
}
```

### 3.6 Media Player & Cache

**Sync medias :**

```
Au demarrage de l'app:
  1. GET /media/playlist/{tenantId}
     Reponse: [{ id, type, checksum, url_signed, display_order }]
  2. Comparer checksums avec fichiers locaux dans /var/smart-mirror/media/
  3. Fichiers nouveaux/modifies: telecharger en background (stream vers disque)
  4. Fichiers supprimes du serveur: supprimer localement
  5. Lecture TOUJOURS depuis le cache local

Sur event WebSocket 'media:update':
  → Re-executer la sync immediatement

Cache:
  - Chemin: /var/smart-mirror/media/
  - Taille max: 2 GB (configurable par tenant via Panel)
  - Strategie si plein: supprimer les medias les plus anciens non actifs
  - Index local: media-index.json (id, checksum, localPath, lastUsed)
```

**Modes d'affichage :**

```typescript
type DisplayMode = 'fullscreen' | 'side_panel' | 'hidden';

// fullscreen: media occupe tout l'ecran, stream en overlay coin superieur droit
// side_panel: media dans panneau 1/3 droit, stream sur 2/3 gauche
// hidden: pas de media, stream occupe tout

// Commande en temps reel depuis Panel via WebSocket:
// server → device: { event: 'display:mode', data: { mode: 'fullscreen' } }
```

**Fond anime :**

```typescript
// tsParticles — ~40kb tree-shaked
// Themes: 'particles' (defaut), 'waves', 'aurora'
// Toujours en layer z-index 0 (derriere tout)
// requestAnimationFrame suspendu quand video fullscreen en lecture
// Configurable depuis Panel: on/off + choix theme
// Transition: opacity CSS 500ms
```

### 3.7 Ecrans & Navigation

```
[HomePage]
  |
  ├──→ [SearchClientPage] ──→ select client ──→ [ConsentPage]
  |                           |
  |                           └──→ [NewClientPage] ──→ [ConsentPage]
  |
  └──→ [ProvisioningPage] (si non configure)

[ConsentPage]
  |
  └──→ consent valide ──→ [SessionPage]

[SessionPage]
  |
  ├──→ captures avant-soin + diagnostics IA
  ├──→ (soin en cours — flux video affiche)
  ├──→ captures apres-soin + diagnostics IA
  |
  └──→ fin de seance ──→ [ComparePage]

[ComparePage]
  |
  └──→ generer rapport ──→ [QRCodePage]

[QRCodePage]
  |
  └──→ retour accueil ──→ [HomePage]
```

**Specifications ecrans :**

| Ecran | Interactions tactiles | Elements cles |
|-------|----------------------|---------------|
| **HomePage** | Bouton "Rechercher client", bouton "Nouvelle seance" | Logo K Beauty centre, fond anime, medias en boucle |
| **SearchClientPage** | Clavier virtuel, tap sur resultat | Champ recherche (nom/email/tel), liste resultats, bouton "Nouveau" |
| **NewClientPage** | Clavier virtuel, boutons validation | Formulaire: prenom, nom, email (opt), tel (opt), age, sexe |
| **ConsentPage** | Grande checkbox, bouton "Accepter" | Texte consent court, checkbox "J'accepte", horodatage auto |
| **SessionPage** | Bouton capture, scroll produits | Stream centre, bouton capture photo, resultats IA a droite, produits recommandes |
| **ComparePage** | Swipe/tap avant-apres | Deux colonnes: avant a gauche, apres a droite, diagnostics differentiels |
| **QRCodePage** | Aucune (client scanne avec son tel) | QR code grande taille (min 200x200px), texte instruction, timer retour accueil |

**Zones tactiles :** minimum 48x48px. Pas de gestes complexes (le praticien a les mains occupees).

### 3.8 Config locale (electron-store)

```typescript
interface DeviceConfig {
  device: {
    id: string;             // UUID attribue au provisioning
    tenantId: string;       // UUID du tenant
    token: string;          // JWT device (chiffre safeStorage)
  };
  api: {
    baseUrl: string;        // https://api.smartmirror.example.com
    wsUrl: string;          // wss://api.smartmirror.example.com/ws
  };
  microscope: {
    devicePath: string;     // /dev/video0 (auto-detect)
    resolution: string;     // "1920x1080"
    format: string;         // "MJPEG"
  };
  display: {
    animatedBgEnabled: boolean;
    animatedBgTheme: 'particles' | 'waves' | 'aurora';
    mediaMode: DisplayMode;
    volume: number;         // 0-100
  };
  network: {
    ssid: string;           // SSID boutique sauvegarde
  };
  cache: {
    mediaMaxSizeMB: number; // 2048 par defaut
    snapshotBufferPath: string; // /var/smart-mirror/buffer/
  };
}
```

Tout le champ `device.token` est chiffre via `safeStorage.encryptString()` d'Electron.

### 3.9 Cross-build & OTA

**electron-builder.yml :**

```yaml
appId: com.dreamtech.smartmirror
productName: SmartMirror
directories:
  output: dist

linux:
  target:
    - target: deb
      arch:
        - arm64
        - x64
    - target: AppImage
      arch:
        - arm64
        - x64
  category: Utility
  maintainer: DreamTech

publish:
  provider: github
  owner: Wazadriano
  repo: dreamtech
```

**OTA Updates :**

```typescript
// Main process — verification au demarrage + toutes les 6h
import { autoUpdater } from 'electron-updater';

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Check au demarrage (apres 30s pour laisser l'app se stabiliser)
setTimeout(() => autoUpdater.checkForUpdates(), 30_000);

// Check periodique
setInterval(() => autoUpdater.checkForUpdates(), 6 * 60 * 60 * 1000);

// Sur update disponible: telecharge en background
// Sur update telecharge: installe au prochain redemarrage
// Jamais de redemarrage force pendant une seance active
```

**Rollback :** Si l'app ne demarre pas 3 fois consecutives (systemd Restart=always + StartLimitBurst=3), le service passe en failed. Un watchdog script restaure le dernier .deb fonctionnel depuis `/opt/smart-mirror/rollback/`.

---

## 4. Backend API

### 4.1 Stack

```
Runtime     : Bun >= 1.1
Framework   : Hono >= 4
Validation  : Zod >= 3.23
Auth        : JWT custom (jose library)
ORM         : Drizzle ORM >= 0.36 (PostgreSQL driver)
DB          : Supabase PostgreSQL (connection pooling via PgBouncer)
Storage     : Supabase Storage (S3-compatible)
WebSocket   : Bun.serve native WebSocket
PDF         : @react-pdf/renderer (server-side)
QR          : qrcode (npm)
Deploy      : Docker → Railway (EU region)
```

### 4.2 Structure API

```
src/
├── index.ts                 # Bun.serve — HTTP + WebSocket
├── app.ts                   # Hono app — route registration
├── routes/
│   ├── auth.routes.ts       # /auth/*
│   ├── device.routes.ts     # /devices/*
│   ├── session.routes.ts    # /sessions/*
│   ├── client.routes.ts     # /clients/*
│   ├── media.routes.ts      # /media/*
│   ├── product.routes.ts    # /products/*
│   ├── report.routes.ts     # /reports/*
│   └── health.routes.ts     # /health
├── middleware/
│   ├── auth.middleware.ts    # JWT verification + role extraction
│   ├── tenant.middleware.ts  # Set app.tenant_id pour RLS
│   ├── validate.middleware.ts# Zod validation wrapper
│   ├── cors.middleware.ts    # CORS config
│   └── logger.middleware.ts  # Request logging
├── services/
│   ├── auth.service.ts      # JWT sign/verify, token rotation
│   ├── session.service.ts   # Logique sessions (create, end, snapshots)
│   ├── client.service.ts    # CRUD clients, search, upsert
│   ├── ai.service.ts        # OpenRouter integration
│   ├── report.service.ts    # PDF generation, QR code
│   ├── media.service.ts     # Upload, playlist, sync
│   ├── product.service.ts   # CRUD produits, Shopify sync
│   └── shopify.service.ts   # Shopify API client
├── ws/
│   ├── handler.ts           # WebSocket upgrade + routing
│   ├── events.ts            # Event type definitions
│   └── connections.ts       # Connection registry (deviceId → ws)
├── db/
│   ├── client.ts            # Drizzle client + connection
│   ├── schema/              # (voir section 5)
│   └── migrations/
├── ai/
│   ├── openrouter.ts        # OpenRouter API client
│   ├── prompts/
│   │   └── scalp-analysis-v1.md  # Prompt systeme v1
│   ├── categories.ts        # Definitions categories
│   └── validator.ts         # Validation output LLM
└── lib/
    ├── errors.ts            # AppError class + error codes
    ├── env.ts               # Environment variables (typed)
    └── supabase.ts          # Supabase client (storage, auth admin)
```

### 4.3 Endpoints complets

#### Auth

```
POST /auth/device/register
  Body: { tenantId: uuid, macAddress: string, hostname: string }
  Response 201: { deviceId: uuid, token: string, refreshToken: string }
  Errors: 400 (missing fields), 404 (tenant not found), 409 (device already registered)

POST /auth/device/refresh
  Headers: Authorization: Bearer {refreshToken}
  Response 200: { token: string, refreshToken: string }
  Errors: 401 (invalid/expired token)

POST /auth/login
  Body: { email: string, password: string }
  Response 200: { token: string, user: { id, role, tenantId } }
  Note: Supabase Auth — tenant_admin et super_admin uniquement
```

#### Devices

```
GET /devices/:id/status
  Auth: tenant_admin | super_admin
  Response 200: { id, tenantId, name, isOnline, lastSeen, firmwareVersion, activeSessionId?, wifiSignal }

POST /devices/:id/command
  Auth: tenant_admin | super_admin
  Body: { command: string, data: object }
  Commands: 'media:update' | 'display:mode' | 'display:animatedbg' | 'products:update' | 'volume:set' | 'app:restart' | 'provisioning:reconfigure'
  Response 200: { sent: true }
  Note: Relaye la commande via WebSocket au device connecte
```

#### Sessions

```
POST /sessions
  Auth: device
  Body: { clientId: uuid, consentId: uuid }
  Response 201: { id: uuid, startedAt: datetime }
  Validation: consentement RGPD valide pour ce client (RG-001)

PATCH /sessions/:id
  Auth: device
  Body: { notes?: string, productsUsed?: uuid[] }
  Response 200: { updated: true }

POST /sessions/:id/snapshots
  Auth: device
  Content-Type: multipart/form-data
  Body: { image: File (JPEG, max 10MB), phase: 'before' | 'after' }
  Process:
    1. Upload image → Supabase Storage (bucket: snapshots/{tenantId}/{sessionId}/)
    2. Appel OpenRouter AI (image + catalogue produits + historique client)
    3. Validation JSON diagnostic
    4. INSERT snapshot + diagnostic en DB
  Response 201: {
    snapshotId: uuid,
    storageUrl: string,
    diagnosis: DiagnosisResult
  }
  Errors: 400 (image invalide), 413 (trop gros), 503 (AI unavailable → retry client-side)

POST /sessions/:id/end
  Auth: device
  Response 200: {
    sessionId: uuid,
    duration: number (seconds),
    snapshotsCount: number,
    reportUrl: string,
    qrCodeDataUrl: string
  }
  Process:
    1. UPDATE session.ended_at
    2. Generer rapport PDF
    3. Upload PDF → Supabase Storage
    4. Generer QR code pointant vers URL rapport
    5. Retourner URLs
```

#### Clients

```
GET /clients
  Auth: tenant_admin | super_admin | device
  Query: ?search=string&page=1&limit=20&sortBy=name&order=asc
  Response 200: { data: Client[], total: number, page: number, totalPages: number }
  Note: RLS filtre par tenant automatiquement

GET /clients/:id
  Auth: tenant_admin | super_admin | device
  Response 200: { ...client, sessions: SessionSummary[], lastDiagnosis?: DiagnosisResult }

POST /clients
  Auth: tenant_admin | device
  Body: { firstName: string, lastName: string, email?: string, phone?: string, age?: number, sex?: 'M' | 'F' | 'other' }
  Response 201: { id: uuid, ...client }
  Upsert: si email existe deja pour ce tenant → update

GET /clients/:id/evolution
  Auth: tenant_admin | super_admin | device
  Response 200: { sessions: [{ date, primaryDiagnosis, confidenceScore }] }
  Note: Donnees pour le graphique d'evolution dans le rapport PDF
```

#### Media

```
GET /media/playlist/:tenantId
  Auth: device
  Response 200: [{ id, type, checksum, signedUrl, displayOrder, isActive }]
  Note: URLs signees Supabase Storage (validite 1h)

POST /media/upload
  Auth: tenant_admin
  Content-Type: multipart/form-data
  Body: { file: File, type: 'video' | 'image' }
  Limits: video 500MB, image 10MB
  Formats: MP4 (H.264), WebM (VP9), JPG, PNG, WebP
  Response 201: { id, checksum, storageUrl }

PATCH /media/playlist/reorder
  Auth: tenant_admin
  Body: { items: [{ id: uuid, displayOrder: number, isActive: boolean }] }
  Response 200: { updated: true }
  Side-effect: WebSocket 'media:update' envoye au device du tenant

DELETE /media/:id
  Auth: tenant_admin
  Response 200: { deleted: true }
  Side-effect: WebSocket 'media:update'
```

#### Products

```
GET /products/:tenantId
  Auth: device | tenant_admin
  Response 200: [{ id, name, description, tags, category, price, url, imageUrl, isFeatured, displayOrder }]

POST /products/sync-shopify
  Auth: tenant_admin | super_admin
  Body: { shopifyDomain: string }
  Process: Fetch tous les produits Shopify, upsert local par shopify_id
  Response 200: { synced: number, created: number, updated: number }

PATCH /products/:id
  Auth: tenant_admin
  Body: { isFeatured?: boolean, displayOrder?: number }
  Response 200: { updated: true }
  Side-effect: WebSocket 'products:update' si isFeatured change
```

#### Reports

```
GET /reports/:sessionId
  Auth: public (URL unique avec token signe dans query string)
  Query: ?token=jwt_signed_token
  Response 200: PDF file (application/pdf)
  Note: C'est l'URL derriere le QR code. Token a duree limitee (configurable, defaut 30 jours).

GET /reports/:sessionId/data
  Auth: tenant_admin | super_admin
  Response 200: { session, client, snapshots, diagnoses, products, evolution }
  Note: Donnees brutes pour re-generer un rapport ou afficher dans le back-office
```

#### Health

```
GET /health
  Auth: none
  Response 200: { status: 'ok', version: string, uptime: number }
```

### 4.4 Auth & Roles

**JWT Structure :**

```typescript
// Device token
{
  sub: "device:{deviceId}",
  role: "device",
  tenantId: "{tenantId}",
  deviceId: "{deviceId}",
  iat: number,
  exp: number  // 24h
}

// User token (Supabase Auth)
{
  sub: "{userId}",
  role: "tenant_admin" | "super_admin",
  tenantId: "{tenantId}",  // null pour super_admin
  iat: number,
  exp: number  // 8h
}

// Report access token (dans query string QR code)
{
  sub: "report:{sessionId}",
  role: "public",
  sessionId: "{sessionId}",
  iat: number,
  exp: number  // 30 jours (configurable)
}
```

**Middleware chain :**

```
Request
  → cors
    → logger
      → auth (JWT verify → extract role + tenantId)
        → tenant-scope (SET LOCAL app.tenant_id = '{tenantId}' pour RLS)
          → validate (Zod schema sur body/query/params)
            → route handler
              → response
```

**Matrice d'acces :**

| Endpoint | device | tenant_admin | super_admin | public |
|----------|--------|--------------|-------------|--------|
| POST /auth/device/register | - | - | - | x |
| POST /auth/device/refresh | x | - | - | - |
| POST /auth/login | - | - | - | x |
| GET /devices/:id/status | - | x | x | - |
| POST /devices/:id/command | - | x | x | - |
| POST /sessions | x | - | - | - |
| POST /sessions/:id/snapshots | x | - | - | - |
| POST /sessions/:id/end | x | - | - | - |
| GET /clients | x | x | x | - |
| POST /clients | x | x | - | - |
| GET /media/playlist/:tenantId | x | x | x | - |
| POST /media/upload | - | x | - | - |
| GET /products/:tenantId | x | x | x | - |
| POST /products/sync-shopify | - | x | x | - |
| GET /reports/:sessionId | - | - | - | x (token) |
| GET /health | x | x | x | x |

### 4.5 WebSocket Protocol

**Connexion :**

```
wss://api.smartmirror.example.com/ws?token={device_jwt}
```

Le token JWT est verifie au moment du `upgrade`. Si invalide → connexion refusee (HTTP 401).

**Events device → server :**

```typescript
// Connexion initiale
{ event: 'device:online', data: { deviceId: string, firmware: string, ip: string } }

// Session
{ event: 'session:started', data: { sessionId: string, clientId: string } }
{ event: 'session:ended', data: { sessionId: string, duration: number, snapshotsCount: number } }

// Snapshot uploade
{ event: 'snapshot:uploaded', data: { sessionId: string, snapshotId: string } }

// Heartbeat (toutes les 30s)
{ event: 'heartbeat', data: { timestamp: number, wifiSignal: number, microscopeConnected: boolean, memoryUsageMB: number } }
```

**Events server → device :**

```typescript
// Medias
{ event: 'media:update', data: { playlist: MediaItem[] } }

// Affichage
{ event: 'display:mode', data: { mode: 'fullscreen' | 'side_panel' | 'hidden' } }
{ event: 'display:animatedbg', data: { enabled: boolean, theme: string } }

// Produits
{ event: 'products:update', data: { products: Product[] } }

// Volume
{ event: 'volume:set', data: { value: number } } // 0-100

// Systeme
{ event: 'app:restart', data: {} }
{ event: 'provisioning:reconfigure', data: { ssid: string, password: string } }
```

**Format message WebSocket :**

```typescript
interface WSMessage {
  event: string;
  data: Record<string, unknown>;
  timestamp: number;
  messageId: string;  // UUID pour deduplication
}
```

Tous les handlers sont idempotents (basé sur messageId). La reconnexion renvoi le dernier etat connu.

---

## 5. Base de donnees

### 5.1 Schema PostgreSQL (Drizzle)

```typescript
// db/schema/tenants.ts
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  shopifyDomain: varchar('shopify_domain', { length: 255 }),
  shopifyAccessToken: text('shopify_access_token'), // chiffre cote app
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// db/schema/devices.ts
export const devices = pgTable('devices', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name', { length: 255 }),
  macAddress: varchar('mac_address', { length: 17 }).notNull(),
  hostname: varchar('hostname', { length: 255 }),
  tokenHash: text('token_hash').notNull(),
  refreshTokenHash: text('refresh_token_hash'),
  firmwareVersion: varchar('firmware_version', { length: 50 }),
  lastSeen: timestamp('last_seen'),
  isOnline: boolean('is_online').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// db/schema/clients.ts
export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  age: integer('age'),
  sex: varchar('sex', { length: 10 }), // 'M' | 'F' | 'other'
  notes: text('notes'),
  shopifyCustomerId: varchar('shopify_customer_id', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailTenantIdx: uniqueIndex('clients_email_tenant_idx').on(table.email, table.tenantId),
  searchIdx: index('clients_search_idx').on(table.firstName, table.lastName, table.email),
}));

// db/schema/consents.ts
export const consents = pgTable('consents', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').notNull().references(() => clients.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  consentedAt: timestamp('consented_at').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  consentText: text('consent_text').notNull(), // texte exact affiche
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// db/schema/sessions.ts
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  deviceId: uuid('device_id').notNull().references(() => devices.id),
  clientId: uuid('client_id').notNull().references(() => clients.id),
  consentId: uuid('consent_id').notNull().references(() => consents.id),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  notes: text('notes'),
  reportStoragePath: text('report_storage_path'),
  reportAccessToken: text('report_access_token'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  clientIdx: index('sessions_client_idx').on(table.clientId),
  dateIdx: index('sessions_date_idx').on(table.startedAt),
}));

// db/schema/snapshots.ts
export const snapshots = pgTable('snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  storagePath: text('storage_path').notNull(),
  phase: varchar('phase', { length: 10 }).notNull(), // 'before' | 'after'
  diagnosis: jsonb('diagnosis'), // DiagnosisResult JSON
  aiModel: varchar('ai_model', { length: 100 }),
  aiLatencyMs: integer('ai_latency_ms'),
  aiCost: real('ai_cost'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// db/schema/products.ts
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  shopifyId: varchar('shopify_id', { length: 50 }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  tags: text('tags').array(),
  category: varchar('category', { length: 100 }),
  price: real('price'),
  currency: varchar('currency', { length: 3 }).default('EUR'),
  url: text('url'),
  imageUrl: text('image_url'),
  isFeatured: boolean('is_featured').default(false),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  shopifyIdx: uniqueIndex('products_shopify_idx').on(table.shopifyId, table.tenantId),
}));

// db/schema/media.ts
export const media = pgTable('media', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  type: varchar('type', { length: 10 }).notNull(), // 'video' | 'image'
  storagePath: text('storage_path').notNull(),
  checksum: varchar('checksum', { length: 64 }).notNull(), // SHA-256
  fileName: varchar('file_name', { length: 255 }),
  fileSizeBytes: integer('file_size_bytes'),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### 5.2 RLS Policies

```sql
-- Activer RLS sur toutes les tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Policy generique: isolation par tenant_id
-- Appliquee sur toutes les tables sauf tenants
CREATE POLICY tenant_isolation ON devices
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON clients
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON consents
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON sessions
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON snapshots
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON products
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON media
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Super admin: bypass RLS
-- Utilise le role supabase `service_role` qui bypass RLS nativement
-- OU policy specifique:
CREATE POLICY super_admin_bypass ON clients
  USING (current_setting('app.role', true) = 'super_admin');
```

**Application dans le middleware :**

```typescript
// middleware/tenant.middleware.ts
async function tenantScope(c: Context, next: Next) {
  const { tenantId, role } = c.get('auth'); // extrait du JWT par auth middleware

  if (role === 'super_admin') {
    // Pas de scope tenant — acces global
    await c.get('db').execute(sql`SET LOCAL app.role = 'super_admin'`);
  } else {
    await c.get('db').execute(sql`SET LOCAL app.tenant_id = '${tenantId}'`);
    await c.get('db').execute(sql`SET LOCAL app.role = '${role}'`);
  }

  await next();
}
```

### 5.3 Indexes

```sql
-- Performance: recherche clients (full-text)
CREATE INDEX clients_fulltext_idx ON clients
  USING gin(to_tsvector('french', first_name || ' ' || last_name || ' ' || coalesce(email, '')));

-- Performance: sessions par date
CREATE INDEX sessions_tenant_date_idx ON sessions (tenant_id, started_at DESC);

-- Performance: snapshots par session
CREATE INDEX snapshots_session_idx ON snapshots (session_id, created_at);

-- Performance: produits actifs par tenant
CREATE INDEX products_active_tenant_idx ON products (tenant_id) WHERE is_active = true;

-- Performance: media actifs par tenant
CREATE INDEX media_active_tenant_idx ON media (tenant_id, display_order) WHERE is_active = true;

-- Performance: devices online par tenant
CREATE INDEX devices_online_tenant_idx ON devices (tenant_id) WHERE is_online = true;
```

### 5.4 Supabase Storage Buckets

| Bucket | Acces | Structure | Retention |
|--------|-------|-----------|-----------|
| `snapshots` | Private (signed URLs) | `/{tenantId}/{sessionId}/{snapshotId}.jpg` | Configurable (defaut 365 jours) |
| `media` | Private (signed URLs, CDN) | `/{tenantId}/{mediaId}.{ext}` | Jusqu'a suppression manuelle |
| `reports` | Private (signed URLs) | `/{tenantId}/{sessionId}/report.pdf` | Meme que snapshots |

---

## 6. Intelligence Artificielle

### 6.1 OpenRouter Integration

```typescript
// ai/openrouter.ts
interface OpenRouterConfig {
  apiKey: string;           // env: OPENROUTER_API_KEY
  baseUrl: string;          // https://openrouter.ai/api/v1
  defaultModel: string;     // ex: 'google/gemini-flash-1.5'
  fallbackModels: string[]; // ex: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-haiku']
  timeout: number;          // 30000ms
  maxRetries: number;       // 2
}

async function analyzeSnapshot(
  imageBase64: string,
  productCatalog: Product[],
  clientHistory: DiagnosisResult[] | null,
  promptVersion: string
): Promise<DiagnosisResult> {
  const systemPrompt = await loadPrompt(promptVersion);
  const userContent = buildUserContent(imageBase64, productCatalog, clientHistory);

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://smartmirror.dreamtech.fr',
      'X-Title': 'Smart Mirror Scalp Analysis'
    },
    body: JSON.stringify({
      model: config.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,  // basse pour reproductibilite
      max_tokens: 1500
    }),
    signal: AbortSignal.timeout(config.timeout)
  });

  const json = await response.json();
  const content = json.choices[0].message.content;
  const parsed = JSON.parse(content);
  return validateDiagnosis(parsed); // Zod validation
}
```

### 6.2 Prompt systeme (v1)

```markdown
# Prompt: scalp-analysis-v1

Tu es un systeme d'analyse capillaire professionnel pour un salon de beaute premium.
Tu analyses des photos microscopiques de cuir chevelu prises avec un microscope USB.

## Ton role
Fournir un constat cosmetique observationnel. Tu n'es PAS medecin. Tu ne poses JAMAIS de diagnostic medical.
Tu identifies des caracteristiques visuelles du cuir chevelu pour orienter les soins cosmetiques.

## Categories d'analyse
Pour chaque photo, identifie UNE ou PLUSIEURS categories parmi:
1. cuir_chevelu_sec — manque d'hydratation, desquamation sans corps gras, surface terne
2. cuir_chevelu_gras — exces de sebum, aspect brillant/huile, teinte jaunatre
3. pellicules_seches — petites squames blanches, fond sec, pas de rougeur
4. pellicules_grasses — squames plus larges jaunatres, fond gras, irritation possible
5. inflammation_rougeurs — rougeurs, irritation visible, vaisseaux apparents
6. densite_faible — cuir chevelu visible a travers les cheveux, espacement important
7. alopecie_debutante — amincissement progressif, follicules miniaturises (ATTENTION: suggerer consultation dermatologique, ne pas diagnostiquer)
8. cuir_chevelu_sain — hydratation equilibree, bonne densite folliculaire, pas de pathologie visible

## Format de reponse (JSON strict)
{
  "diagnosis": {
    "categories": [
      { "name": "string (parmi la liste)", "confidence": 0.0-1.0, "severity": "low|medium|high" }
    ],
    "primary_category": "string",
    "overall_confidence": 0.0-1.0,
    "is_conclusive": true/false
  },
  "commentary": "string — 2-4 phrases en francais, ton professionnel et bienveillant, PAS de jargon medical",
  "recommendations": {
    "care_tips": ["string — 2-3 conseils de soin"],
    "products": [
      { "product_name": "string (nom exact du catalogue)", "reason": "string — pourquoi ce produit", "url": "string (URL exacte du catalogue)" }
    ]
  }
}

## Regles
- Si la photo est floue ou inexploitable: is_conclusive = false, commentary explique pourquoi
- Si la photo ne montre pas un cuir chevelu: is_conclusive = false
- Confiance < 0.60: is_conclusive = false obligatoirement
- Maximum 3 produits recommandes
- Les produits DOIVENT provenir du catalogue fourni. Ne jamais inventer un produit.
- Si aucun produit ne correspond: products = []
- Le commentaire est TOUJOURS en francais
- Ne JAMAIS utiliser les termes "diagnostic", "pathologie", "maladie", "traitement"
- Utiliser: "observation", "constat", "soin", "entretien"

## Catalogue produits disponibles
{PRODUCT_CATALOG_JSON}

## Historique client (si disponible)
{CLIENT_HISTORY_JSON}
```

### 6.3 Types diagnostic

```typescript
// shared/types/ai.ts

interface DiagnosisCategory {
  name: ScalpCategory;
  confidence: number;     // 0.0 - 1.0
  severity: 'low' | 'medium' | 'high';
}

type ScalpCategory =
  | 'cuir_chevelu_sec'
  | 'cuir_chevelu_gras'
  | 'pellicules_seches'
  | 'pellicules_grasses'
  | 'inflammation_rougeurs'
  | 'densite_faible'
  | 'alopecie_debutante'
  | 'cuir_chevelu_sain';

interface DiagnosisResult {
  diagnosis: {
    categories: DiagnosisCategory[];
    primaryCategory: ScalpCategory;
    overallConfidence: number;
    isConclusive: boolean;
  };
  commentary: string;
  recommendations: {
    careTips: string[];
    products: ProductRecommendation[];
  };
}

interface ProductRecommendation {
  productName: string;
  reason: string;
  url: string;
}

// Validation Zod
const diagnosisSchema = z.object({
  diagnosis: z.object({
    categories: z.array(z.object({
      name: z.enum([...SCALP_CATEGORIES]),
      confidence: z.number().min(0).max(1),
      severity: z.enum(['low', 'medium', 'high']),
    })).min(1),
    primary_category: z.enum([...SCALP_CATEGORIES]),
    overall_confidence: z.number().min(0).max(1),
    is_conclusive: z.boolean(),
  }),
  commentary: z.string().min(10).max(1000),
  recommendations: z.object({
    care_tips: z.array(z.string()).max(5),
    products: z.array(z.object({
      product_name: z.string(),
      reason: z.string(),
      url: z.string().url(),
    })).max(3),
  }),
});
```

### 6.4 Seuils de confiance

| Seuil | Affichage |
|-------|-----------|
| >= 0.80 | Diagnostic affiche normalement |
| 0.60 — 0.79 | Diagnostic affiche avec mention "confiance moderee" |
| < 0.60 | "Analyse non concluante" — pas de diagnostic affiche, raison indiquee |

Regle: si `overall_confidence < 0.60`, forcer `is_conclusive = false` cote serveur meme si le LLM dit le contraire.

### 6.5 Cout et metriques

Tracker pour chaque appel IA :
- `model` : modele utilise
- `latency_ms` : temps de reponse
- `cost` : cout en USD (depuis headers OpenRouter `x-openrouter-cost`)
- `tokens_input` / `tokens_output`
- `json_valid` : boolean (le JSON parse correctement)
- `is_conclusive` : boolean

Stocke dans la table `snapshots` (colonnes `ai_model`, `ai_latency_ms`, `ai_cost`).

---

## 7. Panel de Controle

### 7.1 Stack

```
Framework   : React 19 + TypeScript
Styling     : Tailwind CSS 4
Build       : Vite >= 6
Auth        : Supabase Auth (@supabase/supabase-js)
State       : Zustand
HTTP client : ky (ou fetch natif)
WS client   : native WebSocket
Deploy      : Vercel
```

### 7.2 Pages

| Page | Route | Role requis | Description |
|------|-------|-------------|-------------|
| **Login** | `/login` | - | Email/password via Supabase Auth |
| **Dashboard** | `/` | tenant_admin, super_admin | Vue synthetique: seances/semaine, diagnostics, devices online |
| **Devices** | `/devices` | tenant_admin, super_admin | Liste miroirs, statut temps reel, commandes |
| **Device detail** | `/devices/:id` | tenant_admin, super_admin | Statut detaille, session active, commandes, logs |
| **Clients** | `/clients` | tenant_admin, super_admin | Liste searchable, filtres (boutique, diagnostic, date) |
| **Client detail** | `/clients/:id` | tenant_admin, super_admin | Fiche complete, timeline seances, galerie snapshots, evolution |
| **Medias** | `/media` | tenant_admin | Upload drag & drop, bibliotheque, playlist, reorder |
| **Produits** | `/products` | tenant_admin | Liste produits, toggle featured, sync Shopify |
| **Config affichage** | `/config` | tenant_admin | Fond anime (on/off/theme), mode media, volume, logo |
| **Export** | `/export` | tenant_admin, super_admin | Export CSV clients, sync Shopify, historique exports |
| **Boutiques** | `/tenants` | super_admin | Gestion multi-tenant, stats par boutique, permissions |

### 7.3 Communication temps reel

Le Panel se connecte en WebSocket pour recevoir les updates du device en temps reel :

```typescript
// Connexion Panel → API → device status updates
const ws = new WebSocket(`wss://api.smartmirror.example.com/ws/panel?token=${jwt}`);

// Events recus:
// - device:status { deviceId, isOnline, wifiSignal, microscopeConnected }
// - session:update { sessionId, clientName, snapshotsCount, status }
// - snapshot:new { sessionId, snapshotId, thumbnailUrl }

// Commandes envoyees:
// - device:command { deviceId, command, data }
```

---

## 8. Rapport PDF & QR Code

### 8.1 Generation

```typescript
// services/report.service.ts
// Genere cote serveur avec @react-pdf/renderer

async function generateReport(sessionId: string): Promise<Buffer> {
  const data = await getReportData(sessionId);
  // data: { session, client, tenant, snapshots, diagnoses, products, evolution }

  const pdfDoc = renderToBuffer(<ReportPDF data={data} />);
  return pdfDoc;
}
```

### 8.2 Structure PDF

```
┌─────────────────────────────────────────────────────┐
│  [Logo K Beauty]              Date | Boutique       │  En-tete
│  ─────────── filet rose ───────────────             │
├─────────────────────────────────────────────────────┤
│  Client: {prenom}                                   │  Bloc client
│  Seance du {date} — Praticienne: {nom}              │
├─────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐                 │
│  │  Photo AVANT │  │  Photo APRES │                 │  Photos
│  │              │  │              │                 │
│  └──────────────┘  └──────────────┘                 │
│       Avant              Apres                      │
├─────────────────────────────────────────────────────┤
│  Observations:                                      │  Diagnostic
│  - Categorie 1 (confiance: 85%)                     │
│  - Categorie 2 (confiance: 72%)                     │
│                                                     │
│  Commentaire: "Votre cuir chevelu presente..."      │
├─────────────────────────────────────────────────────┤
│  Evolution (si historique)                           │  Graphique
│  [graphique minimaliste]                            │
├─────────────────────────────────────────────────────┤
│  Recommandations:                                   │  Produits
│  - Produit 1 — raison — [lien achat]               │
│  - Produit 2 — raison — [lien achat]               │
├─────────────────────────────────────────────────────┤
│  [Logo K Beauty]  kbeauty-cosmetics.com             │  Pied de page
│  Vos donnees sont protegees (RGPD)                  │
│  Powered by Smart Mirror                            │
└─────────────────────────────────────────────────────┘
```

Format: A4 portrait. Mode clair (fond blanc). Imprimable et lisible sur smartphone.

### 8.3 QR Code

```typescript
// Generation QR code apres creation du rapport
import QRCode from 'qrcode';

const reportUrl = `${config.appUrl}/reports/${sessionId}?token=${reportAccessToken}`;
const qrDataUrl = await QRCode.toDataURL(reportUrl, {
  width: 400,
  margin: 2,
  color: { dark: '#000000', light: '#ffffff' }
});

// Le QR code est renvoye au device pour affichage grand format
// Le token dans l'URL a une duree de vie configurable (defaut 30 jours)
```

---

## 9. Integration Shopify

### 9.1 Sync produits

```typescript
// services/shopify.service.ts
async function syncProducts(tenantId: string): Promise<SyncResult> {
  const tenant = await getTenant(tenantId);
  const shopifyProducts = await fetchAllShopifyProducts(tenant.shopifyDomain, tenant.shopifyAccessToken);

  let created = 0, updated = 0;
  for (const sp of shopifyProducts) {
    const existing = await db.query.products.findFirst({
      where: and(eq(products.tenantId, tenantId), eq(products.shopifyId, sp.id.toString()))
    });

    const productData = {
      tenantId,
      shopifyId: sp.id.toString(),
      name: sp.title,
      description: sp.body_html?.replace(/<[^>]*>/g, '') || '',
      tags: sp.tags?.split(',').map(t => t.trim()) || [],
      category: sp.product_type || null,
      price: parseFloat(sp.variants[0]?.price || '0'),
      url: `https://${tenant.shopifyDomain}/products/${sp.handle}`,
      imageUrl: sp.image?.src || null,
    };

    if (existing) {
      await db.update(products).set(productData).where(eq(products.id, existing.id));
      updated++;
    } else {
      await db.insert(products).values(productData);
      created++;
    }
  }

  return { synced: shopifyProducts.length, created, updated };
}
```

### 9.2 Export clients vers Shopify

```typescript
async function exportClientsToShopify(tenantId: string, clientIds: string[]): Promise<ExportResult> {
  const tenant = await getTenant(tenantId);
  let exported = 0, errors = 0;

  for (const clientId of clientIds) {
    const client = await db.query.clients.findFirst({ where: eq(clients.id, clientId) });
    if (!client?.email) continue; // email requis pour Shopify

    try {
      // Chercher client existant par email
      const existing = await searchShopifyCustomer(tenant, client.email);

      if (existing) {
        await updateShopifyCustomer(tenant, existing.id, {
          first_name: client.firstName,
          last_name: client.lastName,
          phone: client.phone,
          tags: addTag(existing.tags, 'smart-mirror'),
        });
      } else {
        await createShopifyCustomer(tenant, {
          first_name: client.firstName,
          last_name: client.lastName,
          email: client.email,
          phone: client.phone,
          tags: 'smart-mirror',
        });
      }
      exported++;
    } catch (err) {
      errors++;
    }
  }

  return { exported, errors, total: clientIds.length };
}
```

---

## 10. Securite & RGPD

### 10.1 Chiffrement

| Donnee | Au repos | En transit |
|--------|----------|------------|
| Token device (electron-store) | safeStorage (OS keychain) | TLS 1.3 |
| Photos (Supabase Storage) | AES-256 (Supabase default) | TLS 1.3 |
| Donnees clients (PostgreSQL) | AES-256 (Supabase default) | TLS 1.3 |
| Shopify access token | Chiffre cote app (AES-256-GCM) avant stockage DB | TLS 1.3 |
| WebSocket | - | WSS (TLS 1.3) |
| SSH miroir | - | SSH (port 2222, cle uniquement) |

### 10.2 Consentement RGPD

- Ecran de consentement OBLIGATOIRE avant toute capture (RG-001)
- Texte de consentement stocke integralement (pour preuve)
- Horodatage precis (timestamp + timezone)
- Un consentement par seance (pas de consentement permanent)
- Le client peut revoquer → suppression complete des donnees (droit a l'effacement)

### 10.3 Retention des donnees

| Donnee | Duree | Action |
|--------|-------|--------|
| Photos (snapshots) | 365 jours (configurable) | Suppression automatique (Edge Function scheduled) |
| Rapports PDF | Meme que snapshots | Suppression automatique |
| Lien QR code | 30 jours (configurable) | Token expire → acces refuse |
| Fiche client (marketing) | Jusqu'a suppression manuelle ou demande RGPD | Suppression sur demande |
| Consentement | Conserve meme apres suppression client (preuve legale) | Jamais supprime |
| Logs systeme | 90 jours | Rotation automatique |

### 10.4 Point ouvert HDS

Les photos microscopiques de cuir chevelu et les diagnostics IA pourraient etre qualifies de donnees de sante. Si oui:
- Hebergement HDS certifie requis (pas Supabase standard)
- Options: OVH Healthcare, Scaleway HDS, Azure Healthcare
- Impact: migration Supabase → PostgreSQL manage chez hebergeur HDS
- Decision: consulter juriste AVANT mise en production

---

## 11. Infrastructure & Deploy

### 11.1 Environments

| Env | API | DB | Panel | Device |
|-----|-----|-----|-------|--------|
| **dev** | localhost:3000 | Supabase local (Docker) | localhost:5173 | Electron dev mode |
| **staging** | staging-api.railway.app | Supabase projet staging | staging.vercel.app | Pi de test |
| **production** | api.smartmirror.example.com | Supabase projet prod | panel.smartmirror.example.com | Pi boutique |

### 11.2 Docker (API)

```dockerfile
# packages/api/Dockerfile
FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
```

### 11.3 Variables d'environnement

```bash
# API
PORT=3000
NODE_ENV=production
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG...
SUPABASE_ANON_KEY=eyJhbG...
DATABASE_URL=postgresql://...
JWT_SECRET=<random 64 chars>
JWT_DEVICE_EXPIRY=24h
JWT_REPORT_EXPIRY=30d
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_DEFAULT_MODEL=google/gemini-flash-1.5
CORS_ORIGINS=https://panel.smartmirror.example.com
```

### 11.4 CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: cd packages/api && bun install && bun test

  test-panel:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: cd packages/control-panel && npm ci && npm test

  build-device:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: cd packages/mirror-app && npm ci && npm run build
      # Cross-build ARM64 + x86-64 via electron-builder
      - run: cd packages/mirror-app && npx electron-builder --linux --arm64 --x64
```

---

## 12. Performance

### 12.1 Budgets

| Metrique | Budget | Mesure |
|----------|--------|--------|
| RAM totale device (OS + Electron + cache) | < 6 GB (sur 8 GB) | `free -m` + Electron process manager |
| Temps boot → ecran accueil | < 30s | Chronometre systemd-analyze |
| Latence stream microscope (getUserMedia) | < 50ms | Performance API renderer |
| Latence capture snapshot → affichage resultat IA | < 5s | Timer client-side |
| Latence API (p95) | < 200ms | Logs middleware |
| Taille cache media | < 2 GB | df + media-index.json |
| Temps generation PDF | < 3s | Timer serveur |

### 12.2 Optimisations device

- **Electron** : `--disable-gpu-compositing` si GPU VideoCore insuffisant, `--max-old-space-size=512` pour le main process
- **tsParticles** : `requestAnimationFrame` suspendu hors viewport, max 50 particules
- **Media cache** : lecture streaming depuis disque, pas de preload complet en RAM
- **Snapshots** : compression JPEG 0.92 (pas PNG), upload chunk si > 5MB
- **React** : lazy loading des pages, React.memo sur les composants lourds (VideoStream, MediaPlayer)

---

## 13. Strategie de test

### 13.1 Par couche

| Couche | Type | Framework | Cible |
|--------|------|-----------|-------|
| **API** | Unit | bun:test | Services, validation Zod, logique metier |
| **API** | Integration | bun:test + Supabase local | Endpoints complets, RLS, auth |
| **API** | WebSocket | bun:test | Events, connexion, reconnexion |
| **Panel** | Unit | Vitest | Composants, hooks, stores |
| **Panel** | E2E | Playwright | Parcours admin complet |
| **Device** | Unit | Vitest | Services main process, IPC handlers |
| **Device** | Integration | Electron test | Flux complet (mock microscope via v4l2loopback) |
| **IA** | Benchmark | Script custom | Fixture set 20+ images, metriques qualite |
| **Shared** | Unit | Vitest | Types, validation, constantes |

### 13.2 Tests critiques (non-negotiables)

1. **RLS isolation** : un tenant_admin ne peut JAMAIS lire les donnees d'un autre tenant
2. **Consentement** : une capture est IMPOSSIBLE sans consentement valide
3. **Offline buffer** : les snapshots sont bien bufferises et uploades a la reconnexion
4. **Device auth** : un JWT expire est bien rejete, le refresh fonctionne
5. **IA validation** : un JSON malformed de l'IA est bien catch et retourne une erreur propre
6. **Confidence threshold** : un score < 0.60 retourne bien "analyse non concluante"

### 13.3 Emulation device en dev

```bash
# Simuler un microscope USB avec v4l2loopback
sudo modprobe v4l2loopback video_nr=0 card_label="Virtual Microscope"
ffmpeg -re -i test_scalp_footage.mp4 -f v4l2 /dev/video0
```

---

## 14. Points ouverts techniques

| # | Point | Impact | Responsable | Deadline |
|---|-------|--------|-------------|----------|
| 1 | Verification protocole WiFi Jiusion 4K (MJPEG via hotspot ?) | Pipeline microscope | Orion | Des reception hardware |
| 2 | Choix compute prod (Pi 5 vs Beelink SER5) apres benchmarks | Budget device, performance | Orion + Carmack | Sprint 1 |
| 3 | Qualification HDS — consultation juriste | Hebergement, migration potentielle | Externe (juridique) | Avant prod |
| 4 | Duree de validite lien QR code (defaut 30j, a confirmer) | UX client, securite | PM + client | Validation CDC |
| 5 | Format exact export Shopify (champs, mapping) | Integration | Nadia | Sprint 2 |
| 6 | DPA avec OpenRouter / fournisseurs LLM | RGPD compliance | Externe (juridique) | Avant prod |
| 7 | Modele tarifaire B2B (package miroir) | Business | PM + client | Pre-lancement B2B |
| 8 | Categories d'analyse — validation par praticiens | Prompt IA, UX | Iris + client | Sprint 1 |
| 9 | Choix domaine et certificat SSL pour API prod | Infra | Nadia | Sprint 2 |

---

*CDC Technique v1.0 — A lire conjointement avec CDC_DreamTech.md (fonctionnel) et smart_mirror_specs_techniques.md (complement).*
*Agents responsables: Orion (device), Nadia (backend), Iris (IA), Amelia (panel).*
