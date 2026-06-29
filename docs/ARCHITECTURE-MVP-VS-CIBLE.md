# ARCHITECTURE - MVP REALISE vs CIBLE ROADMAP

## Source de verite de la stack technique (DreamTech Smart Mirror)

> Document strategique d'architecture : il distingue ce qui est REALISE dans le depot
> de ce qui est CIBLE en roadmap, et justifie chaque choix futur par un point de douleur
> observe dans le code actuel.
>
> Base factuelle : ce document s'appuie sur `docs/GROUND-TRUTH-CODE.md`, l'audit du code
> qui fait autorite (preuves `fichier:ligne`, niveaux de confiance). En cas de divergence
> entre une affirmation de stack et le code, `docs/GROUND-TRUTH-CODE.md` tranche.
> Pour la dimension souverainete de l'IA, voir `docs/SOUVERAINETE-IA-3-VERSIONS.md`.
>
> Candidat : Adriano (B3, preparation au titre RNCP 37046)
> Titre vise : RNCP 37046 - Chef de projet en solutions logicielles pour l'internet des objets (IoT) (niveau 6)
> Blocs principalement servis : BC02 (conception d'architecture), BC05 (maintenir et faire evoluer)
> Statut : le backend du DEVICE est un mock Express ; aucune reecriture Laravel du device n'est codee a ce stade
> (Laravel 13 est en revanche deja en place sur le CRM separe `crm/backend`, et sert de cible pour le device).

---

## Regle de lecture transverse (convention typographique)

Chaque brique de la stack est classee dans l'un des trois etats suivants, sans ambiguite :

| Etat | Definition | Exigence de preuve |
|------|------------|--------------------|
| **REALISE** | Code present, executable et verifie dans le depot | Reference `fichier:ligne` obligatoire |
| **EN COURS** | Chantier actif, partiellement implemente | Reference `fichier:ligne` de l'existant + ecart restant |
| **CIBLE** | Decision d'architecture documentee, non encore codee | Etiquette explicite `[CIBLE ROADMAP - non implemente]` + horizon |

Principe d'honnetete : une CIBLE n'est JAMAIS presentee comme realisee. Un jury qui lit le code ne doit trouver aucune affirmation invalidee par une lecture du depot.

---

## 1. Tableau maitre tri-etat par brique

Le tableau ci-dessous est la reference canonique. Chaque ligne REALISE porte une preuve `fichier:ligne` ; chaque ligne CIBLE porte l'etiquette d'horizon.

| Brique | REALISE (preuve fichier:ligne) | EN COURS | CIBLE (horizon) |
|--------|--------------------------------|----------|-----------------|
| **Frontend / Device** | Electron 33 + React 19 + TypeScript 5.7 + Zustand 5, kiosque tactile Raspberry Pi ; sandbox actif (`index.ts:52`), contextIsolation + nodeIntegration desactive (`index.ts:53`), CSP en production (`index.ts:121-144`, garde `if !is.dev`) | - | Inchange (pas de reecriture prevue) |
| **Backend device** | Mock Express (Node.js) : API metier mock "Laravel" port 8100 + proxy IA mock port 3001 (`smart-mirror/mock-api/src/server.js`, `docker-compose.yml`) ; le `package.json` se decrit lui-meme "Mock API simulating Laravel backend + Express IA proxy" ; SQL brut via le driver `pg` (`pool.query`), aucun ORM | - | `[CIBLE ROADMAP - non implemente]` Laravel 13 / PHP 8.4 (deja eprouve sur le CRM separe `crm/backend`, framework ^13.0), port 8000, Eloquent + migrations versionnees (horizon : refonte backend device post-MVP) |
| **Base de donnees** | PostgreSQL 15-alpine conteneurise (`docker-compose.yml`), 9 tables chargees depuis `init.sql`, SQL brut (types Postgres : `uuid-ossp`, UUID, JSONB, TEXT[]) ; aucun SQLite cote device | - | `[CIBLE ROADMAP - non implemente]` PostgreSQL 16 + pgcrypto sur colonnes sensibles (horizon : alignee sur la bascule Laravel) |
| **Cache / Queue** | Fichier JSON local `/var/smart-mirror/sync-queue.json` chiffre au repos, polling 30s, heartbeat 60s (`sync.service.ts`) ; aucun broker (pas de MQTT/Redis/AMQP) | - | `[CIBLE ROADMAP - non implemente]` Redis 7 (Laravel Queue/Horizon + cache + rate-limit + locks) ; absent du `docker-compose` actuel (horizon : avec Laravel) |
| **Auth** | Echange MAC + token_device -> Bearer artisanal (`crm-sync.service.ts`) ; `device.token` persiste chiffre au repos en AES-256-GCM via cryptoVault (`config.service.ts`, `crypto-vault.service.ts`) ; pas de safeStorage en prod (uniquement mock de test) | - | `[CIBLE ROADMAP - non implemente]` Laravel Sanctum, tokens revocables par device, abilities/scopes par miroir (horizon : avec Laravel) |
| **IA / Vision (device)** | Chemin par defaut MOCKE (port 3001) : scores `Math.random` + latence `setTimeout` + commentaire et produits en dur (`server.js:518-549`), modele cosmetique litteral `'google/gemini-flash-1.5'`, l'image base64 recue n'est jamais utilisee ; aucun OpenCV, aucune vision CPU on-device | - | `[CIBLE ROADMAP - non implemente]` IA vision souveraine (voir `docs/SOUVERAINETE-IA-3-VERSIONS.md`) : V2 cloud UE Mistral, V3 NPU local offline (horizon : post-MVP, encadrement RGPD requis) |
| **IA / Vision (service reel, serveur)** | Service IA REEL deploye cote CRM : `crm/ia-service/src/server.js` (port 3002), vrai `fetch` vers GitHub Models (Azure US), envoie le JPEG complet en base64 (`image_url` multimodal), auth `Bearer GITHUB_TOKEN`, modeles Llama-3.2-11B-Vision / Phi-3.5-vision / gpt-4o-mini ; deploye via `crm/docker-compose.yml` + Traefik `kbeauty-ia` | App miroir non branchee sur ce service par defaut (`config.service.ts:44` pointe `localhost:3001`, le mock) ; cablage device -> service reel a faire | `[CIBLE ROADMAP - non implemente]` migration du fournisseur vers une option souveraine UE (Mistral) ou locale (NPU), pour eliminer le transfert de la photo vers un cloud US |
| **Microscope** | WiFi / TCP `192.168.34.1:8080`, handshake protocole JHCMD, flux source H.264 transcode par ffmpeg en MJPEG sur `localhost:9100`, preview en balise `<img>` (`proxy.js`, `SessionScreen.tsx:153-156`) ; references USB/UVC/V4L2 = vestiges morts non consommes | - | Inchange (le materiel et le protocole restent en WiFi ; ffmpeg reste central) |
| **Workflows** | Generation PDF de seance SYNCHRONE in-process via pdfkit (`server.js:308-388`) ; commentaire `In production, this triggers n8n webhook` (`server.js:198`) non branche | - | `[CIBLE ROADMAP - non implemente]` n8n + Laravel Queue (orchestration webhook fin de seance) (horizon : avec Redis/Laravel) |
| **Integrations** | CRM generique (echange Bearer, push clientes/consentements/seances/photos via `crm-sync.service.ts`) | - | `[CIBLE ROADMAP - non implemente]` Shopify (catalogue + recommandations issues du diagnostic) (horizon : post-MVP) |
| **Chiffrement** | Sur le device : photos cuir chevelu (`.jpg.enc`), file de synchronisation et tokens (device.token, crmToken, crmBearerToken) CHIFFRES AU REPOS en AES-256-GCM via cryptoVault, format `[version 1o || IV 12o || authTag 16o || ciphertext]` (`crypto-vault.service.ts`, ecriture `.jpg.enc` dans `sync.service.ts` `savePhotoLocally`, dechiffrement avant push CRM dans `crm-sync.service.ts` `pushPhotoCrm`, secrets dans `config.service.ts`) ; cle maitre par priorite env -> systemd-creds (TPM) -> keyfile -> fallback dev, THROW explicite en prod sans cle | Backend mock encore a securiser (PDF de seance servi sans protection, secrets en dur, device_token non hache) | `[CIBLE ROADMAP - non implemente]` pgcrypto sur colonnes sensibles, object storage chiffre, chiffrement de volume hebergeur, hebergement UE/EEE |
| **Tests** | 196 cas au total : 60 unitaires Vitest sur 5 services (api-client 14, config 14, crm-sync 18, crypto-vault 7, sync 7) + 136 e2e Playwright (4 fichiers : 14+65+42+15) ; `crm-sync.service.test.ts` couvre la synchronisation CRM (18 cas), `crypto-vault.service.test.ts` (7 cas) prouve que le JPEG ecrit sur disque ne commence pas par `FF D8` et que le store ne contient pas le token en clair | Renforcement BC04 : couverture des 4 services non testes (media-cache, microscope, updater, wifi), tests d'integration backend | `[CIBLE ROADMAP - non implemente]` seuils de couverture imposes, scan image conteneur, durcissement des gates CI (horizon : vague BC04) |
| **Securite plateforme / CI** | sandbox actif (`index.ts:52`), CSP en production (`index.ts:121-144`), CI GitHub Actions (`ci.yml`), ESLint flat config, `playwright.config` ; gates CI BLOQUANTS = `npm audit` CRITICAL/prod (`ci.yml:41-42`) + gitleaks (`secrets-scan`, `:64-74`) ; NON bloquants (continue-on-error) = `npm audit` high/dev (`:47-49`), SBOM CycloneDX (`:51-53`), Semgrep (`:76-85`) | Faire passer en bloquants le SBOM, Semgrep et l'audit high apres remediation des findings | `[CIBLE ROADMAP - non implemente]` protection de branche, DAST, scan conteneur (horizon : durcissement BC04) |
| **Packaging / Build** | electron-builder, cibles Linux uniquement = deb + AppImage, chacun pour arm64 ET x64 (`electron-builder.yml`, scripts `package:arm64`/`package:x64`) ; appId `com.dreamtech.smartmirror`, publish `provider: generic` via `UPDATE_SERVER_URL` ; aucune cible Windows ni macOS | - | Inchange (deploiement Linux embarque) |
| **Consentement RGPD** | Verrouille a deux niveaux : schema (`init.sql:59` FK `consentement_id NOT NULL`) ET serveur (`server.js:166-177` refuse HTTP 422 si consentement absent, introuvable ou revoque) | Verrouillage additionnel par test d'integration backend | Inchange (regle deja en place) |

---

## 2. Justification de chaque techno cible (triptyque probleme -> limite -> solution)

Chaque techno cible est justifiee par un point de douleur OBSERVE dans le code MVP, et non par une preference abstraite. Le format est : probleme constate -> limite de l'existant -> solution cible (+ alternative ecartee quand pertinent).

### 2.1 Laravel 13 / PHP 8.4 (backend device) `[CIBLE ROADMAP - non implemente]`

- **Probleme** : la logique metier du device est ecrite en SQL brut via `pool.query` dans un mock Express d'un seul fichier (`server.js`, ~550 lignes), sans ORM, sans migrations versionnees, sans couche de validation structuree.
- **Limite** : impossible de versionner proprement le schema, de tester unitairement les modeles, de tracer l'evolution de la base ; toute evolution de schema est manuelle et risquee.
- **Solution** : Eloquent (modeles + relations), migrations versionnees, FormRequest pour la validation, structure MVC testable. Laravel 13 est deja en place et eprouve sur le CRM separe (`crm/backend`, framework ^13.0), ce qui derisque la bascule.
- **Alternative ecartee** : rester en Express. Ecartee car Express n'offre nativement ni Sanctum, ni systeme de queues integre, ni migrations, ce qui imposerait d'assembler et maintenir un patchwork de bibliotheques.

### 2.2 Laravel Sanctum `[CIBLE ROADMAP - non implemente]`

- **Probleme** : l'authentification actuelle du device est un echange artisanal MAC + token_device produisant un Bearer (`crm-sync.service.ts`), le token n'etant pas revocable proprement.
- **Limite** : en cas de vol ou de mise au rebut d'un miroir, impossible de revoquer finement l'acces de ce seul device ; pas de gestion de portee (scopes) par miroir.
- **Solution** : Sanctum, tokens revocables par device, abilities/scopes par miroir, revocation individuelle immediate.
- **Alternative ecartee** : JWT. Ecartee car un JWT est irrevocable avant expiration, ce qui est inacceptable pour un parc de devices physiques exposes au vol.

### 2.3 PostgreSQL 16 `[CIBLE ROADMAP - non implemente]`

- **Probleme** : PostgreSQL 15 actuel n'a aucune colonne chiffree (aucun `pgcrypto`) ; les champs sensibles (email, telephone, date de naissance) sont en clair (`init.sql`).
- **Limite** : pas de defense en profondeur cote base ; une fuite de dump expose directement les donnees personnelles.
- **Solution** : PostgreSQL 16 + extension pgcrypto sur les colonnes sensibles, chiffrement applicatif gere cote application (cle hors requete SQL).
- **Note** : la montee 15 -> 16 est mineure en soi ; elle est groupee avec la bascule Laravel et l'introduction du chiffrement colonne.

### 2.4 Redis 7 `[CIBLE ROADMAP - non implemente]`

- **Probleme** : la file de synchronisation est un simple fichier JSON local interroge toutes les 30 secondes (`sync.service.ts`) ; la generation PDF est synchrone et bloque la requete (`server.js:308-388`).
- **Limite** : polling couteux, pas de retry/backoff robuste, le flag booleen `syncing` ne survit pas a un crash, aucun mecanisme de lock ni de deduplication.
- **Solution** : Redis 7 comme backing store unique couvrant quatre roles (queue, cache, rate-limit, locks). Detaille en section 3.
- **Alternative ecartee** : conserver le fichier JSON. Ecartee car il ne resiste pas aux crashs et ne supporte pas l'orchestration de jobs idempotents.

### 2.5 Shopify `[CIBLE ROADMAP - non implemente]`

- **Probleme** : l'integration CRM actuelle est generique, sans lien entre le diagnostic capillaire et un catalogue produit.
- **Limite** : impossible de transformer le diagnostic en recommandation e-commerce actionnable (vente de soins K-Beauty adaptes).
- **Solution** : Shopify, recommandations produits issues directement du diagnostic IA, integration verticale diagnostic -> catalogue -> vente.

### 2.6 n8n `[CIBLE ROADMAP - non implemente]`

- **Probleme** : le code contient un commentaire `In production, this triggers n8n webhook` (`server.js:198`) alors que la generation PDF reste synchrone in-process, sans aucun webhook.
- **Limite** : aucune orchestration des actions post-seance (PDF, QR, envoi rapport, notifications) ; tout est couple a la requete HTTP.
- **Solution** : n8n declenche par webhook en fin de seance, orchestrant la chaine post-seance de maniere decouplee et observable.

### 2.7 IA vision : du mock vers une analyse souveraine `[CIBLE ROADMAP - non implemente]`

- **Probleme** : sur le device, le chemin par defaut de l'analyse est entierement mocke (`server.js:518-549`, scores `Math.random`), sans valeur de diagnostic reelle. Un service IA reel existe par ailleurs cote serveur (`crm/ia-service`, port 3002), mais il appelle GitHub Models (Azure US) et envoie la photo de cuir chevelu complete en base64 hors UE.
- **Limite** : aucun diagnostic exploitable sur le device par defaut, et la variante serveur actuelle n'est pas souveraine (transfert d'une image potentiellement sensible vers un cloud US).
- **Solution** : brancher une analyse vision reelle et souveraine selon la strategie a trois versions documentee dans `docs/SOUVERAINETE-IA-3-VERSIONS.md` : V2 cloud UE (Mistral, hebergement UE par defaut, Zero Data Retention + DPA + endpoint EU) ; V3 100% locale offline (classification CNN dediee sur NPU Hailo, ou petit VLM local).
- **Garde-fou RGPD** : une photo de cuir chevelu a finalite cosmetique n'est en principe pas une donnee de sante (art. 9 RGPD) tant qu'aucune finalite medicale n'est revendiquee ; le cadrage strict "cosmetique, non medical" est requis. Tout envoi cloud hors UE (configuration serveur actuelle GitHub Models/Azure US) doit etre encadre : minimisation, routage UE in-region, garanties contractuelles (SCC/DPA) ou suppression du transfert via la version locale.

