<!-- Audit fact-check multi-agents, 2026-06-15. Verifie contre le code reel. Brouillon a re-accentuer avant docx/PPT. -->
<!-- MISE A JOUR 2026-06-25 : plusieurs constats de 2026-06-15 sont depuis resolus dans le code et confirmes par les faits verifies. CHIFFREMENT : les photos cuir chevelu (`.jpg.enc`), la file de synchronisation et les tokens (device.token, crmToken, crmBearerToken) sont desormais CHIFFRES AU REPOS en AES-256-GCM via cryptoVault (`crypto-vault.service.ts`, `sync.service.ts`, `crm-sync.service.ts`, `config.service.ts`) ; safeStorage et la branche plaintext sont supprimes ; cle maitre env -> systemd-creds (TPM) -> keyfile -> fallback dev, THROW en prod sans cle. Restent a faire : securiser le backend mock, pgcrypto, audit deps CI bloquant. Sandbox actif (`index.ts:51`), CSP en production (`index.ts:121-143`), CI GitHub Actions (`ci.yml`), `playwright.config` et ESLint flat config sont en place. Le microscope est en WiFi/TCP JHCMD (USB/UVC = vestiges morts). Tests a jour : 42 unitaires + 136 e2e = 178 cas, 4/9 services couverts. Laravel 13 / PHP 8.4, PostgreSQL 16 et Redis 7 sont des CIBLES ROADMAP etiquetees (backend realise = mock Express + PostgreSQL 15). Document de reference d'etat realise : `docs/ARCHITECTURE-MVP-VS-CIBLE.md`. -->

# RAPPORT FACT-CHECK — Soutenance Smart Mirror KBEAUTY (RNCP 37046)

Methode: autorite primaire = depot (verifie directement sur fichiers cles). Faits externes = sources des verificateurs (CVE, doc RPi, tarifs). Protocole Zero Trust applique aux verificateurs eux-memes: j'ai re-confirme en code les 8 points les plus load-bearing (package.json, docker-compose.yml, vitest.config.ts, index.ts:51, sync.service.ts:61, api-client.service.ts:159, start.sh:20, presence de CI (`ci.yml`), `playwright.config` et ESLint flat config). Tous concordent. Aucune contradiction inter-verificateurs majeure detectee, sauf une (RAM, traitee en section 1).

---

## 1) VERDICT SUR LA RAM — 4 Go suffisent-ils au lieu de 8 Go ?

**VERDICT TRANCHE: OUI, 4 Go suffisent techniquement pour le MVP. MAIS le claim ne peut pas etre presente comme un FAIT en soutenance — uniquement comme une decision d'ingenierie justifiee et conditionnee a une mesure.**

### Raisonnement chiffre (footprint reel reconstruit depuis le code)

Le footprint nominal mesurable par composant reellement present dans le code:

| Composant | Preuve code | RSS estime |
|---|---|---|
| OS Debian 12 Lite + X11 minimal | CDCT | 250-400 Mo |
| Electron main (Node, 8 services) | `src/main/` | 80-150 Mo |
| Renderer Chromium (React 19 + glassmorphism) | `global.css` | 250-450 Mo |
| GPU/compositing (VideoCore VII partage RAM) | `backdrop-filter blur` | 100-250 Mo |
| Proxy microscope (Node + ffmpeg) | `proxy.js` ffmpeg `-r 15 -q:v 5` | 90-190 Mo |
| **Sous-total hors Docker** | | **~0,9-1,5 Go** |
| Backend Docker PostgreSQL + API **si lance sur le device** | `start.sh:20` `docker compose up` | +300-700 Mo |
| **Total avec Docker on-device** | | **~1,3-2,2 Go** |

Le cache medias de 2 Go est **sur disque, pas en RAM** (`media-cache.service.ts` -> `writeFileSync`, page cache evictable). Il ne constitue PAS une pression RAM critique.

