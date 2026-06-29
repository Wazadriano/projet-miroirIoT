# RAPPORT FACT-CHECK — Soutenance Smart Mirror KBEAUTY (RNCP 37046)

Audit des assertions du dossier confronte a la source de verite du code (`docs/GROUND-TRUTH-CODE.md`).
Methode : autorite primaire = le depot, verifie directement sur les fichiers cles (preuves `fichier:ligne`).
Faits externes (CVE, documentation Raspberry Pi, tarifs) = sources des verificateurs. Chaque verdict porte
un niveau de preuve (L1 = preuve directe code/spec ; L2 = inference forte ; L3+ = source secondaire ou
qualification a valider). Distinction systematique entre REALISE (MVP) et CIBLE (roadmap).

---

## 1. Verdict sur la RAM : 4 Go suffisent-ils au lieu de 8 Go ?

**Verdict : OUI, 4 Go suffisent techniquement pour le MVP. Cette affirmation se presente comme une
decision d'ingenierie justifiee et conditionnee a une mesure, pas comme un fait absolu.**

### Footprint reconstruit depuis le code

| Composant | Preuve code | RSS estime |
|---|---|---|
| OS Debian 12 Lite + X11 minimal | CDCT | 250-400 Mo |
| Electron main (Node, services) | `src/main/` | 80-150 Mo |
| Renderer Chromium (React 19 + glassmorphism) | `global.css` | 250-450 Mo |
| GPU / compositing (VideoCore VII, RAM partagee) | `backdrop-filter blur` | 100-250 Mo |
| Proxy microscope (Node + ffmpeg) | `proxy.js` ffmpeg `-r 15 -q:v 5` | 90-190 Mo |
| Sous-total hors Docker | | ~0,9-1,5 Go |
| Backend Docker PostgreSQL + mock API si lance sur le device | `start.sh:20` `docker compose up` | +300-700 Mo |
| Total avec Docker on-device | | ~1,3-2,2 Go |

Le cache medias de 2 Go est sur disque, pas en RAM (`media-cache.service.ts` -> `writeFileSync`, page cache
evictable) ; il ne constitue pas une pression RAM critique.

Conclusion arithmetique : le pire cas realiste (~2,2 Go) tient dans 4 Go avec une marge d'environ 45 %.

### Impact budgetaire

- Delta 4 Go (~75 USD) vs 8 Go (~95 USD) = ~20 USD, soit environ 18-19 EUR par unite.
- Sur 6 miroirs : ~110-120 EUR one-shot, soit environ 1,1 % du TCO materiel.
- L'economie est reelle mais marginale. Le vrai levier de cout n'est pas la RAM mais l'ecran
  (700-900 EUR par unite, a chiffrer fermement) et l'arbitrage IA cloud vs NPU local.

### Statut epistemique

Aucune mesure RAM n'existe dans le depot (grep `free -m | VmRSS | process.memory` = 0). Le footprint 4 Go
est donc une hypothese d'ingenierie, pas un fait mesure. Pour le transformer en fait, produire l'artefact :
lancer le kiosk en regime nominal 24/7 et capturer `free -m` + `cat /proc/<pid_electron>/status | grep VmRSS`
toutes les heures pendant 48 h, pics inclus (sync medias, capture base64 pleine resolution, analyse IA).
Si le regime stationnaire reste < 2,5 Go sans fuite, 4 Go est formellement validable.

**Formulation soutenance :** "4 Go retenu pour le MVP sur la base du footprint code (~1-2,2 Go), economie
~115 EUR sur le parc, sous reserve de validation par mesure 48 h." Decision liee : trancher si le Docker
PostgreSQL tourne sur le device (sinon le footprint baisse encore).

---

## 2. Claims a corriger (tries par gravite)