---

## 3. Pourquoi Redis : 8 jobs asynchrones candidats

Redis n'est pas ajoute pour suivre une mode mais parce qu'un SEUL service couvre quatre besoins : (1) backing store de Laravel Queue/Horizon, (2) cache (sessions, reponses CRM, recherche cliente cross-miroir), (3) rate limiting, (4) locks de synchronisation. Chaque job candidat est ancre sur un point de douleur present et identifiable dans le code actuel.

| # | Job asynchrone candidat | Point de douleur actuel (code) |
|---|--------------------------|--------------------------------|
| 1 | Generation PDF de seance | Synchrone pdfkit in-process (`GET /api/seances/:id/rapport`, `server.js:308-388`, `/tmp/rapports`) : bloque la requete HTTP |
| 2 | Generation + envoi QR code + lien rapport | Chaine apres PDF (`server.js:394-409`) ; envoi differe email/SMS non orchestre |
| 3 | Push CRM/Shopify de la seance + dependances | Boucle synchrone poll 30s (`crm-sync.service.ts` `syncAll`/`syncSessionNow`) ; le flag booleen `syncing` ne survit pas a un crash -> cible : jobs idempotents + backoff + dedupe + lock Redis |
| 4 | Analyse IA differee (cloud souverain ou local) | Mock `setTimeout` aleatoire sur le device (`server.js:518-549`) -> cible : upload + analyse vision + persistance `diagnostic_ia`/`modele_ia`/`latence_ms` avec retry/timeout |
| 5 | Sync offline -> online catch-up | File JSON locale (`sync.service.ts` `processQueue`) -> cible : reconciliation en masse avec ordonnancement FK |
| 6 | Upload photos vers stockage backend | Multipart synchrone timeout 30s (`crm-sync.service.ts` `pushPhotoCrm`) -> cible : job upload + chiffrement + miniatures |
| 7 | Envoi rapport client (email/SMS) + notifications | Non implemente -> cible : job post-PDF (n8n/mailer) avec retry |
| 8 | Purge photos expirees (retention 30j) + purge RGPD | `setInterval` local (`cleanupExpiredPhotos`, `sync.service.ts`) -> cible : job planifie scheduler + queue |