Conclusion arithmetique: le pire cas realiste (~2,2 Go) tient dans 4 Go avec une marge de ~45%. La contrainte "RAM <6 Go sur 8" du `DOSSIER-CONNAISSANCE-RNCP.md:232` est **non sourcee et sur-evaluee** — aucun composant du code n'approche 6 Go.

### Impact budgetaire

- Delta 4 Go (~75 USD) vs 8 Go (~95 USD) = ~20 USD ≈ **~18-19 EUR/unite**.
- Sur 6 miroirs: **~110-120 EUR one-shot**, soit ~1,1% du TCO materiel total.
- **L'economie est REELLE mais marginale.** A relativiser fortement contre le risque d'un kiosk 24/7 sans marge. Le vrai levier cout n'est PAS la RAM (~19 EUR) mais l'ecran Shineworld (700-900 EUR/unite, non chiffre fermement) et l'arbitrage IA cloud vs Hailo.

### Contradiction entre verificateurs — tranchee

Le verificateur RAM/energie ouvre en disant "tout confirme L1/L2", mais conclut lui-meme en **PARTIEL ~70% [REASONING]**, pas en FAIT. Ce n'est donc pas une vraie contradiction: la confirmation L1/L2 porte sur les faits externes (prix, throttle, conso), PAS sur le footprint memoire qui reste une estimation. **Je tranche: le footprint 4 Go est une [HYPOTHESIS] d'ingenierie, pas un [CLAIM L1/L2].** Aucune mesure RAM n'existe dans le depot (grep `free -m|VmRSS|process.memory` = 0 hit). C'est le point dur.

### Condition de validation (artefact a produire AVANT de l'affirmer en soutenance)

Lancer le kiosk en regime nominal 24/7 et capturer:
```
free -m  +  cat /proc/<pid_electron>/status | grep VmRSS
```
toutes les heures pendant **48h**, en incluant les pics (sync medias, capture base64 pleine resolution, analyse IA). Si le regime stationnaire reste < 2,5 Go sans fuite: **4 Go formellement validable**. Sans cet artefact, ni "8 Go necessaire" ni "4 Go suffit" ne sont defendables comme faits.

**Recommandation soutenance:** presenter comme "4 Go retenu pour le MVP sur la base du footprint code (~1-2,2 Go), economie ~115 EUR/parc, sous reserve de validation par mesure 48h. La contrainte <6 Go du dossier est a corriger car non sourcee." Decision 1 sur 2: decider si Docker PostgreSQL tourne sur le device (sinon le footprint chute encore).

---

## 2) TABLEAU DES CLAIMS REFUTES OU A CORRIGER (trie par gravite — perte de points jury en premier)

