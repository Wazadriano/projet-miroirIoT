# Smart Mirror — Complément Technique CDC
**K Beauty Cosmetics / Bubble Hair Spa** · Version 1.0 · Mars 2026  
*Document destiné à l'équipe de développement, en complément du CDC fonctionnel.*

> **AVERTISSEMENT — DOCUMENT OBSOLETE (note du 2026-06-25).** Ce complément technique de Mars 2026 ne reflète plus l'état réel du dépôt. Deux écarts majeurs à ne pas reprendre en soutenance :
> - **Microscope** : ce document décrit un pipeline USB UVC / V4L2 (`/dev/video*`, `getUserMedia`, GStreamer). Le code réel utilise au contraire le **WiFi/TCP** (`192.168.34.1:8080`, handshake JHCMD ; flux H.264 transcodé par ffmpeg en MJPEG sur `localhost:9100`, `proxy.js`). Les références USB/UVC/V4L2 du dépôt sont des **vestiges morts**.
> - **Stack** : la stack Bun/Supabase/Budibase/Vercel évoquée plus bas est **abandonnée**. Stack réelle : Electron 33 + React 19 côté device ; mock Express + PostgreSQL 15 côté backend (Laravel 13 / PHP 8.4, PostgreSQL 16 et Redis 7 = CIBLES ROADMAP non implémentées).
>
> Source de vérité de l'état réalisé : `docs/ARCHITECTURE-MVP-VS-CIBLE.md`.

---

## 1. Hardware du Miroir

### 1.0 Architecture physique (scenario 2 — compute deporte)

Le miroir Shineworld integre un ecran tactile 32" avec Android embarque.
L'Android est **bypasse** : l'ecran fonctionne en mode moniteur HDMI, pilote par un
Raspberry Pi 5 dans un boitier externe fixe au dos du cadre.

```
┌─────────────────────────────────────────────┐
│            Miroir Shineworld                │
│  ┌───────────────────────────────────────┐  │
│  │   Ecran 32" tactile (mode HDMI)      │  │
│  │   Verre sans-tain par-dessus         │  │
│  └───────────────────────────────────────┘  │
│         │ HDMI         ▲ USB (touch HID)    │
│         └──────┬───────┘                    │
│                │ cables sortie arriere      │
└────────────────┼────────────────────────────┘
                 │
    ┌────────────┴────────────────┐
    │   Boitier Pi 5 (PETG)      │
    │   Fixe VESA au dos cadre   │
    │   ┌─────────────────────┐  │
    │   │ Raspberry Pi 5 8GB  │  │
    │   │ Active Cooler       │  │
    │   │ (opt) M.2 HAT+ NVMe│  │
    │   └─────────────────────┘  │
    │   Ports : USB-C alim       │
    │           micro-HDMI → ecran│
    │           USB-A ← touch    │
    │           USB-A → microscope│
    │           WiFi (internet)  │
    └─────────────────────────────┘
```

### 1.1 Miroir (fourni par Shineworld — sur mesure)

| Composant | Specification demandee au fournisseur |
|-----------|--------------------------------------|
| Ecran | 32" IPS/VA, Full HD (1920x1080), **minimum 400 nits**, tactile capacitif 10 points |
| Verre | Sans-tain (two-way mirror, 25-35% transmission lumiere) |
| Cadre | Aluminium noir mat, profondeur minimale |
| Entree video | **HDMI 2.0 Type A femelle** — le Pi envoie via micro-HDMI + adaptateur |
| Retour tactile | **USB (protocole HID standard)** — plug-and-play Linux, pas de driver proprietaire |
| Android embarque | **Desactive ou non inclus** — mode moniteur HDMI uniquement |
| Alimentation ecran | Interne au cadre, cable secteur IEC C13 ou C7 |
| Passage cables | HDMI + USB en sortie arriere ou partie basse du cadre |
| Fixation boitier | VESA 75x75 ou 100x100 au dos du cadre |
| Deploiement | 2 unites par boutique — 6 miroirs total |

> **Contrainte critique :** L'ecran doit depasser 400 nits car 65-75% de la luminosite est absorbee par le verre sans-tain. En dessous, le rendu est trop sombre en eclairage salon.

