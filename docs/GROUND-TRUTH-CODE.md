# GROUND-TRUTH-CODE.md — Source de verite du code (Smart Mirror KBEAUTY)

> Document de reference factuel. Le CODE est la seule autorite. Chaque affirmation
> porte sa preuve `fichier:ligne` et un niveau de confiance (L1 = preuve directe
> spec/code ; L2 = inference forte mais non litterale). En cas de conflit entre la
> memoire claude.ai et le code, le code prime. Genere a partir de 8 audits structures.

---

## 1. Backend & Base de donnees (device Smart Mirror)

- **Le backend du DEVICE est un mock Express (Node.js), PAS un Laravel.** Fichier unique
  contenant deux apps Express ("Mock Laravel API" + "Mock Express IA Proxy"). Le
  `package.json` le dit lui-meme: "Mock API simulating Laravel backend + Express IA proxy".
  Preuve: `smart-mirror/mock-api/src/server.js:1` (`require('express')`), `:21`, `:512` ;
  `smart-mirror/mock-api/package.json:5`. **Confiance: L1**
- **Un VRAI Laravel existe mais c'est le CRM separe**, hors du device. `crm/backend` =
  `laravel/laravel`, `laravel/framework ^13.0`, presence de `artisan` et
  `app/Http/Controllers`. A ne pas confondre avec le backend embarque du miroir.
  Preuve: `crm/backend/composer.json`, `crm/backend/artisan`. **Confiance: L1**
- **Ports exposes par le backend device.** Mock "Laravel" API: **8100** (docker-compose +
  `config.service.ts`; defaut en dur `8000` via `MOCK_API_PORT`, surcharge a 8100 par
  docker-compose). Mock IA Proxy: **3001**. PostgreSQL: 5432. Adminer: 8080.
  Preuve: `smart-mirror/docker-compose.yml:25-27` ; `server.js:504`, `:553` ;
  `mirror-app/src/main/services/config.service.ts:43-44`. **Confiance: L1**
- **Acces base = SQL brut via le driver `pg` (`Pool.query`), aucun ORM.** Aucune trace
  de knex/sequelize/typeorm/prisma/Eloquent cote device.
  Preuve: `server.js:3`, `:13`, `:38/79/104/152` ; `package.json:15` (`pg ^8.13.0`).
  **Confiance: L1**
- **Base de donnees = PostgreSQL 15** (`postgres:15-alpine`), DB `smartmirror`, schema
  charge depuis `init.sql`. Types specifiques Postgres: `uuid-ossp`, UUID, JSONB, TEXT[].
  Preuve: `smart-mirror/docker-compose.yml:3`, `:14` ; `init.sql:4`, `:77`, `:93`.
  **Confiance: L1**
- **L'IA est aussi mockee cote device** (`/api/analyze`, port 3001): scores
  `Math.random()`, latence `setTimeout`, modele en dur `'google/gemini-flash-1.5'`,
  aucun appel reel. Preuve: `server.js:518-549`. **Confiance: L1**

---

## 2. Modele de donnees

- **`init.sql` contient 9 tables**: boutiques, clientes, consentements, miroirs, seances,
  photos, produits, medias, **config_miroir** (+ 10 index, seed boutiques/miroirs/
  clientes/produits/medias). Preuve: `init.sql:6,15,32,42,54,70,85,99,112` ;
  `grep -c 'CREATE TABLE' = 9`. **Confiance: L1**
- **Le MCD contient 8 entites**: BOUTIQUE, CLIENTE, CONSENTEMENT, MIROIR, SEANCE, PHOTO,
  PRODUIT, MEDIA. Preuve: `docs/diagrammes/01-mcd.mmd:16,22,30,36,43,50,57,63`.
  **Confiance: L1**
- **L'ecart 8 vs 9 = la table `config_miroir`**, table technique de config UI miroir,
  presente dans `init.sql` mais absente du MCD. Les 8 entites MCD correspondent 1:1 a une
  table SQL. Preuve: `init.sql:112` sans bloc equivalent dans `01-mcd.mmd`. **Confiance: L1**
- **Verrou RGPD du consentement, a DEUX niveaux.** (1) DB: `consentement_id UUID NOT NULL
  REFERENCES consentements(id)` sur `seances`. (2) Applicatif: `POST /api/seances` refuse
  **HTTP 422** si `consentement_id` absent, et 422 si consentement introuvable ou revoque
  (`date_revocation IS NULL` verifiee). **Code = 422, pas 403.**
  Preuve: `init.sql:59` ; `server.js:166-168`, `:171-177`. **Confiance: L1**