**Conclusion** : un unique service Redis 7 couvre queue + cache + rate-limit + locks. Cela justifie son ajout au `docker-compose` cible, alors qu'il est totalement absent du depot aujourd'hui (aucune dependance, aucun conteneur Redis). `[CIBLE ROADMAP - non implemente]`

---

## 4. Schema de migration mock Express -> Laravel (strangler-fig)

La bascule est progressive (strangler-fig) : le mock Express reste le CONTRAT d'API que Laravel reimplante endpoint par endpoint. Le frontend Electron ne change pas ; il continue d'appeler le meme contrat pendant toute la transition.

### 4.1 Les trois axes de la bascule

- **(A) Endpoints** : les routes `/miroir/*` deja appelees par `crm-sync` (auth, heartbeat, clientes, consentements, seances, `seances/:id/fin`, `seances/:id/rapport`, photos) ainsi que les routes metier mock (port 8100) sont reimplantees en controllers/routes Laravel versionnees, iso-contrat (memes URLs, memes payloads, memes codes de retour).
- **(B) Donnees** : les 9 tables de `init.sql` (boutiques, clientes, consentements, miroirs, seances, photos, produits, medias, config_miroir) deviennent des migrations Eloquent + modeles, en conservant la contrainte RGPD FK `consentement_id NOT NULL` (`init.sql:59`, `server.js:166-177`) repliquee a la fois en validation applicative (refus HTTP 422) et en cle etrangere. La table `config_miroir` est presente en base mais hors MCD (qui modelise 8 entites) ; sa nature technique (configuration UI miroir) explique cet ecart 9 vs 8.
- **(C) Mecanismes** : auth MAC+token -> Sanctum ; file JSON poll 30s -> Laravel Queue/Horizon sur Redis ; PDF synchrone -> job + DomPDF/n8n ; IA mock -> le proxy Express IA est conserve comme point d'entree mais branche sur l'analyse vision reelle et souveraine (service cible, voir section 2.7).