| # | Claim audite | Source | Verdict | Niveau / Conf. | Correction a appliquer |
|---|---|---|---|---|---|
| 1 | "H.264 decode materiel disponible sur Pi 5 (VideoCore VII)" | `smart_mirror_specs_techniques.md:67` | REFUTE (factuellement inverse) | L2 / 88% | Le Pi 5 (BCM2712) a supprime le decodeur H.264 hardware. Seul HEVC/H.265 est materiel (4K60). Ecrire : "HEVC 4K60 hardware ; H.264/VP9/AV1 en logiciel CPU ; aucun encodeur video hardware". |
| 2 | "Flux 100 % local, les photos ne sortent jamais du miroir" | `CDC_Fonctionnel §8.2 l.412` | REFUTE | L1 / 92% | Le live microscope est local (MJPEG sur `localhost:9100`), mais le service IA reel (`crm/ia-service:3002`, cote serveur CRM) envoie le JPEG complet en base64 au cloud. La photo quitte le perimetre. Ecrire : "live microscope local ; le snapshot transmis a l'analyse IA quitte le device vers le cloud". |
| 3 | "Provider IA = OpenRouter" | doc IA, chapitre V | REFUTE | L1 / 95% | OpenRouter n'apparait dans aucun code executable (.js/.ts/.py = 0), uniquement dans la documentation. Le service IA reel appelle GitHub Models (`models.inference.ai.azure.com`, Azure US), auth `Bearer GITHUB_TOKEN`, modeles vision Llama-3.2-11B-Vision / Phi-3.5-vision / gpt-4o-mini (`crm/ia-service/src/server.js:12,78,83,174`). Remplacer OpenRouter par GitHub Models / Azure partout. |
| 4 | "Transfert hors UE : un DPA suffit" | `CDC_Technique §15.3 l.892` | REFUTE | L1/L2 / 92% | DPA (art. 28) n'est pas une base de transfert (chapitre V). Le service IA envoie l'image vers GitHub Models / Azure (US). Exiger DPA + DPF/SCC + TIA (Schrems II). Le consentement art. 49 est invalide pour un transfert systematique. Si finalite medicale revendiquee : consentement explicite art. 9(2)(a). |
| 5 | "Backend Laravel embarque sur le miroir (Sanctum)" | dossier device | REFUTE | L1 / 95% | Le backend du device est un mock Express/Node.js (`smart-mirror/mock-api/src/server.js`, deux apps Express : mock API "Laravel" port 8100 + proxy IA port 3001). Le `package.json` indique lui-meme "Mock API simulating Laravel backend". Le vrai Laravel 13 est le CRM separe (`crm/backend`) et/ou une CIBLE roadmap, pas le backend embarque. |
| 6 | "Stockage local SQLite sur le device" | dossier device | REFUTE | L1 / 97% | Aucun SQLite cote device (0 dependance, 0 usage ; seul match = `Thumbs.db` du `.gitignore`). Stockage local reel : electron-store (config) + fichier JSON chiffre `sync-queue.json` + fichiers `.jpg.enc`. La base serveur est PostgreSQL 15 en SQL brut via `pg`, aucun ORM. SQLite n'existe que cote CRM Laravel et dans la documentation. |
| 7 | "Analyse IA on-device via OpenCV sur CPU du Pi" | dossier IA | REFUTE | L1 / 95% | Aucun OpenCV / cv2 / Haar / cascade dans le code (grep = 0). Le chemin par defaut de l'app est un MOCK : scores `Math.random`, latence `setTimeout`, modele en dur, image recue mais jamais utilisee (`server.js:518-549`). Aucune vision CPU locale n'existe. |
| 8 | "Live preview H.264 via MSE (MediaSource)" | `README`, dossier device | REFUTE | L1 / 95% | Aucune API `MediaSource`/`SourceBuffer`/`appendBuffer` dans `smart-mirror` (grep = 0). Le live preview est un flux MJPEG affiche dans une balise `<img src=http://localhost:9100/stream.mjpg>` (`SessionScreen.tsx:153-156`). Le H.264 (source TCP microscope) est transcode en MJPEG par ffmpeg cote proxy ; le renderer ne recoit jamais de H.264. |
| 9 | "ffmpeg en cours de retrait / depreciation" | dossier device | REFUTE | L2 / 85% | ffmpeg est au coeur des deux implementations de proxy (Node `proxy.js`, service systemd actif ; Python `stream.py`, alternative). Aucun chemin alternatif ne le contourne. ffmpeg est central et non deprecie. |
| 10 | "PostgreSQL 16 + Redis 7 + port IA 3002 (device)" | `README.md:24,51,18` | REFUTE | L1 / 95-98% | Code device : `postgres:15-alpine`, aucun Redis, proxy IA = port 3001 (`docker-compose.yml`, `config.service.ts:44`). PostgreSQL 16 et Redis 7 sont des CIBLES roadmap a etiqueter. Le port 3002 designe le service IA reel cote serveur CRM, pas le device. |
| 11 | "Stack Bun / Supabase / Budibase / Vercel" | `smart_mirror_specs_techniques.md §9-10` | REFUTE (obsolete) | L1 / 95% | Stack abandonnee, contredit la stack reelle. Marquer OBSOLETE ou reecrire. Stack device reelle : Electron 33, React 19, TypeScript 5.7, Zustand 5, Node.js (mock + proxies), Python (`stream.py`), ffmpeg ; serveur : PostgreSQL 15 / Docker. Laravel = CIBLE roadmap. |
| 12 | "Aucun concurrent / first-mover advantage" | `CDC_DreamTech.md:47,557,563,643` | REFUTE | L1 / 95% | Concurrents directs confirmes : L'Oreal/Kerastase K-Scan, BECON (coreen, Samsung), FotoFinder, Aram Huvis. Remplacer "aucun concurrent" par une differenciation par integration verticale et ajouter une section analyse concurrentielle. |
| 13 | "VPS Scaleway 30-35 EUR/mois (4 vCPU 8 Go)" | `CDC_Technique 14.1 l.836` | REFUTE (sous-estime) | L2 / 80% | Reel : DEV1-XL ~47 EUR (12 Go), GP1-XS ~68 EUR (16 Go). Corriger en 45-70 EUR/mois. |
| 14 | "Pi 5 8 Go ~90 EUR" | `CDC_Technique 14.2 l.850` | REFUTE (sous-estime) | L2 / 80% | Reel UE 2026 : ~150-200 EUR (tension RAM). Total materiel hors ecran a recalculer a ~250-290 EUR/unite. |
| 15 | "~35 tests unitaires + 65+ tests" / "178 cas" / "crm-sync sans test" | dossier device | REFUTE | L1 / 95% | Reel : 196 cas = 60 unitaires (Vitest, 5 services) + 136 e2e (Playwright, 4 specs). Repartition unitaire : api-client 14, config 14, crm-sync 18, crypto-vault 7, sync 7. `crm-sync.service.test.ts` existe bel et bien (18 cas) et n'est pas un trou. 5/9 services couverts en unitaire. Ne jamais annoncer 178, 42 ou 65+. |
| 16 | "Double WiFi gere automatiquement" | `CDCT:268`, `DOSSIER:62` | REFUTE (non implemente) | L1 / 90% | `wifi.service.ts` ne gere que `wlan0`. Marquer comme CIBLE : "necessite dongle USB + config manuelle, non automatise en V1". |
| 17 | "Deps lourdes (react-tsparticles, framer-motion)" | `package.json` | REFUTE | L1 / 95% | framer-motion absent ; tsparticles declare mais jamais importe (0 hit en `src/`). Supprimer ces dependances mortes. |
| 18 | "Cosmetique donc art. 9 RGPD ne s'applique pas" | `AUDIT §0 l.18` | PARTIEL (sur-affirme) | L3 / 70% | Tant que la finalite reste cosmetique sans diagnostic medical, art. 9 ne s'applique en principe pas. Mais la qualification est fragile (donnee deductible). Reformuler en "approche par precaution art. 9 + cadrage strict cosmetique non medical", pas "art. 9 ne s'applique pas". |
| 19 | "Pas besoin d'HDS (tranche)" | `CDC_Technique §15.1` | PARTIEL (premature) | L2 / 65% | Depend de la qualification art. 9. Ecrire "decision provisoire sous reserve DPO ; bascule hebergeur HDS budgetee", pas "tranche/resolu". |
| 20 | "Microscope USB (Ninyoon)" | `README l.3` | TRANCHE (WiFi) | L1 / 95% | Connexion reelle = WiFi/TCP `192.168.34.1:8080`, handshake JHCMD, flux H.264 transcode en MJPEG sur `localhost:9100`. Les references USB/UVC/V4L2 (udev `99-microscope.rules`, `/dev/video0`, v4l2-ctl) sont des vestiges morts non consommes par le pipeline. Trancher le WiFi comme defaut partout. |
| 21 | "Coherence chiffrages materiel (1035 vs 180 EUR)" | `CDC_DreamTech 12.4` vs `CDC_Tech 14.2` | PARTIEL | L4 / 55% | Incoherences de BOM (boitier, alim 27W et refroidisseur actif absents des deux nomenclatures, ~+20 EUR/unite). A consolider. |