### 1.2 Boitier compute (externe — fixe au dos du miroir)

Le compute tourne sur **Raspberry Pi 5 (8GB)** dans un boitier imprime 3D (PETG), fixe au dos du cadre miroir via VESA. Voir `device-setup/enclosure/` pour le modele OpenSCAD et les specs detaillees (`SPECS.md`).

```
OS       : Raspberry Pi OS Lite 64-bit (Debian 12 Bookworm)
GPU      : VideoCore VII — acceleration H.264/MJPEG hardware disponible
RAM      : 8 GB LPDDR4X
Stockage : microSD 64GB Class 10 minimum (SSD NVMe via M.2 HAT+ recommande pour prod)
WiFi     : 802.11ac dual-band integre
USB      : 2x USB 3.0 (microscope + touch ecran), 2x USB 2.0 (peripheriques)
HDMI     : 2x micro-HDMI 2.0 (1 utilise pour l'ecran miroir)
```

**Cables requis entre boitier et miroir :**
- Micro-HDMI → HDMI 2.0 (adaptateur ou cable, 30-50 cm)
- USB-A → USB (retour tactile ecran, 30-50 cm)

**Recommandation production** (a valider selon budget) :

| Option | CPU | RAM | Prix | Note |
|--------|-----|-----|------|------|
| Raspberry Pi 5 8GB | ARM Cortex-A76 4c | 8 GB | ~80€ | Dev OK, prod limite |
| Orange Pi 5 Plus | RK3588 8c | 16 GB | ~120€ | Meilleure perf ARM, meme form factor |
| Beelink SER5 MAX | Ryzen 5 5700U 8c | 16 GB | ~180€ | Recommande prod — x86, DDR4, NVMe |

Le code doit rester compatible ARM64 **et** x86-64 (pas de dependances x86-only).

### 1.3 Connectivite

- **HDMI** : micro-HDMI (Pi) → adaptateur → HDMI 2.0 (miroir) — sortie video vers ecran
- **USB touch** : USB-A (Pi) ← USB (miroir) — retour tactile HID standard
- **WiFi** : connexion au reseau boutique (WPA2/WPA3), configuration au provisioning
- **Ethernet** : RJ45 disponible pour l'installation initiale / debug
- **Microscope** : USB 3.0, device expose en `/dev/video*` (classe UVC)
- **Pas de Bluetooth** en scope V1

---

## 2. Système d'Exploitation & Boot

```
Distribution  : Raspberry Pi OS Lite 64-bit (headless, pas de DE)
Serveur X     : X11 minimal — lancé par systemd au boot
WM            : Openbox (ou rien — Electron en fullscreen suffit)
Auto-login    : oui — utilisateur dédié `mirror`
Démarrage app : service systemd `smart-mirror.service`
SSH           : activé, port non-standard, authentification par clé uniquement
Updates OS    : unattended-upgrades — sécurité seulement
```

**Séquence de boot cible :**
```
boot → systemd → X11 → Openbox → smart-mirror.service → Electron (kiosk fullscreen)
```

L'application Electron est le seul process graphique. Aucun bureau, aucune barre de tâches.

---

## 3. Application Electron (Device)

### 3.1 Stack

```
Runtime     : Electron (latest LTS)
Renderer    : React + TypeScript
Bundler     : Vite + electron-vite
Build dist  : electron-builder → .deb + AppImage (ARM64 + x86-64)
Updates     : electron-updater (auto-update depuis GitHub Releases ou endpoint API)
Config      : electron-store (JSON chiffré via safeStorage)
```

### 3.2 Architecture des processus

```
Main Process
├── Gestion cycle de vie Electron
├── IPC typé (ipcMain) vers les renderers
├── Service WiFi       → wraps nmcli via child_process
├── Service Microscope → détection /dev/video*, hot-plug udev
├── Service API Client → fetch/WS vers le backend
└── Service Config     → lecture/écriture electron-store

Renderer — Interface Patient
├── Zones d'affichage (stream, infos séance, produits)
├── Media Player (HTML5 Video)
└── Animated Background (Canvas / tsParticles)
```

### 3.3 Config locale (electron-store)