### 4.2 Ordre de bascule par criticite

```
1. Auth        (Sanctum reimplante l'echange MAC+token)
2. Lecture     (GET clientes, consentements, seances)
3. Ecriture    (POST/PUT seances, photos, avec garde-fou consentement HTTP 422)
4. Jobs        (PDF, push CRM, IA, purge -> Queue/Horizon sur Redis)
```

Strategie de coexistence : pendant la transition, le mock Express et Laravel servent le MEME contrat. On bascule un endpoint vers Laravel uniquement quand sa parite est prouvee, ce qui evite tout big-bang.

### 4.3 Diff infrastructure docker-compose

```
ACTUEL (REALISE)                 CIBLE [CIBLE ROADMAP - non implemente]
-----------------                ----------------------------------------
postgres:15-alpine          ->   postgres:16
mock-api (Express :8100)    ->   laravel-app (:8000)
mock-ia  (Express :3001)    ->   mock-ia conserve, branche analyse reelle souveraine
adminer                     ->   adminer
(aucun Redis)               ->   redis:7
(aucun worker)              ->   worker Horizon
(aucun n8n)                 ->   n8n
```

---

## 5. Discours "MVP vs cible" pour le jury

### 5.1 Phrase-cadre

> "Le MVP demontre la chaine de bout en bout avec un backend mock Express / PostgreSQL 15 fonctionnel et teste ; la cible Laravel 13 / PostgreSQL 16 / Redis 7 est documentee en roadmap, et je justifie chaque choix par un point de douleur observe dans le MVP."