- **Divergences de nommage d'attributs MCD vs SQL.** MIROIR: MCD `adresse_mac/token_device/
  en_ligne` vs SQL `device_token/is_online/ip_address` (pas de colonne `adresse_mac`).
  PRODUIT: MCD `mis_en_avant` vs SQL `affiche_miroir`.
  Preuve: `01-mcd.mmd:36-42,57-62` vs `init.sql:42-52,85-97`. **Confiance: L1**

---

## 3. Tests

- **Tests unitaires Vitest: 5 fichiers**, tous dans `src/main/services/`: api-client,
  config, crm-sync, crypto-vault, sync. **Confiance: L1**
- **60 cas unitaires** (`it(` = 60, `test(` = 0). Repartition: api-client=14, config=14,
  **crm-sync=18**, crypto-vault=7, sync=7. Preuve: `grep -E -c 'it\('` par fichier.
  **Confiance: L1**
- **Tests e2e Playwright: 4 fichiers** (mirror-qa, qa-complete, qa-senior-vm, vm-qa),
  **136 cas** (`test(`). Repartition: 14+65+42+15. **Confiance: L1**
- **TOTAL = 196 cas** (60 unit + 136 e2e). **Confiance: L1**
- **5 services testes sur 9** `.service.ts`. Sans test: media-cache, microscope, updater,
  wifi. Preuve: appariement `*.service.ts` / `*.service.test.ts`. **Confiance: L1**
- **`crm-sync.service.test.ts` existe** (14057 octets, 18 `it(`, 7 `describe(`) — il N'est
  PAS absent. **Confiance: L1**

---

## 4. IA / Vision

- **Le proxy IA par defaut de l'app (port 3001) est entierement MOCKE**: scores
  `Math.random`, latence `setTimeout`, commentaire et produits en dur, modele = chaine
  litterale `'google/gemini-flash-1.5'`. L'image base64 est recue dans le body mais
  **jamais utilisee** (seul `x-mirror-token` est lu).
  Preuve: `server.js:518-549` ; client `api-client.service.ts:165` ;
  `config.service.ts:44`. **Confiance: L1**
- **Aucun OpenCV / cv2 / Haar / cascade nulle part** dans le code (grep = 0 hors
  node_modules). Il n'y a PAS de vision CPU on-device. **Confiance: L1**
- **OpenRouter n'apparait dans AUCUN code executable** (.js/.ts/.py = 0). Cite uniquement
  dans la doc (.md) et fichiers d'archive. **Confiance: L1**
- **Un SECOND service IA REEL existe: `crm/ia-service/src/server.js` (port 3002).** Il fait
  un vrai `fetch` vers GitHub Models (Azure) et **envoie la photo JPEG complete en base64
  au cloud** (vision multimodale `image_url`). Auth = `Bearer GITHUB_TOKEN`, modeles vision
  Llama-3.2-11B-Vision / Phi-3.5-vision / gpt-4o-mini. Deploye cote SERVEUR (CRM) via
  docker-compose + Traefik `kbeauty-ia`, **pas on-device**.
  Preuve: `crm/ia-service/src/server.js:12,78,83,13-17,174` ;
  `crm/docker-compose.yml:210-224`. **Confiance: L1**
- **L'app miroir ne pointe vers le service reel (3002) dans aucune config par defaut**:
  elle utilise `IA_PROXY_URL || http://localhost:3001` (le mock). Aucun `3002` dans
  `smart-mirror/`. Preuve: `config.service.ts:44`. **Confiance: L1**

---

## 5. Microscope / Video

- **Connexion microscope = WiFi/TCP (pas USB)** vers `192.168.34.1:8080`.
  Preuve: `microscope-proxy/proxy.js:16-17,35-36` ; `stream.py:18-19,31-33`. **L1**
- **Handshake protocole JHCMD** sur le socket TCP a la connexion:
  `JHCMD` + `0xD0 0x01`. Preuve: `proxy.js:39` ; `stream.py:34`. **L1**
- **Codec source = H.264, transcode en MJPEG via ffmpeg** (`-f h264 -i pipe:0 -f mjpeg`).
  Le H.264 n'atteint jamais le renderer. Preuve: `proxy.js:42-64` ; `stream.py:38-51,73-90`.
  **L1**
- **MJPEG servi en HTTP port 9100** (proxy.js) / 9000 (stream.py), endpoints `/stream.mjpg`
  et `/snapshot.jpg`, `multipart/x-mixed-replace; boundary=--frame`.
  Preuve: `proxy.js:18,99-129,208-213` ; `stream.py:20,98-134,159-162`. **L1**
- **Live preview = flux MJPEG dans une balise `<img>`, PAS MSE.**
  `<img src=http://localhost:9100/stream.mjpg>`. Aucune API `MediaSource`/`SourceBuffer`/
  `appendBuffer` dans tout `smart-mirror` (grep = 0).
  Preuve: `SessionScreen.tsx:153-156` ; `microscope.service.ts:4,99` ; `handlers.ts:265`.
  **L1**
- **Snapshots = JPEG base64** recuperes en HTTP port 9100 (`/snapshot.jpg`), renvoyes via
  IPC `microscope:snapshot` et endpoint `/capture`.
  Preuve: `microscope.service.ts:5,29-38` ; `handlers.ts:280-283` ; `proxy.js:120-141`. **L1**
- **Vestiges USB/UVC/V4L2 morts toujours presents** mais non consommes par le pipeline:
  `udev/99-microscope.rules` (video4linux/UVC), `config.service.ts` `devicePath
  '/dev/video0'` (jamais lu par le pipeline), `setup-vm.sh` (v4l2-ctl, USB passthrough),
  `setup-device.sh`. La doc les declare explicitement "vestiges morts".
  Preuve: `udev/99-microscope.rules:1-9` ; `config.service.ts:20,50,180-192` ;
  `setup-vm.sh:97-100,133-135` ; `VM-SETUP.md:78` ; `SPECS.md:138,142`. **L1**
- **Deux implementations de proxy coexistent**: Node.js (`proxy.js`, service systemd actif)
  et Python (`stream.py`, alternative standalone). ffmpeg est au coeur des DEUX ; rien
  n'indique un retrait/depreciation de ffmpeg.
  Preuve: `proxy.js` ; `stream.py` ; `systemd/microscope-proxy.service`. **L2**

---

## 6. Chiffrement & Securite

- **Chiffrement au repos = AES-256-GCM** (authentifie, tag GCM). Service `CryptoVault`
  + singleton `cryptoVault`. Format payload: `[version 1o || IV 12o || authTag 16o ||
  ciphertext]`. Preuve: `crypto-vault.service.ts:15,17-19,13,112,21,145`. **L1**
- **Donnees chiffrees**: photos cuir chevelu `.jpg.enc` (`sync.service.ts:60,62`), file de
  sync JSON (`sync.service.ts:113`), secrets/tokens de config (`config.service.ts:95,104`).
  **L1**
- **crm-sync dechiffre les `.jpg.enc` avant upload** et retire le suffixe `.enc` du nom
  distant. Preuve: `crm-sync.service.ts:317,323`. **L1**
- **Gestion de cle maitre (ordre)**: 1) env `SMART_MIRROR_MASTER_KEY` (base64 32o) ->
  2) `CREDENTIALS_DIRECTORY/smart-mirror-master-key` (systemd-creds) -> 3) `MASTER_KEY_FILE`
  -> 4) fallback dev key locale 0600. **En production sans cle: throw** (pas de degrade
  silencieux). Preuve: `crypto-vault.service.ts:35-61,57-59` ; test `:53`. **L1**
- **safeStorage Electron NON utilise en prod**: present seulement dans le mock de test
  (`src/__mocks__/electron.ts:8`) et un commentaire expliquant le non-usage
  (`crypto-vault.service.ts:7-8`). Remplace par CryptoVault AES-256-GCM. **L1**
- **Durcissement Electron**: `sandbox: true` (`index.ts:52`), `contextIsolation: true`,
  `nodeIntegration: false` (`index.ts:53`), **CSP en production** via `onHeadersReceived`
  (`index.ts:121-144`, conditionne a `!is.dev`). **L1**
- **CI (`.github/workflows/ci.yml`) — etat reel des gates**:
  - `npm audit --omit=dev --audit-level=critical` = **BLOQUANT** (pas de continue-on-error,
    `:41-42`) mais limite a CRITICAL/prod uniquement.
  - `npm audit --audit-level=high` = **NON bloquant** (`continue-on-error: true`, `:47-49`).
  - SBOM CycloneDX = present mais **non bloquant** (`continue-on-error: true`, `:51-53`),
    upload artifact.
  - gitleaks = job `secrets-scan` **BLOQUANT** (`:64-74`, sans continue-on-error).
  - Semgrep = job dedie **NON bloquant** (`continue-on-error: true`, `:76-85`) malgre
    `--error`. **L1**

---

## 7. Stack device (`smart-mirror/mirror-app`)

- **Electron `^33.2.0`** (devDependencies, `package.json:41`). **L1**
- **React `^19.0.0`** (react + react-dom, dependencies `:26-27`). **L1**
- **TypeScript `^5.7.0`** (dev, `:46`). **L1**
- **Zustand `^5.0.0`** (dependencies `:29`). **L1**
- **electron-vite `^2.3.0`** (`:43`), **electron-builder `^25.1.8`** (`:42`). **L1**
- **Persistance**: electron-store `^8.2.0` (`:23`). **Updates**: electron-updater `^6.3.9`
  (`:24`). **QR**: qrcode `^1.5.4` (`:22`). **Clavier tactile**: react-simple-keyboard
  `^3.8.183` (`:28`). **L1**
- **Tests**: vitest `^2.1.0` + coverage-v8 (unit), playwright `^1.59.1` (e2e). **L1**
- **Build electron-builder**: cibles **Linux uniquement** = deb + AppImage, chacun pour
  **arm64 ET x64** (pas mono-arch). appId `com.dreamtech.smartmirror`, productName
  `SmartMirror`, maintainer DreamTech. Publish `provider: generic`, url =
  `${UPDATE_SERVER_URL}` (variable d'env). **Aucune cible Windows ni macOS.**
  Preuve: `electron-builder.yml` ; scripts `package:arm64`/`package:x64` `package.json:10-12`.
  **L1**
- Notes de placement (non-anomalies): `electron`/`electron-builder`/`electron-vite` en
  devDependencies = conforme aux conventions electron-builder ; `@types/qrcode` classe en
  dependencies = mineur, sans impact (types elimines au build). **L1**

---

## 8. Sync / Stockage / RGPD (device)

- **File de sync = fichier JSON** (`/var/smart-mirror/sync-queue.json`), serialise via
  `JSON.stringify`. **Aucun broker** (pas de MQTT/Redis/AMQP).
  Preuve: `sync.service.ts:8,113,98`. **L1**
- **File chiffree au repos** (AES-256-GCM via cryptoVault), avec lecture retrocompatible de
  l'ancien JSON clair. Preuve: `sync.service.ts:112-121,93-99`. **L1**
- **Polling 30 s**, **heartbeat 60 s**, **retention photos 30 jours**.
  Preuve: `sync.service.ts:39-44,46-49,9,154`. **L1**
- **Purge** via `cleanupExpiredPhotos` appelee dans le setInterval de polling: supprime
  (`unlinkSync`) les `.jpg.enc`/`.jpg` dont `mtimeMs < cutoff`, **jamais** ceux encore en
  file (`pendingPaths`). Preuve: `sync.service.ts:43,152-180,164-165,170`. **L1**
- **Offline-first reel**: `savePhotoLocally` ecrit la photo chiffree sur disque PUIS
  l'ajoute a la file AVANT tout reseau ; `processQueue` ne tourne que si `isProvisioned`
  et reempile l'item sur erreur reseau (retry).
  Preuve: `sync.service.ts:57-83,123-146,124,139-141`. **L1**
- **AUCUN SQLite cote device**: pas de dependance (`better-sqlite3`/`sqlite3` absents du
  `package.json`), aucun usage dans `src` (seul match `smart-mirror` = `Thumbs.db` du
  `.gitignore`). Stockage device = sync-queue.json + electron-store + fichiers `.jpg.enc`.
  Les occurrences "sqlite" du depot sont cote CRM Laravel (`crm/backend` phpunit/config/
  composer/.env.example) et docs. Preuve: `package.json` ; grep `sqlite`. **L1**

---

## Faits invariants (verites que TOUT livrable doit respecter)

1. **Backend device = mock Express/Node.js (server.js), PAS Laravel.** Laravel 13 =
   uniquement le CRM separe (`crm/backend`) et/ou une cible roadmap. (L1)
2. **Base serveur = PostgreSQL 15** en SQL brut via `pg` (aucun ORM). (L1)
3. **AUCUN SQLite nulle part cote device.** Stockage local = electron-store (config) +
   fichier JSON chiffre (sync-queue.json) + fichiers `.jpg.enc`. (L1)
4. **Tests = 196 au total** (60 unitaires sur 5 services dont **crm-sync = 18**, + 136
   e2e Playwright). (L1)
5. **Modele**: 9 tables `init.sql` vs 8 entites MCD ; ecart = `config_miroir`. (L1)
6. **Verrou consentement RGPD a deux niveaux** (FK NOT NULL + refus serveur **HTTP 422**,
   y compris consentement revoque). (L1)
7. **AUCUN OpenCV**, aucune vision CPU on-device. Le chemin par defaut de l'app = mock
   `Math.random` (port 3001). (L1)
8. **La photo QUITTE le device vers le cloud** dans le service IA reel
   (`crm/ia-service`, port 3002): JPEG base64 -> **GitHub Models (Azure)**, vision
   multimodale, auth `GITHUB_TOKEN`. **PAS OpenRouter** (jamais appele dans le code). (L1)
9. **Video**: source H.264 TCP -> **ffmpeg transcode en MJPEG** -> preview en `<img>`
   MJPEG (port 9100). **PAS de MSE.** ffmpeg n'est pas en cours de retrait. (L1)
10. **Microscope = WiFi/TCP 192.168.34.1:8080, handshake JHCMD.** Refs USB/UVC/V4L2 =
    vestiges morts. (L1)
11. **Chiffrement au repos = AES-256-GCM** (CryptoVault), throw en prod sans cle maitre.
    safeStorage non utilise en prod. (L1)
12. **CI**: bloquants = audit CRITICAL/prod + gitleaks. Non bloquants = audit high/dev,
    SBOM CycloneDX, Semgrep. (L1)
13. **Build = Linux deb + AppImage, arm64 ET x64.** Aucune cible Windows/macOS. (L1)


---

## Divergences memoire claude.ai vs code reel

| Sujet | Memoire claude.ai | Realite code | Verdict |
|-------|-------------------|--------------|---------|
| Backend device | Laravel (Sanctum) | Mock Express/Node.js (`smart-mirror/mock-api/src/server.js`, 2 apps Express 8100+3001), package.json dit "Mock API simulating Laravel". Vrai Laravel = CRM separe (`crm/backend`, framework ^13.0) | FAUX pour le device (Laravel = CRM separe + cible roadmap) |
| Auth Sanctum sur device | Sanctum | Mock lit `x-mirror-token` dans les headers ; pas de Sanctum embarque cote device | FAUX / NON ETAYE cote device |
| Stockage local device | SQLite local | AUCUN SQLite (0 dep, 0 usage) ; electron-store (config) + sync-queue.json chiffre + fichiers `.jpg.enc`. SQLite n'existe qu'au CRM Laravel et dans la doc | FAUX (SQLite inexistant cote device) |
| Sync queue | sync queue | Vrai: fichier JSON chiffre (`sync.service.ts:8,113`), polling 30s, heartbeat 60s | VRAI (mais JSON, pas SQLite/broker) |
| Retention 30 jours | 30-day retention | Vrai: `PHOTO_RETENTION_DAYS=30`, purge via cleanupExpiredPhotos dans le polling | VRAI |
| Base serveur | (implicite SQLite) | PostgreSQL 15-alpine, SQL brut via `pg`, aucun ORM | A CORRIGER (PostgreSQL 15, pas SQLite) |
| Nombre de tables / entites | 8 entities | 9 tables `init.sql` (dont config_miroir) vs 8 entites MCD | LES DEUX VRAIS, artefacts differents ; ecart = config_miroir |
| Total de tests | 196 total | 196 confirme (60 unit + 136 e2e) | claude.ai CORRECT |
| Tests unitaires | ~60 unit sur 5 services | 60 `it(` exactement (api-client 14, config 14, crm-sync 18, crypto-vault 7, sync 7) | claude.ai CORRECT |
| Tests crm-sync | inclus dans les services testes | `crm-sync.service.test.ts` existe (14057 o, 18 `it(`) | claude.ai CORRECT |
| Tests e2e | 136 e2e | 136 `test(` sur 4 fichiers (14+65+42+15) | ACCORD, correct |
| Services testes | 5 services | 5 sur 9 (.service.ts) ; sans test: media-cache, microscope, updater, wifi | claude.ai CORRECT |
| Analyse on-device | OpenCV sur CPU Pi | AUCUN OpenCV (grep=0). Chemin par defaut = mock `Math.random`/`setTimeout` (`server.js:518-549`) | FAUX |
| Cloud AI confidentialite | text-only, scores seulement, photo ne quitte jamais le device | Service IA reel (`crm/ia-service:174`) envoie le JPEG base64 complet a GitHub Models (Azure), vision multimodale `image_url` | FAUX (la photo quitte le device) |
| Provider cloud | OpenRouter (US) | GitHub Models / models.inference.ai.azure.com, auth `GITHUB_TOKEN`. OpenRouter jamais appele (docs .md uniquement) | PARTIEL (cloud US oui, mais Azure/GitHub Models, pas OpenRouter) |
| Localisation service IA reel | (on-device suppose) | Deploye cote serveur CRM (docker-compose, Traefik kbeauty-ia, port 3002), pas sur le Pi | A CORRIGER (serveur, pas device) |
| IA mock | (claim local) IA mockee Math.random, aucun appel reel | VRAI pour le chemin par defaut de l'app (3001) ; INCOMPLET car `crm/ia-service` fait de vrais appels reseau | PARTIEL |
| Live preview video | H.264 via MSE (MediaSource) | MJPEG (`multipart/x-mixed-replace`) dans `<img src=localhost:9100/stream.mjpg>`. 0 occurrence MediaSource/SourceBuffer/appendBuffer | FAUX |
| Codec vu par le renderer | H.264 | Renderer ne recoit que du MJPEG/JPEG ; H.264 transcode par ffmpeg cote proxy | FAUX |
| ffmpeg | being phased out | ffmpeg au coeur des 2 implementations (proxy.js + stream.py), aucun chemin alternatif | FAUX / NON ETAYE |
| JPEG snapshots | JPEG snapshots | Confirme: `/snapshot.jpg` -> base64 via IPC + `/capture` | VRAI |
| Microscope connexion | (USB suppose / vestiges) | WiFi/TCP 192.168.34.1:8080, handshake JHCMD. Refs USB/UVC/V4L2 = vestiges morts | VRAI (WiFi/TCP), USB = vestiges |
| CI audit npm | audit BLOQUANT deja en place | Audit CRITICAL/prod bloquant (`ci.yml:41-42`) MAIS audit high/dev en continue-on-error (`:47-49`) | VRAI mais imprecis (bloquant limite CRITICAL/prod) |
| CI audit (claim local) | audit NON bloquant (continue-on-error) | Faux pour l'etape critical-prod (sans continue-on-error) ; seule l'etape high est non bloquante | CLAIM LOCAL IMPRECIS |
| CI SBOM | SBOM CycloneDX present | Present mais `continue-on-error: true` (non bloquant), upload artifact | VRAI (presence), non bloquant |
| CI Semgrep | Semgrep present | Job dedie present mais `continue-on-error: true` malgre `--error` (non bloquant) | VRAI (presence), non bloquant |
| CI gitleaks | gitleaks present | Job `secrets-scan` present ET bloquant (sans continue-on-error) | VRAI et bloquant |
| safeStorage Electron | (usage implicite) | Non utilise en prod ; seulement dans mock de test + commentaire de non-usage. Remplace par CryptoVault AES-256-GCM | A CORRIGER (non utilise) |
| Chiffrement au repos | photos chiffrees | AES-256-GCM (CryptoVault) sur photos `.jpg.enc`, queue JSON, secrets config ; throw en prod sans cle | VRAI (precise: AES-256-GCM) |
| Stack annoncee | Laravel, OpenCV, SQLite cites | Laravel = CRM/roadmap ; OpenCV inexistant ; SQLite inexistant cote device | A CORRIGER (3 elements faux/mal places) |
| Refus consentement | (RGPD) | FK NOT NULL + refus serveur HTTP 422 (absent ou revoque) | VRAI (nuance: 422, pas 403) |
| Cible de build | (arm64 suppose) | deb + AppImage pour arm64 ET x64 ; aucune cible Windows/macOS | PRECISION (bi-arch Linux) |

---

## Corrections critiques a propager dans tous les livrables

1. Backend device: remplacer toute mention 'backend Laravel/Sanctum embarque sur le miroir' par 'mock Express/Node.js (smart-mirror/mock-api/src/server.js, ports 8100 API + 3001 IA)'. Preciser que le vrai Laravel 13 est le CRM separe (crm/backend) et/ou une cible roadmap, pas le backend du device. A propager dans DOCUMENT-COMPLET-RNCP.md, DOSSIER-CONNAISSANCE-RNCP.md, DEFENSE-JURY.md, presentation.
2. Stockage local: supprimer 'SQLite local' partout. Le device n'utilise AUCUN SQLite (0 dep, 0 usage). Remplacer par: electron-store (config) + fichier JSON chiffre sync-queue.json + fichiers .jpg.enc. La base serveur est PostgreSQL 15 (SQL brut via pg, aucun ORM). SQLite n'existe que cote CRM Laravel et dans la doc.
3. Stack technique: retirer OpenCV et SQLite de la liste des technologies du device. Corriger 'Laravel' en 'CRM Laravel separe / roadmap'. La stack device reelle: Electron 33, React 19, TypeScript 5.7, Zustand 5, Node.js (mock + proxies), Python (stream.py), ffmpeg, PostgreSQL 15 (serveur).
4. IA on-device: supprimer 'OpenCV sur CPU du Raspberry Pi'. Le chemin par defaut de l'app est un MOCK (Math.random, server.js:518-549). Aucune vision CPU locale n'existe.
5. Confidentialite/RGPD IA: corriger 'la photo ne quitte jamais le device / cloud text-only'. Le service IA reel (crm/ia-service, port 3002, cote SERVEUR) envoie le JPEG complet en base64 a GitHub Models (Azure), vision multimodale. La photo QUITTE le device. Impact RGPD majeur a documenter (transfert image vers cloud US).
6. Provider IA: remplacer 'OpenRouter' par 'GitHub Models (models.inference.ai.azure.com, auth GITHUB_TOKEN, modeles Llama-3.2-11B-Vision / Phi-3.5-vision / gpt-4o-mini)'. OpenRouter n'est appele dans aucun code (docs uniquement). Corriger le Chapitre V.
7. Video: remplacer 'H.264 live preview via MSE (MediaSource)' par 'flux MJPEG (multipart/x-mixed-replace) affiche dans une balise <img>, port 9100'. Le H.264 (source TCP microscope) est transcode en MJPEG par ffmpeg cote proxy ; le renderer ne recoit jamais de H.264. Supprimer 'ffmpeg being phased out': ffmpeg est central et non deprecie.
8. Microscope: confirmer WiFi/TCP 192.168.34.1:8080 + handshake JHCMD. Mentionner que les references USB/UVC/V4L2 (udev, /dev/video0, v4l2-ctl) sont des vestiges morts non utilises par le pipeline.
9. Tests: harmoniser sur 196 tests au total = 60 unitaires (5 services: api-client 14, config 14, crm-sync 18, crypto-vault 7, sync 7) + 136 e2e Playwright. Corriger toute mention de 178 ou 42 tests, et toute affirmation que crm-sync n'aurait pas de test (il a 18 cas).
10. Modele de donnees: clarifier 9 tables (init.sql) vs 8 entites (MCD). La table config_miroir existe en base mais n'est pas dans le MCD. Documenter aussi les divergences de nommage d'attributs (MIROIR: device_token/is_online/ip_address ; PRODUIT: affiche_miroir).
11. RGPD consentement: documenter le verrou a DEUX niveaux (FK consentement_id NOT NULL en base + refus applicatif HTTP 422 si absent ou consentement revoque). Preciser code 422 (pas 403).
12. CI/Securite: nuancer 'audit bloquant deja en place'. Bloquants reels: npm audit CRITICAL/prod + gitleaks. NON bloquants (continue-on-error): npm audit high/dev, SBOM CycloneDX, Semgrep. Ne pas presenter SBOM/Semgrep comme des gates bloquants.
13. Chiffrement: preciser AES-256-GCM via CryptoVault (format version+IV+tag+ciphertext), applique aux photos .jpg.enc, a la queue JSON et aux secrets de config ; throw en production sans cle maitre. safeStorage Electron n'est PAS utilise en prod (uniquement mock de test).
14. Build/Packaging: corriger toute mention mono-arch. Cibles = deb + AppImage pour arm64 ET x64 (Linux uniquement), aucune cible Windows/macOS. Publish provider generic via UPDATE_SERVER_URL.