```json
{
  "device": {
    "id": "uuid",
    "tenantId": "uuid",
    "token": "<chiffré safeStorage>"
  },
  "api": {
    "baseUrl": "https://api.exemple.com",
    "wsUrl": "wss://api.exemple.com/ws"
  },
  "microscope": {
    "devicePath": "/dev/video0",
    "resolution": "1920x1080"
  },
  "display": {
    "animatedBgEnabled": true,
    "animatedBgTheme": "particles",
    "mediaMode": "fullscreen",
    "volume": 70
  }
}
```

### 3.4 Flags Electron (mode kiosk)

```bash
electron . \
  --kiosk \
  --no-sandbox \
  --disable-infobars \
  --disable-notifications \
  --hide-crash-restore-bubble
```

---

## 4. Stream Microscope

### 4.1 Détection du device

Au démarrage, le Main Process scanne `/dev/video*`. Si plusieurs devices détectés (webcam intégrée + microscope), on identifie le microscope par ses capabilities V4L2 (résolution, vendor ID USB).

Hot-plug géré via `inotify` sur `/dev` ou `udev` rules (udev recommandé pour la fiabilité).

### 4.2 Pipeline selon le type de microscope

| Type device | Approche | Latence | Priorité |
|-------------|----------|---------|----------|
| UVC reconnu par Chromium | `getUserMedia` natif dans le Renderer | < 50ms | **Prioritaire** |
| V4L2 non-UVC / format exotique | GStreamer → pipeline → WebSocket → Canvas | 100–200ms | Fallback |
| Microscope WiFi (MJPEG HTTP) | `<img>` src vers `http://device_ip/stream` | 200–400ms | Si WiFi uniquement |

**Approche recommandée V1 :** `getUserMedia` avec contraintes explicites :

```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    deviceId: { exact: microscopeDeviceId },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 }
  }
});
```

### 4.3 Capture snapshot

Snapshot déclenché depuis l'interface ou via commande WebSocket du praticien :

```
Canvas.drawImage(videoElement) → toBlob(JPEG, 0.92) → upload API → Supabase Storage
```

L'upload se fait en arrière-plan sans bloquer le stream live. En cas d'absence de réseau, le snapshot est bufferisé localement et uploadé à la reconnexion.

### 4.4 Gestion de la déconnexion microscope

- Déconnexion USB → event `inotify` → overlay "Microscope déconnecté" dans l'interface
- Reconnexion → re-détection automatique, stream redémarré sans action utilisateur
- Log de chaque événement pour diagnostic distant

---

## 5. Gestion WiFi & Provisioning

### 5.1 First boot — Mode provisioning

Si aucune config réseau trouvée au démarrage :

```
1. Device crée un hotspot WiFi (hostapd + dnsmasq)
   SSID: "SmartMirror-Setup-XXXX" (XXXX = 4 derniers chars device ID)
   IP device: 192.168.4.1

2. L'Electron expose une page web locale sur ce port (BrowserWindow non-kiosk)
   → formulaire : SSID boutique / mot de passe / Tenant ID

3. Le device tente la connexion (nmcli)
   → si succès : ping API, enregistrement device, réception token
   → si échec : retour formulaire avec erreur

4. Redémarrage en mode normal (service systemd restart)
```

### 5.2 Gestion des cas réseau

| Scénario | Comportement |
|----------|-------------|
| WiFi OK + API joignable | Mode normal complet |
| WiFi OK + API down | Mode dégradé : médias en cache, sessions buffées localement, sync à reconnexion |
| WiFi perdu | Reconnexion auto nmcli toutes les 30s, interface affiche indicateur offline |
| Changement SSID boutique | Via commande envoyée depuis le Panel (WebSocket) ou QR code de reconf |

### 5.3 Dual-réseau (microscope WiFi)

Si le microscope utilisé est WiFi (cas minoritaire), le Raspberry Pi doit gérer deux interfaces réseau simultanées — une vers le réseau boutique (internet), une vers le microscope (WiFi Direct ou hotspot device).

Options :
- **USB WiFi adapter** dédié pour le microscope + wlan0 pour internet
- **Bridge réseau** si le routeur boutique permet le WiFi Direct bridging

> Ce cas doit être tranché selon le modèle de microscope définitivement choisi. En USB UVC, le problème n'existe pas.

---

## 6. Interface Miroir — Zones d'affichage