### 5.2 Argumentaire "pourquoi ne pas avoir code Laravel sur le device maintenant"

- **Maitrise du contrat d'abord** : le mock fige le contrat d'API, ce qui permet une bascule endpoint par endpoint sans renegocier l'interface avec le frontend.
- **Priorisation P0** : la securite et le chiffrement des photos de cuir chevelu (donnee potentiellement sensible) passent AVANT une reecriture backend. Reecrire le backend sans avoir chiffre les donnees serait une mauvaise priorisation.
- **Eviter le big-bang** : une reecriture totale en une fois est un risque d'architecte ; le strangler-fig est une decision assumee et tracable, derisquee par le fait que Laravel 13 tourne deja sur le CRM separe.
- **Rattachement aux blocs** : ce raisonnement nourrit BC02 (choix d'architecture cible justifies) et BC05 (strategie d'evolution maitrisee).

### 5.3 Reponses aux questions du jury (extrait)

| Question du jury | Reponse |
|------------------|---------|
| "Votre IA fonctionne reellement ?" | "Sur le device, le chemin par defaut est mocke (`server.js:518-549`, scores `Math.random`) : il valide le flux et le contrat d'API. Un service IA reel existe par ailleurs cote serveur (`crm/ia-service`, port 3002) qui appelle GitHub Models. La cible est de brancher une analyse vision souveraine (cloud UE Mistral ou NPU local), avec encadrement RGPD." |
| "Le microscope est-il en USB ?" | "Non, en WiFi/TCP (`192.168.34.1:8080`, protocole JHCMD). Le flux source H.264 est transcode par ffmpeg en MJPEG sur `localhost:9100`, affiche dans une balise `<img>`. Les references UVC/V4L2 dans le depot sont des vestiges non utilises par le pipeline." |
| "Avez-vous des queues Redis ?" | "Pas encore. La file actuelle est un fichier JSON chiffre poll a 30s (`sync.service.ts`). Je sais exactement quels 8 jobs y migreront et pourquoi : chacun a un point de douleur synchrone ou fragile dans le code." |
| "Les photos sont-elles chiffrees ?" | "Oui, au repos sur le device : `sync.service.ts` `savePhotoLocally` ecrit un `.jpg.enc` chiffre AES-256-GCM via cryptoVault (`crypto-vault.service.ts`), la file de sync et les secrets de config sont chiffres aussi, et `crm-sync.service.ts` dechiffre avant le push CRM. La cle maitre vient de systemd-creds (TPM) en prod, avec THROW explicite si absente. Reste a faire : securiser le backend mock et introduire pgcrypto en base." |
| "Combien de tests ?" | "196 cas au total : 60 unitaires Vitest sur 5 services (api-client 14, config 14, crm-sync 18, crypto-vault 7, sync 7) et 136 e2e Playwright sur 4 fichiers. Le service de synchronisation CRM est couvert par 18 cas, et `crypto-vault.service.test.ts` prouve notamment que le JPEG sur disque ne commence pas par `FF D8` et que le store ne contient pas le token en clair. Le renforcement BC04 vise les 4 services main non encore testes (media-cache, microscope, updater, wifi)." |
| "Tournez-vous Laravel sur le miroir ?" | "Non, le backend du device est un mock Express + PostgreSQL 15 (`server.js`, `docker-compose`). Laravel 13/PHP 8.4 est deja en place sur le CRM separe (`crm/backend`) et constitue la cible pour le device ; j'ai fige le contrat pour basculer en strangler-fig." |