---

## 3. Claims confirmes (forces verifiees, a conserver)

| Claim | Source | Niveau / Conf. |
|---|---|---|
| Chiffrement au repos AES-256-GCM via CryptoVault (photos `.jpg.enc`, file de sync JSON, secrets de config) ; throw en production sans cle maitre | `crypto-vault.service.ts:15,17-19,35-61` ; `sync.service.ts:60,112-121` ; `config.service.ts:95,104` | L1 / 97% |
| crm-sync dechiffre les `.jpg.enc` avant upload et retire le suffixe `.enc` du nom distant | `crm-sync.service.ts:317,323` | L1 / 95% |
| safeStorage Electron non utilise en production (uniquement mock de test), remplace par CryptoVault | `crypto-vault.service.ts:7-8` ; `src/__mocks__/electron.ts:8` | L1 / 95% |
| Durcissement Electron : `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`, CSP appliquee en production via `onHeadersReceived` (garde `!is.dev`) | `index.ts:52-53,121-144` | L1 / 95% |
| Verrou consentement RGPD a deux niveaux : FK `consentement_id` NOT NULL en base + refus serveur HTTP 422 si absent, introuvable ou revoque | `init.sql:59` ; `server.js:166-177` | L1 / 95% |
| Offline-first : photo chiffree ecrite sur disque PUIS ajoutee a la file avant tout reseau ; retry par reempilage sur erreur | `sync.service.ts:57-83,123-146` | L1 / 95% |
| Retention 30 jours + purge `cleanupExpiredPhotos` dans le polling, jamais sur les items encore en file | `sync.service.ts:43,152-180` | L1 / 95% |
| File de sync = fichier JSON chiffre, aucun broker (pas de MQTT/Redis/AMQP) ; polling 30 s, heartbeat 60 s | `sync.service.ts:8,39-49,98,113` | L1 / 95% |
| Microscope WiFi/TCP `192.168.34.1:8080`, handshake JHCMD, ffmpeg `-r 15 -q:v 5` | `proxy.js:16-17,39,42-64` (concordance au byte pres) | L1 / 95% |
| Versions frontend : Electron 33, React 19, TypeScript 5.7, Zustand 5 | `package.json:41,26-27,46,29` | L1 / 95% |
| PostgreSQL 15, port IA 3001, Node 20 LTS | `docker-compose.yml:3,25` ; `config.service.ts:44` | L1 / 95% |
| CI GitHub Actions presente : `ci.yml`, `playwright.config`, ESLint flat config `eslint.config.mjs`, section coverage `vitest.config.ts` (provider v8) | depot | L1 / 95% |
| Build electron-builder : deb + AppImage pour arm64 ET x64 (Linux uniquement), aucune cible Windows/macOS ; publish provider generic via `UPDATE_SERVER_URL` | `electron-builder.yml` ; `package.json:10-12` | L1 / 95% |
| Throttle thermique Pi 5 : soft 80 C / hard 85 C | doc officielle RPi | L1 / 95% |
| Boitier -28 % epaisseur sans NVMe ((40,7-29,3)/40,7 = 28,0 %) | `SPECS.md` (calcul exact) | L1 / 92% |
| RED art. 3.3 cybersecurite applicable (depuis 01/08/2025) | Reglement delegue 2022/30 | L1/L2 / 90% |
| CRA echeances : signalement vuln 11/09/2026, SBOM 11/12/2027 | Reglement 2024/2847 | L1/L2 / 88% |