```
┌─────────────────────────────────────────┐
│  [WiFi] [API] [Heure]          [logo]   │  ← Barre statut (discrète, coin)
├─────────────────────────────────────────┤
│                                         │
│         STREAM MICROSCOPE               │  ← Zone principale (redimensionnable)
│         (ou placeholder)                │
│                                         │
├─────────────────────────────────────────┤
│  ┌──────────────────────────────────┐   │
│  │  MEDIA PLAYER                    │   │  ← Fullscreen ou panneau 1/3
│  │  (vidéos/images promotionnelles) │   │
│  └──────────────────────────────────┘   │
│                                         │
│  [Fond animé — background layer]        │  ← Toujours derrière
└─────────────────────────────────────────┘
```

**Modes d'affichage du Media Player :**
- `fullscreen` — occupe tout l'écran, stream en overlay réduit
- `side_panel` — panneau 1/3 droite, stream sur 2/3 gauche
- `hidden` — coupé pendant une phase de soin qui nécessite toute l'attention

Le mode est commandable en temps réel depuis le Panel (WebSocket `display:mode`).

---

## 7. Fond Animé

- **Lib recommandée :** `tsParticles` (léger, ~40kb, tree-shakable, React component natif)
- **Thèmes prévus :** particules flottantes (défaut), ondes lumineuses, aurora gradient
- **Performances :** `requestAnimationFrame` suspendu quand une vidéo plein écran est en lecture
- **Configurable** par le tenant depuis le Panel (on/off + choix de thème)
- **Transition** : `opacity` CSS 500ms au changement d'état

---

## 8. Media Player — Contenu Promotionnel

### 8.1 Principe

Le player tourne en boucle tout au long des séances. Le contenu est défini par le tenant depuis le Panel de Contrôle.

### 8.2 Formats supportés

| Type | Formats | Taille max |
|------|---------|-----------|
| Vidéo | MP4 (H.264), WebM (VP9) | 500 MB |
| Image | JPG, PNG, WebP | 10 MB |

### 8.3 Sync et cache offline

```
Démarrage app
  → GET /media/playlist/:tenantId
  → Comparaison checksums vs cache local (/var/smart-mirror/media/)
  → Téléchargement des nouveaux fichiers en background
  → Lecture depuis le cache local (jamais depuis CDN en direct)
```

Le cache local garantit le fonctionnement offline une fois le contenu synchronisé. Taille max du cache : configurable (défaut 2 GB).

En cas de mise à jour playlist depuis le Panel, l'événement WebSocket `media:update` déclenche une resync immédiate.

---

## 9. API Backend

### 9.1 Stack

```
Runtime    : Bun
Framework  : Hono (ou Elysia)
Auth       : JWT (device) + Supabase Auth (users)
Validation : Zod
DB         : Supabase (PostgreSQL via Supabase SDK / Drizzle ORM)
Storage    : Supabase Storage
WS         : Bun native WebSocket
Deploy     : Docker → Railway / Fly.io
```

### 9.2 Groupes d'endpoints

```
/auth
  POST /auth/device/register    # provisioning device → retourne JWT
  POST /auth/device/refresh     # rotation token

/devices
  GET  /devices/:id/status      # état temps réel (last_seen, is_online, session active)
  POST /devices/:id/command     # envoie commande via WebSocket

/sessions
  POST /sessions                # démarre une session (device)
  PATCH /sessions/:id           # update en cours (notes, produits utilisés)
  POST /sessions/:id/end        # termine + sauvegarde snapshots

/clients
  GET  /clients                 # liste avec filtres (tenant, type peau, dates...)
  GET  /clients/:id             # profil + historique séances
  POST /clients                 # création / upsert

/media
  GET  /media/playlist/:tenantId  # playlist active avec URLs signées CDN
  POST /media/upload              # upload binaire → Supabase Storage
  PATCH /media/playlist/reorder   # réordonnancement

/products
  GET  /products/:tenantId        # produits actifs (device)
  POST /products                  # ajout (tenant_admin)
  PATCH /products/:id             # modification / toggle miroir
```

### 9.3 WebSocket — Événements