---

## 6. Faits verifies (rappel de coherence)

Cette section recapitule les invariants que toute autre documentation doit respecter. Ils sont alignes sur `docs/GROUND-TRUTH-CODE.md`.

- BACKEND DEVICE REALISE = mock Express (Node.js) `smart-mirror/mock-api/src/server.js` (API metier mock "Laravel" port 8100, IA mock port 3001) + PostgreSQL 15-alpine, SQL brut via `pg` ; zero ORM, zero Laravel/Sanctum/Redis sur le device. Laravel 13 = CRM separe (`crm/backend`) et cible roadmap du device.
- STOCKAGE LOCAL DEVICE = electron-store (config) + fichier JSON chiffre `sync-queue.json` + fichiers `.jpg.enc` ; AUCUN SQLite cote device.
- IA DEVICE REALISEE = MOCKEE (`server.js:518-549`, scores `Math.random`, modele cosmetique `'google/gemini-flash-1.5'`) ; aucun OpenCV, aucune vision CPU on-device.
- IA SERVEUR REELLE = `crm/ia-service` port 3002, appel reel GitHub Models (Azure US), envoi de la photo JPEG complete en base64 (vision multimodale), auth `GITHUB_TOKEN` ; deploye cote serveur, non branche au device par defaut. La photo quitte alors le device vers un cloud US (impact RGPD a encadrer). OpenRouter n'est appele dans aucun code.
- MICROSCOPE REALISE = WiFi/TCP `192.168.34.1:8080`, handshake JHCMD, source H.264 transcode par ffmpeg -> MJPEG `localhost:9100`, preview en `<img>` (pas de MSE) ; ffmpeg est central et non deprecie ; USB/UVC/V4L2 = vestiges morts.
- SYNC REALISE = fichier JSON chiffre `/var/smart-mirror/sync-queue.json` poll 30s, heartbeat 60s, retention photos 30 jours (`sync.service.ts`) ; pas de broker.
- CHIFFREMENT REALISE = sur le device, photos cuir chevelu (`.jpg.enc`), file de synchronisation et tokens CHIFFRES AU REPOS en AES-256-GCM via cryptoVault (`crypto-vault.service.ts`, `sync.service.ts`, `crm-sync.service.ts`, `config.service.ts`) ; cle maitre env -> systemd-creds (TPM) -> keyfile -> fallback dev, THROW en prod sans cle ; safeStorage non utilise en prod.
- SECURITE / CI = sandbox actif (`index.ts:52`) + CSP en production (`index.ts:121-144`) + CI GitHub Actions (`ci.yml`) + ESLint flat config + `playwright.config`. Gates BLOQUANTS = `npm audit` CRITICAL/prod + gitleaks. NON bloquants = `npm audit` high/dev, SBOM CycloneDX, Semgrep.
- PACKAGING = electron-builder, deb + AppImage pour arm64 ET x64 (Linux uniquement), publish `provider: generic` via `UPDATE_SERVER_URL` ; aucune cible Windows/macOS.
- MODELE = 9 tables `init.sql` vs 8 entites MCD ; ecart = `config_miroir`. Divergences de nommage MIROIR (`device_token`/`is_online`/`ip_address`) et PRODUIT (`affiche_miroir`).
- CONSENTEMENT RGPD = verrouille a deux niveaux : FK `consentement_id NOT NULL` (`init.sql:59`) + refus serveur HTTP 422 (`server.js:166-177`) si consentement absent ou revoque.
- TESTS REALISES = 196 cas = 60 unitaires Vitest (api-client 14, config 14, crm-sync 18, crypto-vault 7, sync 7) + 136 e2e Playwright (4 fichiers) ; 5/9 services main couverts.
- PORTS DEVICE = API metier 8100, IA mock 3001. Service IA reel serveur = 3002.
- CIBLE/ROADMAP a etiqueter explicitement : Laravel 13/PHP 8.4 + Sanctum (device), PostgreSQL 16 + pgcrypto, Redis 7, IA vision souveraine (Mistral UE / NPU local), Shopify, n8n, durcissement des gates CI.

---

*Fin du document. Document strategique d'architecture MVP vs cible. Base factuelle : `docs/GROUND-TRUTH-CODE.md` (BC02 conception d'architecture, BC05 strategie d'evolution).*