---

## 4. Modele de donnees : 9 tables vs 8 entites

Point a expliciter sans ambiguite au jury.

- `init.sql` contient 9 tables : boutiques, clientes, consentements, miroirs, seances, photos, produits,
  medias, **config_miroir** (`grep -c 'CREATE TABLE' = 9`).
- Le MCD contient 8 entites : BOUTIQUE, CLIENTE, CONSENTEMENT, MIROIR, SEANCE, PHOTO, PRODUIT, MEDIA
  (`docs/diagrammes/01-mcd.mmd`).
- L'ecart est la table technique `config_miroir` (configuration UI du miroir), presente en base mais
  absente du MCD car non conceptuelle. Les 8 entites MCD correspondent 1:1 a une table SQL.
- Divergences de nommage a documenter : MIROIR (MCD `adresse_mac/token_device/en_ligne` vs SQL
  `device_token/is_online/ip_address`, pas de colonne `adresse_mac`) ; PRODUIT (MCD `mis_en_avant` vs SQL
  `affiche_miroir`).

---

## 5. Chaine d'analyse IA et souverainete (REALISE vs CIBLE)

Le projet distingue deux chemins, a ne jamais confondre.

- **Chemin par defaut de l'app (REALISE, mock).** L'app miroir pointe vers `IA_PROXY_URL ||
  http://localhost:3001`, le proxy mock : scores `Math.random`, latence `setTimeout`, image recue mais
  jamais utilisee (`server.js:518-549`, `config.service.ts:44`). Aucun appel reseau, aucune vision reelle.