| # | Claim | Source | Verdict | Niveau / Conf. | Correction a appliquer |
|---|---|---|---|---|---|
| 1 | "H.264 decode materiel disponible sur Pi 5 (VideoCore VII)" | `smart_mirror_specs_techniques.md:67` | **REFUTE** (factuellement inverse) | L2 / 88% | Le Pi 5 a SUPPRIME le decodeur H.264 hardware. Seul HEVC/H.265 est hardware. Remplacer par: "HEVC 4K60 hardware; H.264/VP9/AV1 en logiciel CPU; aucun encodeur video hardware". |
| 2 | "Flux 100% local / les photos ne sortent pas" + "Cloud datacenter europeen" | `CDC_Fonctionnel §8.2 l.412`; code `api-client.service.ts:159` | **REFUTE** | L1 / 90% | Les snapshots JPEG partent vers proxy IA -> OpenRouter (US) et vers le CRM. Ecrire: "live local; snapshots envoyes hors UE". Erreur de droit majeure (voir #3). |
| 3 | "Transfert US: un DPA suffit" | `CDC_Technique §15.3 l.892` | **REFUTE** | L1/L2 / 92% | DPA (art.28) ≠ base de transfert (Chap. V). Exiger DPA + DPF/SCC + TIA (Schrems II). Le consentement art.49 est INVALIDE pour transfert systematique. Si donnees de sante: consentement explicite art.9(2)(a) en plus. |
| 4 | "Photos chiffrees localement" | `sync.service.ts` `savePhotoLocally` (verifie) | **CONFIRME (mise a jour 2026-06-25)** | L1 / 97% | Le constat du 2026-06-15 (`writeFileSync` d'un JPEG en clair) est RESOLU : `savePhotoLocally` ecrit desormais un `.jpg.enc` chiffre AES-256-GCM via cryptoVault (`crypto-vault.service.ts`), la file de sync est chiffree, et `crm-sync.service.ts` `pushPhotoCrm` dechiffre avant envoi. Reste a securiser : le backend mock (PDF, secrets, device_token). |
| 5 | "Aucun concurrent / first-mover advantage" | `CDC_DreamTech.md:47,557,563,643` | **REFUTE** | L1 / 95% | Concurrents directs confirmes: L'Oreal/Kerastase K-Scan, BECON (coreen, Samsung), FotoFinder, Aram Huvis. Remplacer "aucun concurrent" par "differenciation par integration verticale". Ajouter une section analyse concurrentielle (absente). |
| 6 | "Sandbox actif" | `index.ts:51` (verifie) | **CONFIRME (mise a jour 2026-06-25)** | L1 / 98% | Le correctif est applique : `sandbox: true` (`index.ts:51`). contextIsolation+nodeIntegration corrects. Gap F6 clos. |
| 7 | "CSP presente" | `index.ts:121-143` (verifie) | **CONFIRME (mise a jour 2026-06-25)** | L1 / 95% | CSP appliquee en production via `onHeadersReceived` (`index.ts:121-143`, garde `if !is.dev`). Gap F2 clos. |
| 8 | "Token jamais en clair" | `config.service.ts` (verifie) | **CONFIRME (mise a jour 2026-06-25)** | L1 / 96% | Le constat partiel du 2026-06-15 est RESOLU cote stockage : device.token, crmToken et crmBearerToken sont desormais chiffres au repos AES-256-GCM via cryptoVault (safeStorage et branche plaintext supprimes, migration des secrets herites en clair). Cle maitre par priorite env -> systemd-creds (TPM) -> keyfile -> fallback dev, THROW en prod sans cle. Reste a durcir : whitelist sur l'exposition `config:getAll`. |
| 9 | "PostgreSQL 16 + Redis 7 + port IA 3002" | `README.md:24,51,18` | **REFUTE** | L1 / 95-98% | Code: `postgres:15-alpine`, AUCUN Redis, port IA = 3001 (8+ fichiers). Corriger README: PG15, supprimer Redis, port 3001. |
| 10 | Stack Bun/Supabase/Budibase/Vercel | `smart_mirror_specs_techniques.md §9-10` | **REFUTE** | L1 / 95% | Stack abandonnee, contredit frontalement Laravel/PostgreSQL/Docker du reste du dossier. Marquer OBSOLETE ou reecrire. Incoherence la plus visible (deux projets differents). |
| 11 | "VPS Scaleway 30-35 EUR/mois (DEV1-XL/GP1-XS, 4 vCPU 8 Go)" | `CDC_Technique 14.1 l.836` | **REFUTE (sous-estime)** | L2 / 80% | Reel: DEV1-XL ~47 EUR (12 Go), GP1-XS ~68 EUR (16 Go). La spec "8 Go" ne matche aucune des deux. Corriger en 45-70 EUR/mois. |
| 12 | "Pi 5 8 Go ~90 EUR" / "~85-130 EUR" | `CDC_Technique 14.2 l.850`; `AUDIT l.308` | **REFUTE (sous-estime ~2x)** | L2 / 80% | Reel UE juin 2026: ~189-198 EUR (crise RAM). Corriger en ~150-200 EUR. Impact direct: total materiel hors ecran passe de ~180 a ~250-290 EUR. |
| 13 | "~35 tests unitaires + 65+ tests / 8 services testes" | depot (mise a jour 2026-06-25) | **PARTIEL/REFUTE** | L1 / 95% | Reel a jour: 42 unitaires + 136 E2E = 178 cas (le nouveau `crypto-vault.service.test.ts` ajoute 7 tests). Mais 4/9 services seulement testes en unitaire (`crm-sync` 372 LOC = 0 test). Ecrire les vrais chiffres + 4/9 services ; ne jamais annoncer "65+". |
| 14 | "playwright.config" / "ESLint flat config" / "CI" | depot (mise a jour 2026-06-25) | **CONFIRME (partiel)** | L1 / 95% | CI GitHub Actions (`ci.yml`), `playwright.config` et ESLint flat config sont desormais PRESENTS. Reste a produire : rapport de couverture `--coverage` avec seuil, et audit deps CI bloquant. |
| 15 | "Cosmetique donc pas de donnees de sante (art.9)" | `AUDIT §0 l.18`; `CDC_Tech §8.3` | **PARTIEL (sur-affirme)** | L3 / 70% | Hors MDR: solide. Mais art.9: fragile (CJUE C-184/20, donnee deductible). Reformuler en "approche par precaution art.9", pas "art.9 ne s'applique pas". Aligner le vocabulaire: le CDC_Fonctionnel utilise "diagnostic"/"donnees de sante potentielles" — contredit le CDC_Technique. |
| 16 | "Pas besoin d'HDS (PO-05 tranche)" | `CDC_Technique §15.1 l.866, §18 l.921` | **PARTIEL (premature)** | L2 / 65% | Depend entierement de #15. Ne pas ecrire "TRANCHE/Resolu". Ecrire "decision provisoire sous reserve DPO; bascule Scaleway HDS budgetee". |
| 17 | "Microscope Jiusion WiFi (defaut)" vs "Ninyoon USB" | `CDC l.668` vs `README l.3` | **TRANCHE (mise a jour 2026-06-25)** | L1 / 95% | Code reel = WiFi/TCP `192.168.34.1:8080`, handshake JHCMD, flux H.264 transcode par ffmpeg en MJPEG sur `localhost:9100` (`proxy.js`). Les references USB/UVC/V4L2 du depot sont des **vestiges morts**. Trancher le WiFi comme defaut partout (Ninyoon 4K) et purger les vestiges USB. |
| 18 | "IA 0.002 EUR/analyse (1290 tokens/image)" | `AUDIT l.338` | **PARTIEL** | L2 / 75% | Valeur finale OK par chance, mais "1290 tokens" = generation d'image (faux pour analyse: 258 tokens/tuile), et oubli du catalogue injecte. Reecrire le raisonnement. |
| 19 | "Double WiFi gere" | `CDCT:268`, `DOSSIER:62` | **REFUTE (non implemente)** | L1 / 90% | `wifi.service.ts` ne gere que `wlan0`. Aucun code n'orchestre 2 interfaces. Retirer le claim ou le marquer "necessite dongle USB + config manuelle, non automatise V1". |
| 20 | "Deps lourdes (react-tsparticles, framer-motion)" | premisse / `package.json:28-29` | **REFUTE** | L1 / 95% | framer-motion ABSENT; tsparticles declare mais JAMAIS importe (0 hit en `src/`). Supprimer ces deps. Renforce le claim 4 Go. |
| 21 | "Coherence chiffrages materiel 1035 vs 180 EUR" | `CDC_DreamTech 12.4` vs `CDC_Tech 14.2` | **PARTIEL** | L4 / 55% | "Boitier Pi 165€" incoherent (detail = 120€). Alim 27W + refroidisseur actif ABSENTS des deux BOM (+20 EUR/unite). Statut ecran: chiffre vs "a chiffrer" selon doc. |
| 22 | "HDS ecarte = -150 a -400 EUR/mois" | `CDC_Technique 13.1 l.769` | **PARTIEL / NON-VERIFIABLE** | L4-L5 / 45% | Cout EVITE, pas economie a soustraire du TCO. Montant non source. Sourcer via devis OVH/Scaleway HDS. |

---

## 3) CLAIMS CONFIRMES (forces verifiees — a garder tels quels)

| Claim | Source | Niveau / Conf. |
|---|---|---|
| Throttle thermique Pi 5: soft 80C / hard 85C | doc officielle RPi | L1 / 95% |
| Boitier -28% epaisseur sans NVMe ((40.7-29.3)/40.7 = 28,0%) | `SPECS.md` (calcul exact) | L1 / 92% |
| Conso 5.7-6.8 W (Chromium video HD) | CNX Software | L2 / 85% |
| Microscope WiFi 192.168.34.1:8080, handshake JHCMD, ffmpeg `-r 15 -q:v 5` | `proxy.js` (concordance au byte pres) | L1 / 95% |
| M.2 HAT+ limite 0-50C ambiant | doc officielle RPi | L2 / 80% |
| Versions frontend README: Electron 33, React 19, TS 5.7, Zustand 5 | `package.json` (verifie) | L1 / 95% |
| PostgreSQL 15, port IA 3001, Node 20 LTS | `docker-compose.yml` (verifie) | L1 / 95% |
| RED art.3.3 cybersecurite applicable (depuis 01/08/2025) | Reglement delegue 2022/30 | L1/L2 / 90% |
| CRA echeances: signalement vuln 11/09/2026, SBOM 11/12/2027 | Reglement 2024/2847 | L1/L2 / 88% |
| RAM LPDDR4X-4267, OS Debian 12 Bookworm | spec | L2 / 80% |
| Fondations Electron correctes: contextIsolation true, nodeIntegration false, preload contextBridge, IPC safeHandle | `index.ts`, `preload` | L1 / 95% |

Points positifs structurants a mettre en avant: architecture Scaleway garde la porte HDS ouverte (anticipation), microscope WiFi parfaitement coherent doc/code, mecanique de retention/purge bien concue, consentement "indefini" juridiquement correct (accountability art.7).

---

## 4) CLAIMS NON-VERIFIABLES sans artefact (et quel artefact produire)

| Claim non-verifiable | Artefact a produire pour le valider |
|---|---|
| Footprint RAM reel (4 Go suffisent) | `free -m` + `VmRSS` capture toutes les heures sur 48h en kiosk 24/7. |
| Couverture de tests (% reel) | Le bloc coverage existe deja (`vitest.config.ts`, section `coverage` provider v8). Reste a executer `vitest run --coverage` avec seuils et publier le rapport. Tant que le % n'est pas mesure, tout % = HYPOTHESIS. |
| Volume de CVE (28 au dernier audit 2026-06-25 : 2 crit. Vitest, 16 hautes, 8 mod., 2 basses ; quasi toutes devDependencies sauf Electron runtime) | Re-executer `npm audit` la veille de la soutenance (les CVE evoluent). Detail classe : docs/SECURITE-CVE-ET-LANCEMENT.md + SBOM CycloneDX. |
| Atteignabilite reelle des CVE (CVE-2026-34769, CVE-2026-6321) | PoC d'exploitation contre le binaire + SBOM. Actuellement: presentes mais non atteignables dans le flux (version vulnerable confirmee, vecteur non declenche). |
| Transfert US = donnees de sante | Avis DPO/juriste (PO-04 bloquant prod), DPA OpenRouter + cartographie sous-traitants. |
| Prix ecran Shineworld (~800 EUR) | Devis ferme Shineworld (PO-09) — c'est la VRAIE incertitude du TCO, pas l'IA. |
| Risque thermique ambiant >50C derriere ecran | Mesure IR arriere ecran (deja exigee `SPECS.md:91`). |
| Marque microscope (Jiusion vs Ninyoon) + prix 45 EUR | Facture/capture du materiel reellement teste. Non codable. |
| Endurance microSD kiosk 24/7 | Spec endurance (industrial vs grand public) + monitoring d'usure. |
| Qui est obligataire RED/CRA | Qualification commerciale: composant CE vs produit radio integre sous marque DreamTech. |

---

## 5) TOP 10 DES CORRECTIONS A FAIRE EN PRIORITE (actions concretes)

1. **Corriger le claim codec Pi 5** dans `smart_mirror_specs_techniques.md:67`: remplacer "acceleration H.264 hardware" par "HEVC/H.265 4K60 hardware uniquement; H.264/VP9/AV1 en logiciel CPU; aucun encodeur video hardware". (Erreur technique la plus facile a sanctionner par un jury.)

2. **Reecrire le claim "flux 100% local" et le transfert RGPD** (`CDC_Fonctionnel §8.2 l.412`, `CDC_Technique §15.3 l.892`): "live microscope local; snapshots JPEG envoyes hors UE (OpenRouter US) + CRM. Conformite Chap. V requise: DPA art.28 + DPF/SCC art.46 + TIA Schrems II; consentement art.9(2)(a) si donnees de sante. Le consentement art.49 ne couvre PAS un transfert systematique." Recommander la parade gagnante: analyse CV on-device (ne sortir que des scores anonymises).

3. **Supprimer la stack obsolete** Bun/Supabase/Budibase/Vercel des sections 9-10 de `smart_mirror_specs_techniques.md` (ou la marquer OBSOLETE en en-tete). Aligner sur la stack reelle : backend mock Express + PostgreSQL 15/Docker/Scaleway (Laravel = CIBLE ROADMAP).

4. **Corriger le README** (FAIT, mise a jour 2026-06-25): backend realise = mock Express + PostgreSQL 15 ; Laravel 13 / PHP 8.4, PostgreSQL 16, Redis 7 sont des CIBLES ROADMAP explicitement etiquetees (aucun composer.json/artisan dans le depot) ; port IA = 3001 ; microscope = WiFi/TCP JHCMD (Ninyoon 4K ; USB/UVC = vestiges morts) ; retablir le fallback email (TC-06 critique).

5. **Supprimer le claim "aucun concurrent"** (`CDC_DreamTech.md:47,557,563,643`) et ajouter une section 1.5 "Analyse concurrentielle" avec tableau (K-Scan, BECON, FotoFinder, Aram Huvis, CareOS, HiMirror) + matrice de differenciation par integration verticale et cout.

6. **Mise a jour 2026-06-25** : sur les 4 claims securite de 2026-06-15, trois sont desormais RESOLUS et a presenter comme des forces : chiffrement des photos (`.jpg.enc` AES-256-GCM via cryptoVault, plus aucune ecriture en clair), tokens chiffres au repos (device.token, crmToken, crmBearerToken ; safeStorage et branche plaintext supprimes), sandbox actif (`index.ts:51`) et CSP en production (`index.ts:121-143`). Restent en gaps assumes : durcir l'exposition `config:getAll` (whitelist) et securiser le backend mock.

7. **Corriger les prix budget**: Pi 5 ~90 -> ~150-200 EUR (crise RAM), VPS 30-35 -> 45-70 EUR/mois, ajouter alim 27W (~12) + refroidisseur actif (~8) aux deux BOM. Recalculer le total materiel hors ecran a ~250-290 EUR/unite.

8. **Remplacer les chiffres de tests** par les vrais (mise a jour 2026-06-25): "178 cas: 42 unitaires (Vitest, dont `crypto-vault.service.test.ts` = 7 tests) + 136 E2E (Playwright, 4 specs); 4/9 services couverts en unitaire". Signaler `crm-sync.service.ts` (372 LOC, 0 test) comme trou critique.

9. **Verifier les artefacts qualite (FAIT, mise a jour 2026-06-25)**: `playwright.config.ts`, ESLint flat config (`eslint.config.mjs`) et le workflow CI `.github/workflows/ci.yml` sont PRESENTS, et `vitest.config.ts` contient une section coverage (provider v8). Reste a produire: le rapport `vitest run --coverage` avec seuil, et l'audit deps CI bloquant (`ci.yml` `continue-on-error` a basculer).

10. **Trancher la decision RAM avec mesure**: capturer `free -m`/`VmRSS` sur 48h, decider si Docker PostgreSQL tourne on-device, puis valider 4 Go par ecrit. Corriger la contrainte non sourcee "<6 Go sur 8" (`DOSSIER:232`). Supprimer les deps mortes `react-tsparticles`/`tsparticles-slim`.

---

## 6) BLOCS FACT-CHECK — Les 3 claims les plus risques

```
┌─ FACT-CHECK ──────────────────────────────────────────────────┐
│ Claim     : "Le transfert vers OpenRouter (US) est couvert par │
│              un DPA" / "Cloud en datacenter europeen (RGPD)"   │
│ Domain    : compliance                                         │
│ Verdict   : BLOCKED (REFUTE — erreur de droit caracterisee)    │
│ Source    : RGPD art.28 vs Chap. V (art.44-46, 49); CJUE       │
│              C-311/18 Schrems II; EDPB 2/2018. Code:           │
│              api-client.service.ts:159 (snapshot sort).        │
│ Confiance : 92% (L1/L2)                                        │
│ Challenge : Un DPA encadre la sous-traitance, PAS le transfert │
│             hors EEE. Ou est le DPF/les SCC + le TIA ? Le      │
│             consentement art.49 est invalide pour un transfert │
│             systematique (chaque photo). Si donnee de sante:   │
│             consentement art.9(2)(a) en plus. Affirmer "cloud  │
│             EU" est trompeur tant qu'OpenRouter est dans la    │
│             boucle.                                            │
└───────────────────────────────────────────────────────────────┘
```

```
┌─ FACT-CHECK ──────────────────────────────────────────────────┐
│ Claim     : "GPU VideoCore VII — acceleration H.264/MJPEG     │
│              hardware disponible" (Pi 5)                       │
│ Domain    : performance / general (materiel)                  │
│ Verdict   : REFUTE (factuellement inverse)                    │
│ Source    : RPi Foundation via forums officiels + Frigate +   │
│              Hacker News (convergents). specs_techniques:67.  │
│ Confiance : 88% (L2)                                          │
│ Challenge : Le Pi 5 (BCM2712) a SUPPRIME le decodeur H.264    │
│             hardware du Pi 4. Seul HEVC/H.265 est hardware     │
│             (4K60). H.264/VP9/AV1 = logiciel CPU; aucun        │
│             encodeur video hardware. Les medias promo sont en │
│             MP4 H.264 -> charge CPU, pas GPU. Artefact L1 qui  │
│             scellerait: page produit officielle               │
│             raspberrypi.com section codecs.                   │
└───────────────────────────────────────────────────────────────┘
```

```
┌─ FACT-CHECK ──────────────────────────────────────────────────┐
│ Claim     : "Aucun concurrent n'existe sur ce marche /        │
│              first-mover advantage"                           │
│ Domain    : general (marche)                                  │
│ Verdict   : REFUTE                                            │
│ Source    : sites officiels constructeurs (loreal.com         │
│              K-Scan, beconx.com, fotofinder.com,              │
│              aramhuvis.com). CDC_DreamTech:47,557,563,643.    │
│ Confiance : 95% (L1 sur l'existence des concurrents)          │
│ Challenge : L'Oreal/Kerastase K-Scan (camera+IA+cuir chevelu  │
│             en salon, rollout 2024) et BECON (coreen, finance │
│             Samsung, K-beauty natif) sont des concurrents     │
│             quasi identiques. Le CDC se contredit lui-meme    │
│             (l.651 "concurrents"). La differenciation reelle  │
│             = integration verticale microscope WiFi bas cout  │
│             + CRM Shopify, PAS l'absence de concurrents.       │
│             Risque juridique: allegation comparative fausse.  │
└───────────────────────────────────────────────────────────────┘
```

---

**Synthese executive pour le jury:** les 3 erreurs les plus dangereuses sont (a) le **transfert RGPD hors UE presente comme "100% local / DPA suffit"** (erreur de droit + contredite par le code `api-client.service.ts:159`), (b) le **claim codec H.264 hardware inverse** (verifiable en 30s par un jury technique), et (c) le **"aucun concurrent"** (refutable en une recherche). Les claims securite de 2026-06-15 (photos en clair, sandbox off, CSP absente, tokens en clair) sont desormais RESOLUS dans le code (mise a jour 2026-06-25 : chiffrement AES-256-GCM via cryptoVault des photos/file de sync/tokens, sandbox actif, CSP en prod) et se presentent comme des forces ; le residu a securiser est cote backend mock et exposition `config:getAll`. Le claim RAM prioritaire est defendable (4 Go suffisent, ~115 EUR economises) mais uniquement comme decision d'ingenierie conditionnee a une mesure 48h, jamais comme fait. Bonne nouvelle: les forces (thermique, microscope, calcul -28%, fondations Electron, anticipation HDS Scaleway) sont solides et verifiees.

Fichiers cles (chemins absolus, verifies directement):
- `C:\Users\adria\Documents\Projets\PROJET\projet-miroirIoT\smart-mirror\mirror-app\src\main\index.ts:51` (`sandbox: true`, ACTIF — corrige depuis 2026-06-15)
- `...\smart-mirror\mirror-app\src\main\services\sync.service.ts` `savePhotoLocally` (photo chiffree `.jpg.enc`, mise a jour 2026-06-25) ; `...\crypto-vault.service.ts` (coffre AES-256-GCM) ; `...\config.service.ts` (tokens chiffres)
- `C:\Users\adria\Documents\Projets\PROJET\projet-miroirIoT\smart-mirror\mirror-app\src\main\services\api-client.service.ts:159` (snapshot sort vers IA)
- `C:\Users\adria\Documents\Projets\PROJET\projet-miroirIoT\smart-mirror\mirror-app\package.json` (tsparticles non importe, framer absent ; ESLint flat config `eslint.config.mjs` et `playwright.config.ts` PRESENTS, section coverage presente dans `vitest.config.ts`)
- `C:\Users\adria\Documents\Projets\PROJET\projet-miroirIoT\smart-mirror\docker-compose.yml:3,25` (postgres:15, port 3001, pas de Redis)
- `C:\Users\adria\Documents\Projets\PROJET\projet-miroirIoT\smart-mirror\mirror-app\vitest.config.ts` (section coverage presente : provider v8, reporters text/html/lcov)
- `C:\Users\adria\Documents\Projets\PROJET\projet-miroirIoT\smart-mirror\start.sh:20` (Docker on-device)
- `C:\Users\adria\Documents\Projets\PROJET\projet-miroirIoT\smart_mirror_specs_techniques.md:67` (codec inverse), `:351` (stack obsolete)
- `C:\Users\adria\Documents\Projets\PROJET\projet-miroirIoT\CDC_DreamTech.md:47,557,563,643` (aucun concurrent)
- `C:\Users\adria\Documents\Projets\PROJET\projet-miroirIoT\docs\DOSSIER-CONNAISSANCE-RNCP.md:232` (contrainte RAM <6 Go non sourcee)