```
device → server
  device:online          { deviceId, firmware, ip }
  session:started        { sessionId, clientId }
  session:ended          { sessionId, duration, snapshotsCount }
  snapshot:uploaded      { sessionId, snapshotUrl }
  heartbeat              { timestamp, wifiSignal, microscopeConnected }

server → device
  media:update           { playlist: [...] }
  display:mode           { mode: "fullscreen" | "side_panel" | "hidden" }
  display:animatedbg     { enabled: bool, theme: string }
  products:update        { products: [...] }
  volume:set             { value: 0–100 }
  app:restart            {}
  provisioning:reconfigure { ssid, password }
```

### 9.4 Auth & Rôles

| Rôle | Entité | Accès |
|------|--------|-------|
| `device` | Miroir physique | Sessions, sync médias, snapshots |
| `tenant_admin` | Gérant boutique | Panel complet, médias, produits, historique boutique |
| `super_admin` | Admin réseau | Accès global multi-tenant, CRM complet, devices |

---

## 10. CRM & Panel de Contrôle

### 10.1 CRM — Back-office

**Implémentation :** No-code via **Budibase** self-hosted connecté à Supabase.

Pages minimales V1 :
- **Liste clients** — search full-text + filtres (boutique, type peau, type soin, plage dates)
- **Fiche client** — infos perso, timeline séances, galerie snapshots, produits utilisés
- **Dashboard** (super_admin) — métriques globales par boutique

Isolation tenant : gérée par RLS Supabase — le tenant_admin ne voit que ses clients.

### 10.2 Panel de Contrôle Tenant

**Stack :** React + TypeScript + Tailwind — application web déployée sur Vercel.

Pages :

| Page | Fonctionnalités clés |
|------|---------------------|
| Statut miroir | Online/offline temps réel, session active, commandes rapides (sync, restart app) |
| Gestion médias | Upload drag & drop, bibliothèque, activation playlist, réordonnancement, mode affichage par média |
| Gestion produits | CRUD produits, upload photo, toggle "affiché sur miroir", ordre d'affichage |
| Configuration affichage | Fond animé (on/off/thème), mode media par défaut, volume, logo boutique |

Toutes les actions qui affectent le miroir en temps réel passent par une commande WebSocket via l'API.

---

## 11. Points à Arbitrer (pour revue équipe)

| # | Question | Impact |
|---|----------|--------|
| 1 | **Microscope USB vs WiFi** — Le choix est structurant pour l'archi réseau et la fiabilité du stream | Architecture réseau, complexité |
| 2 | **IA on-device vs cloud** — On-device : perf GPU Raspberry Pi insuffisante, cloud : latence + coût API | Specs hardware, coût infra |
| 3 | **Inférence IA : modèle pré-entraîné fine-tuné vs API tierce** (ModiFace, SkinAI...) | Budget, dépendance externe, qualité |
| 4 | **Snapshots : upload temps réel vs buffer fin de séance** — Temps réel = réseau requis en continu | Robustesse offline |
| 5 | **Cache offline médias : taille limite** — À définir par plan d'abonnement ou fixe (2GB par défaut ?) | Stockage device |
| 6 | **Multi-miroir par boutique V1** — 1 miroir par tenant simplifie tout. Prévoir le data model pour en supporter plusieurs sans refactoring | Data model, WebSocket routing |
| 7 | **Consentement RGPD** — Signature digitale sur l'écran du miroir vs formulaire papier | UX, conformité |
| 8 | **HDS (Hébergeur de Données de Santé)** — Les images microscopiques cuir chevelu peuvent être considérées données de santé. Supabase EU suffit ou certification HDS requise ? | Choix hébergeur, coût |

---

## 12. Environnement de Dev

```bash
# Monorepo recommandé
packages/
  api/          # Bun + Hono
  mirror-app/   # Electron + React
  control-panel/ # React (web)

# Dev sur Pi
# Cross-compile depuis Mac/Linux x86 → ARM64 via electron-builder
# Ou dev natif sur Pi avec accès SSH + VSCode Remote

# Émulation stream microscope en dev
ffmpeg -re -i test_footage.mp4 -f v4l2 /dev/video0
# ou loopback V4L2 : modprobe v4l2loopback
```

---

*Complément du CDC v2.0 — À lire conjointement avec le document fonctionnel.*