- **Service IA reel (REALISE cote serveur CRM, non on-device).** `crm/ia-service/src/server.js` (port 3002,
  deploye via `crm/docker-compose.yml` + Traefik `kbeauty-ia`) realise un vrai `fetch` vers GitHub Models
  (`models.inference.ai.azure.com`, Azure US) et **envoie la photo JPEG complete en base64** en vision
  multimodale (`image_url`), auth `Bearer GITHUB_TOKEN`, modeles Llama-3.2-11B-Vision / Phi-3.5-vision /
  gpt-4o-mini. L'app miroir ne pointe vers ce service dans aucune configuration par defaut.

Consequence RGPD : dans le chemin IA reel, la photo de cuir chevelu quitte le perimetre vers un cloud US.
C'est le coeur de la question de souverainete. OpenRouter n'est appele dans aucun code (documentation
uniquement) et ne doit pas etre presente comme le provider actif.

La strategie de souverainete en trois versions (CIBLE) est detaillee dans `docs/SOUVERAINETE-IA-3-VERSIONS.md` :

- V1 cloud actuel : analyse via cloud US, souverainete faible, dependance internet totale.
- V2 cloud souverain UE (Mistral AI, hebergement UE par defaut, ZDR + DPA + endpoint EU) : supprime le
  transfert hors UE et la retention. L'image quitte toujours le miroir (souverainete n'est pas
  confidentialite totale).
- V3 premium 100 % local offline : classification CNN dediee sur NPU Hailo-8 (Voie A, realiste aujourd'hui,
  sortie = labels + scores), ou petit VLM generatif local sur Hailo-10H / AI HAT+ 2 (Voie B, prospective).
  Seule version ou rien ne sort du miroir.

---

## 6. Securite et CI : etat reel des gates

Etat factuel des barrieres CI (`.github/workflows/ci.yml`), a presenter sans surevaluation.

- **Bloquants** : `npm audit --omit=dev --audit-level=critical` (CRITICAL/prod uniquement, sans
  continue-on-error, `:41-42`) et job `secrets-scan` gitleaks (`:64-74`, sans continue-on-error).
- **Non bloquants** (`continue-on-error: true`) : `npm audit --audit-level=high` (high/dev, `:47-49`),
  SBOM CycloneDX (`:51-53`, upload artifact), Semgrep (`:76-85`, malgre `--error`).

Ne pas presenter SBOM ni Semgrep comme des gates bloquants. Reste a produire pour completer la demarche
qualite : le rapport `vitest run --coverage` avec seuil, et le passage de l'audit high en bloquant si
souhaite.

Chiffrement et secrets (REALISE) : photos `.jpg.enc`, file de sync et tokens (device.token, crmToken,
crmBearerToken) chiffres au repos en AES-256-GCM via CryptoVault ; format payload
`[version 1o || IV 12o || authTag 16o || ciphertext]` ; cle maitre par priorite env
`SMART_MIRROR_MASTER_KEY` -> `CREDENTIALS_DIRECTORY` (systemd-creds) -> `MASTER_KEY_FILE` -> fallback dev
0600, avec throw en production sans cle. Gaps assumes restants : whitelist sur l'exposition `config:getAll`
et durcissement du backend mock.

---

## 7. Claims non verifiables sans artefact

| Claim non verifiable | Artefact a produire |
|---|---|
| Footprint RAM reel (4 Go suffisent) | `free -m` + `VmRSS` toutes les heures sur 48 h en kiosk 24/7 |
| Couverture de tests (% reel) | `vitest run --coverage` avec seuils, rapport publie (bloc coverage deja present en config) |
| Volume et atteignabilite des CVE | Re-executer `npm audit` la veille de la soutenance + SBOM CycloneDX ; PoC pour l'atteignabilite |
| Qualification RGPD art. 9 (donnee de sante) | Avis DPO/juriste + cartographie des sous-traitants du service IA cloud |
| Prix ferme ecran (~800 EUR) | Devis fournisseur (vraie incertitude du TCO) |
| Risque thermique ambiant > 50 C derriere ecran | Mesure IR arriere ecran |
| Endurance microSD kiosk 24/7 | Spec endurance industrielle + monitoring d'usure |

---

## 8. Top 10 des corrections prioritaires

1. **Codec Pi 5** (`smart_mirror_specs_techniques.md:67`) : remplacer "acceleration H.264 hardware" par
   "HEVC/H.265 4K60 hardware uniquement ; H.264/VP9/AV1 en logiciel CPU ; aucun encodeur video hardware".
2. **Backend device** : remplacer toute mention de backend Laravel/Sanctum embarque par mock Express/Node.js
   (`smart-mirror/mock-api/src/server.js`, ports 8100 API + 3001 IA). Le vrai Laravel 13 est le CRM separe
   (`crm/backend`) et/ou une CIBLE roadmap.
3. **Stockage et stack** : supprimer SQLite et OpenCV de la stack device (inexistants). Stockage local =
   electron-store + `sync-queue.json` chiffre + `.jpg.enc` ; base serveur = PostgreSQL 15 (SQL brut via `pg`).
4. **Provider IA** : remplacer OpenRouter par GitHub Models (`models.inference.ai.azure.com`, auth
   `GITHUB_TOKEN`, modeles Llama-3.2-11B-Vision / Phi-3.5-vision / gpt-4o-mini). OpenRouter n'est appele
   dans aucun code.
5. **Confidentialite IA** : corriger "la photo ne quitte jamais le device". Le service IA reel
   (`crm/ia-service:3002`, cote serveur) envoie le JPEG complet en base64 vers un cloud US. Documenter
   l'impact RGPD (transfert d'image hors UE) et exiger DPA + DPF/SCC + TIA.
6. **Video** : remplacer "H.264 via MSE" par flux MJPEG (`multipart/x-mixed-replace`) dans `<img>`, port
   9100. Le H.264 source est transcode en MJPEG par ffmpeg cote proxy. Supprimer "ffmpeg en retrait".
7. **Microscope** : confirmer WiFi/TCP `192.168.34.1:8080` + handshake JHCMD. Mentionner que les references
   USB/UVC/V4L2 sont des vestiges morts non utilises par le pipeline.
8. **Tests** : harmoniser sur 196 cas = 60 unitaires (api-client 14, config 14, crm-sync 18, crypto-vault 7,
   sync 7) + 136 e2e Playwright (4 specs). Corriger toute mention de 178, 42 ou 65+, et toute affirmation que
   crm-sync n'aurait pas de test (il en a 18).
9. **Modele de donnees** : expliciter 9 tables `init.sql` vs 8 entites MCD (ecart = `config_miroir`) et les
   divergences de nommage (MIROIR `device_token/is_online/ip_address` ; PRODUIT `affiche_miroir`).
10. **Budget et BOM** : Pi 5 ~150-200 EUR, VPS 45-70 EUR/mois, ajouter alim 27W et refroidisseur actif aux
    nomenclatures ; total materiel hors ecran ~250-290 EUR/unite. Supprimer les dependances mortes
    `react-tsparticles` et `framer-motion`.

---

## 9. Blocs fact-check des trois claims les plus risques

```
┌─ FACT-CHECK ──────────────────────────────────────────────────┐
│ Claim     : "Flux 100 % local / la photo ne quitte jamais le  │
│              miroir, cloud datacenter europeen"               │
│ Domain    : compliance                                        │
│ Verdict   : BLOCKED (REFUTE — contredit par le code)          │
│ Source    : crm/ia-service/src/server.js:174 (JPEG base64 ->  │
│              GitHub Models / Azure US) ; RGPD art.28 vs        │
│              chap. V (art.44-46,49) ; CJUE C-311/18.          │
│ Confiance : 92% (L1/L2)                                       │
│ Challenge : Le service IA reel envoie l'image complete vers un │
│             cloud US. Un DPA encadre la sous-traitance, PAS le │
│             transfert hors EEE. Ou sont le DPF/les SCC + le    │
│             TIA ? Affirmer "cloud EU / 100 % local" est        │
│             trompeur tant que GitHub Models/Azure est dans la  │
│             boucle. Parade : V2 cloud souverain UE (Mistral)   │
│             ou V3 classification locale (scores anonymises).   │
└───────────────────────────────────────────────────────────────┘
```

```
┌─ FACT-CHECK ──────────────────────────────────────────────────┐
│ Claim     : "VideoCore VII — acceleration H.264 hardware       │
│              disponible (Pi 5)"                               │
│ Domain    : performance / materiel                            │
│ Verdict   : REFUTE (factuellement inverse)                    │
│ Source    : RPi Foundation (page codecs officielle) ;         │
│              specs_techniques:67.                             │
│ Confiance : 88% (L2)                                          │
│ Challenge : Le Pi 5 (BCM2712) a supprime le decodeur H.264    │
│             hardware du Pi 4. Seul HEVC/H.265 est hardware     │
│             (4K60). H.264/VP9/AV1 = logiciel CPU ; aucun       │
│             encodeur video hardware. Dans le projet, c'est     │
│             ffmpeg (CPU) qui transcode le H.264 du microscope  │
│             en MJPEG — coherent avec cette limite materielle.  │
└───────────────────────────────────────────────────────────────┘
```

```
┌─ FACT-CHECK ──────────────────────────────────────────────────┐
│ Claim     : "Aucun concurrent n'existe / first-mover           │
│              advantage"                                        │
│ Domain    : general (marche)                                  │
│ Verdict   : REFUTE                                            │
│ Source    : sites officiels constructeurs (L'Oreal K-Scan,    │
│              BECON, FotoFinder, Aram Huvis) ;                 │
│              CDC_DreamTech:47,557,563,643.                    │
│ Confiance : 95% (L1 sur l'existence des concurrents)          │
│ Challenge : K-Scan (camera + IA cuir chevelu en salon) et     │
│             BECON (coreen, finance Samsung) sont quasi         │
│             identiques. La differenciation reelle =           │
│             integration verticale microscope WiFi bas cout +  │
│             CRM, PAS l'absence de concurrents. Risque          │
│             d'allegation comparative fausse.                   │
└───────────────────────────────────────────────────────────────┘
```

---

## 10. Synthese executive pour le jury

Les forces du MVP sont solides et verifiees : chiffrement au repos AES-256-GCM via CryptoVault (photos,
file de sync, tokens, avec throw en production sans cle), durcissement Electron (sandbox, contextIsolation,
CSP en production), verrou consentement RGPD a deux niveaux (FK NOT NULL + refus HTTP 422), pipeline
microscope WiFi/TCP JHCMD coherent au byte pres, offline-first reel avec retention/purge maitrisee, et une
couverture de 196 tests (60 unitaires sur 5 services dont crm-sync = 18, plus 136 e2e Playwright).

Les trois points a redresser dans la documentation avant soutenance sont : (a) la souverainete IA, ou le
service reel envoie la photo vers un cloud US via GitHub Models (et non OpenRouter), ce qui impose un cadrage
RGPD chapitre V ; (b) le claim codec H.264 hardware, factuellement inverse sur Pi 5 ; (c) le "aucun
concurrent", refutable en une recherche. La decision RAM 4 Go est defendable comme choix d'ingenierie
conditionne a une mesure 48 h, jamais comme fait mesure.

Fichiers cles (chemins absolus, verifies directement) :

- `C:\Users\adria\Documents\Projets\PROJET\projet-miroirIoT\smart-mirror\mock-api\src\server.js` (mock Express device : API "Laravel" 8100 + proxy IA 3001, IA mockee `:518-549`)
- `C:\Users\adria\Documents\Projets\PROJET\projet-miroirIoT\crm\ia-service\src\server.js` (service IA reel port 3002 -> GitHub Models / Azure US, `:12,78,83,174`)
- `C:\Users\adria\Documents\Projets\PROJET\projet-miroirIoT\smart-mirror\mirror-app\src\main\index.ts` (`sandbox: true` `:52`, CSP prod `:121-144`)
- `C:\Users\adria\Documents\Projets\PROJET\projet-miroirIoT\smart-mirror\mirror-app\src\main\services\crypto-vault.service.ts` (coffre AES-256-GCM)
- `C:\Users\adria\Documents\Projets\PROJET\projet-miroirIoT\smart-mirror\mirror-app\src\main\services\sync.service.ts` (photo chiffree `.jpg.enc`, file JSON chiffree)
- `C:\Users\adria\Documents\Projets\PROJET\projet-miroirIoT\smart-mirror\mirror-app\src\main\services\crm-sync.service.test.ts` (18 cas unitaires)
- `C:\Users\adria\Documents\Projets\PROJET\projet-miroirIoT\smart-mirror\microscope-proxy\proxy.js` (WiFi/TCP JHCMD, ffmpeg H.264 -> MJPEG port 9100)
- `C:\Users\adria\Documents\Projets\PROJET\projet-miroirIoT\smart-mirror\docker-compose.yml` (postgres:15, ports 8100/3001, pas de Redis)
- `C:\Users\adria\Documents\Projets\PROJET\projet-miroirIoT\smart-mirror\init.sql` (9 tables dont config_miroir, verrou consentement)
- `C:\Users\adria\Documents\Projets\PROJET\projet-miroirIoT\.github\workflows\ci.yml` (bloquants : audit critical/prod + gitleaks ; non bloquants : audit high, SBOM, Semgrep)
- `C:\Users\adria\Documents\Projets\PROJET\projet-miroirIoT\smart-mirror\mirror-app\electron-builder.yml` (deb + AppImage, arm64 et x64)
