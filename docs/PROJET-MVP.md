# DreamTech Smart Mirror K-Beauty -- Document Projet MVP

---

## 1. Vision Produit

DreamTech Smart Mirror est un miroir connecte destine aux salons de coiffure et instituts K-Beauty. Il permet aux praticiens de realiser des diagnostics capillaires assistes par intelligence artificielle, directement depuis un dispositif kiosque installe en salon.

Le produit repond a trois besoins identifie chez les professionnels :

- **Objectiver le diagnostic** : remplacer l'evaluation visuelle subjective par une capture microscopique haute resolution (Ninyoon 4K, grossissement x50 a x200) analysee par IA.
- **Fideliser les clients** : proposer un suivi avant/apres sur plusieurs seances, avec generation automatique de rapports PDF telechargeables par QR code.
- **Centraliser la gestion client** : un CRM multi-tenant integre, avec synchronisation Shopify, workflows N8N, et conformite RGPD native.

Le positionnement est B2B SaaS : chaque boutique souscrit un abonnement couvrant le miroir, le CRM et le service IA.

---

## 2. Architecture Technique

Le systeme se compose de quatre briques independantes, communicant par HTTP/REST et WebSocket.

### 2.1 Mirror App (Frontend Kiosque)

| Parametre       | Valeur                                      |
|-----------------|---------------------------------------------|
| Framework       | Electron 33 + React 19 + TypeScript 5.7     |
| State           | Zustand 5 (store lineaire, single session)  |
| Build           | electron-vite, electron-builder              |
| Resolution      | 1080x1920 (portrait)                         |
| Mode            | Kiosque plein ecran, clavier virtuel         |
| Port dev        | localhost:5173                               |

9 ecrans : Accueil, Bienvenue, Recherche Client, Nouveau Client, Consentement RGPD, Session (capture + analyse), Comparaison Avant/Apres, QR Code (rapport PDF), Provisioning.

Composants cles : GlassCard (design verre), VirtualKeyboard (saisie tactile), StatusBar (connectivite, microscope, sync), ErrorBoundary (resilience), MediaPlayer (mode veille).

### 2.2 CRM Backend

ETAT REEL (MVP realise) : le backend est un mock Express (`server.js`) exposant deux serveurs - l'API metier sur le port 8100 et le proxy IA mock sur le port 3001 - adosse a une base PostgreSQL 15-alpine conteneurisee (`docker-compose.yml`), en SQL brut via `pg` (`pool.query`), sans ORM. Il n'existe AUCUN Laravel dans le depot (zero `composer.json`, zero `artisan`). La colonne CIBLE ci-dessous decrit la refonte backend planifiee, non encore codee.

| Parametre       | REALISE (MVP)                               | CIBLE ROADMAP (non implemente)              |
|-----------------|---------------------------------------------|---------------------------------------------|
| Framework       | Mock Express (Node.js, `server.js`)         | Laravel 13, PHP 8.4                          |
| Base de donnees | PostgreSQL 15-alpine (`docker-compose.yml`) | PostgreSQL 16 + pgcrypto                      |
| Cache/Queues    | Fichier JSON local poll 30s (`sync.service.ts`), aucun broker | Redis 7 (Queue/Horizon + cache + locks)      |
| Auth            | Echange MAC + token_device -> Bearer artisanal (`crm-sync.service.ts`) | Laravel Sanctum (tokens revocables)          |
| PDF             | pdfkit synchrone in-process (`server.js:308-388`) | DomPDF (generation cote serveur)             |
| WebSocket       | Aucun (polling)                             | Laravel Reverb                               |
| Workflows       | PDF synchrone ; commentaire n8n non branche (`server.js:198`) | N8N (orchestration externe)                  |
| Sync e-commerce | CRM generique                               | Shopify API                                  |
| Port API metier | 8100                                        | 8000 (refonte Laravel)                       |

Le backend est multi-tenant : chaque boutique est isolee au niveau des donnees. Trois roles : super-admin (plateforme), gerant (boutique), collaborateur (praticien). La colonne CIBLE ROADMAP est documentee dans le doc pivot `docs/ARCHITECTURE-MVP-VS-CIBLE.md` (source de verite de la stack).

### 2.3 IA Service (Microservice Diagnostic)

ETAT REEL (MVP realise) : l'IA est MOCKEE. Le proxy Express renvoie des scores generes par `Math.random` avec un commentaire en dur (`server.js:514-545`), modele cosmetique `'google/gemini-flash-1.5'`, sans aucun appel reseau a un vrai modele de vision. La colonne CIBLE decrit le branchement OpenRouter planifie, non encore code.

| Parametre       | REALISE (MVP)                               | CIBLE ROADMAP (non implemente)              |
|-----------------|---------------------------------------------|---------------------------------------------|
| Runtime         | Node.js + Express (proxy mock)              | Node.js + Express branche sur OpenRouter     |
| API             | Aucune (scores `Math.random`, `server.js:514-545`) | OpenRouter (LLM vision reel)                 |
| Modeles         | Mock cosmetique `google/gemini-flash-1.5`   | Gemini Flash (primaire), GPT-4o mini puis Claude 3.5 Haiku (fallbacks) |
| Port            | 3001                                        | 3001                                        |

CIBLE ROADMAP : le service recevra une photo capturee par le microscope, la transmettra au modele de vision OpenRouter, et retournera un diagnostic structure en JSON avec score de confiance. Un envoi de photo de cuir chevelu vers OpenRouter (routage possible hors UE) est un transfert de donnee potentiellement de sante (art. 9 RGPD) a encadrer (Zero Data Retention, routage EU in-region, SCC, ou minimisation). Le fallback a plusieurs niveaux vise la disponibilite meme en cas d'indisponibilite d'un modele.

Important : le diagnostic est cosmetique, jamais medical. Le praticien conserve toujours le dernier mot.

### 2.4 Microscope Proxy

ETAT REEL (MVP realise) : le microscope capillaire est connecte en WiFi/TCP (`192.168.34.1:8080`, handshake protocole JHCMD). Le flux H.264 est transcode par ffmpeg en MJPEG servi sur `localhost:9100` (`proxy.js`). Il ne s'agit PAS d'une connexion USB/UVC/V4L2 : les references USB sont des vestiges morts dans le depot.

| Parametre       | Valeur (REALISE)                                |
|-----------------|-------------------------------------------------|
| Materiel        | Microscope capillaire WiFi (Ninyoon 4K)         |
| Liaison         | WiFi / TCP `192.168.34.1:8080`, protocole JHCMD |
| Grossissement   | x50 a x200                                       |
| Capture         | Flux H.264 -> ffmpeg -> MJPEG                     |
| Proxy           | Node.js HTTP relay (`proxy.js`)                  |
| Port            | 9100 (localhost)                                |

Le proxy etablit le handshake JHCMD vers le microscope WiFi, transcode le flux H.264 en MJPEG via ffmpeg et le sert sur localhost. L'application Electron consomme ce flux dans un tag img standard.

---

## 3. Flux de Donnees : De la Capture au Rapport PDF

```
1. Le praticien positionne le microscope sur le cuir chevelu du client
        |
2. Le flux MJPEG en direct s'affiche sur l'ecran Session
   (Microscope WiFi/TCP 192.168.34.1:8080 JHCMD -> ffmpeg H.264->MJPEG -> proxy.js:9100 -> Electron <img>)
        |
3. Le praticien appuie sur "Capturer" (ou bouton physique)
   -> La frame MJPEG est extraite et stockee localement (fichier + store Zustand)
        |
4. Jusqu'a 4 zones capturees par seance
        |
5. Le praticien lance l'analyse IA (MVP : mockee)
   -> Les photos sont envoyees au service IA mock (:3001)
   -> MVP : scores Math.random (server.js:514-545)
   -> [CIBLE ROADMAP] OpenRouter LLM vision : Gemini Flash -> GPT-4o mini -> Claude 3.5 Haiku
   -> Reponse JSON : diagnostic, recommandations, niveau de confiance
        |
6. Les resultats s'affichent sur l'ecran Session
   -> Niveau de confiance : ok / a_confirmer / non_concluant
   -> Le praticien valide ou ajuste
        |
7. La seance est synchronisee vers le CRM (API metier :8100)
   -> Photos uploadees, diagnostic sauvegarde (JSONB)
   -> Si hors-ligne : file d'attente JSON locale (poll 30s), sync automatique au retour du reseau
        |
8. Le backend genere un rapport PDF (MVP : pdfkit synchrone ; [CIBLE ROADMAP] DomPDF/n8n)
   -> Le QR code s'affiche sur l'ecran final
   -> Le client scanne et telecharge son rapport
```

---

## 4. RGPD / Conformite

Le respect du RGPD est integre par conception (privacy by design), pas ajoute apres coup.

### 4.1 Consentement

- Consentement explicite demande avant chaque seance (pas une seule fois a l'inscription).
- Ecran dedie avec texte clair, boutons "Accepter" et "Refuser".
- Le refus empeche toute capture -- la seance ne peut pas demarrer.
- Base legale : article 7 du RGPD (consentement libre, specifique, eclaire, univoque).

### 4.2 Retention des donnees

- Duree de conservation : 30 jours apres la derniere seance.
- Passe ce delai, les photos et donnees personnelles sont automatiquement supprimees ou anonymisees.
- Principe de minimisation : seules les donnees strictement necessaires sont collectees (nom, telephone, date de naissance, photos de seance).

### 4.3 Droits des personnes

- **Droit d'acces** : le client peut demander l'export de ses donnees (endpoint API dedie).
- **Droit a l'effacement** : suppression complete sur demande via l'API d'anonymisation.
- **Droit a la portabilite** : export JSON/PDF des donnees client.

### 4.4 Mesures techniques

- ETAT REEL (REALISE sur le device) : les photos de cuir chevelu sont ecrites CHIFFREES au repos en AES-256-GCM (extension `.jpg.enc`) via cryptoVault (`crypto-vault.service.ts`, appel dans `sync.service.ts` `savePhotoLocally`). La file de synchronisation et les tokens (device.token, crmToken, crmBearerToken) sont egalement chiffres au repos ; il n'y a plus de safeStorage ni de branche plaintext. La cle maitre est resolue par priorite env -> systemd-creds (liee au TPM en prod Pi) -> keyfile -> fallback dev, avec THROW explicite en production si aucune cle. La photo est dechiffree uniquement avant le push CRM (`crm-sync.service.ts` `pushPhotoCrm`).
- RESTE A FAIRE : securiser le backend mock (PDF de seance sans protection, secrets en dur, device_token non hache), pgcrypto sur colonnes sensibles, object storage chiffre, chiffrement de volume hebergeur, HDS UE/EEE.
- Transfert exclusivement en TLS (HTTPS).
- Pas de tracking, pas de cookies tiers, pas de partage a des services externes non declares.

---

## 5. Design Offline-First

Le WiFi en salon est souvent instable. Le systeme est concu pour fonctionner sans reseau.

### 5.1 File de synchronisation

Chaque action (creation client, capture photo, soumission diagnostic) est d'abord enregistree localement dans une file d'attente persistante. Lorsque le reseau est disponible, la file se vide automatiquement vers le CRM.

### 5.2 Stockage local des photos

Les captures microscopiques sont stockees sur le disque local du miroir. L'affichage est immediat, sans attendre l'upload vers le serveur.

### 5.3 Cache media

Les assets statiques (logos, videos de veille, configurations boutique) sont caches localement pour un demarrage sans reseau.

### 5.4 Degradation gracieuse

| Composant hors-ligne | Comportement                                         |
|-----------------------|------------------------------------------------------|
| CRM Backend           | Seances sauvees localement, sync au retour           |
| IA Service            | Message explicite, capture possible sans diagnostic   |
| Microscope            | Indicateur visuel dans la StatusBar, reconnexion auto |
| WiFi complet          | Mode autonome, toutes les donnees en local            |

---

## 6. Architecture Multi-Tenant

### 6.1 Isolation des donnees

Chaque boutique est un tenant isole. Les requetes sont filtrees par `boutique_id` a chaque niveau : middleware Laravel, policies Eloquent, contraintes PostgreSQL.

### 6.2 Configuration par miroir

Chaque miroir physique est identifie par son adresse MAC. Lors du provisioning, le miroir recoit sa configuration (boutique associee, branding, parametres IA). Le token d'authentification est stocke chiffre au repos en AES-256-GCM via le coffre applicatif cryptoVault (`config.service.ts`), independant du trousseau OS.

### 6.3 Roles et permissions

| Role          | Perimetre                                              |
|---------------|--------------------------------------------------------|
| super-admin   | Toutes les boutiques, configuration plateforme          |
| gerant        | Sa boutique, gestion collaborateurs, rapports           |
| collaborateur | Seances de sa boutique, clients, captures               |

---

## 7. Securite

### 7.1 Authentification

- **Miroir -> CRM** : authentification par adresse MAC lors du provisioning initial. Le CRM delivre un token (Sanctum en cible) stocke chiffre au repos en AES-256-GCM via cryptoVault (`config.service.ts`). Jamais de credentials en clair sur le disque : la branche plaintext a ete supprimee.
- **API** : Laravel Sanctum avec tokens revocables. Chaque miroir a son propre token.

### 7.2 Chiffrement

- ETAT REEL (REALISE sur le device) : photos cuir chevelu (`.jpg.enc`), file de synchronisation et tokens (device.token, crmToken, crmBearerToken) CHIFFRES au repos en AES-256-GCM via cryptoVault (`crypto-vault.service.ts`, `sync.service.ts`, `crm-sync.service.ts`, `config.service.ts`) ; plus de safeStorage ni de fallback plaintext ; cle maitre env -> systemd-creds (TPM) -> keyfile -> fallback dev, THROW en prod sans cle.
- RESTE A FAIRE : securisation du backend mock (PDF de seance sans protection, secrets en dur, device_token non hache), pgcrypto sur colonnes sensibles (CIBLE).
- Transferts : TLS obligatoire (HTTPS).
- Base de donnees : PostgreSQL 15 avec acces restreint par role.

### 7.3 Surface d'attaque reduite

- Le miroir est en mode kiosque : pas de barre d'adresse, pas d'acces systeme.
- Le microscope proxy ecoute uniquement sur localhost (:9100).
- Pas d'exposition de ports inutiles.

---

## 8. Chemin de Scalabilite

### 8.1 Etat actuel (MVP)

- Un docker-compose avec PostgreSQL 15-alpine, mock-api (Express :8100), mock-ia (Express :3001) et adminer.
- Un miroir en developpement, un tenant de test.
- 178 cas de test : 42 unitaires Vitest (dont `crypto-vault.service.test.ts` = 7 tests) + 136 e2e Playwright (4 fichiers) ; 4/9 services main couverts ; `crm-sync.service.ts` (372 l) a 0 test.

### 8.2 Post-MVP

| Axe                  | Solution                                              |
|----------------------|-------------------------------------------------------|
| Workflows asynchrones | N8N pour la generation PDF, notifications email, alertes |
| Files d'attente      | Redis queues (Laravel Horizon) pour les taches lourdes  |
| Temps reel           | Laravel Reverb (WebSocket) pour le statut de sync       |
| Scaling horizontal   | API stateless derriere un load balancer                 |
| Multi-region         | PostgreSQL replicas, CDN pour les assets statiques      |
| Monitoring           | Logs structures, metriques par tenant                   |

### 8.3 Integration Shopify

Synchronisation bidirectionnelle des clients et produits entre le CRM et la boutique Shopify du salon. Les recommandations IA peuvent etre liees directement aux produits du catalogue.

---

## 9. Pipeline de Diagnostic IA

> ETAT REEL : l'IA est MOCKEE (scores `Math.random`, `server.js:514-545`). Toute cette section 9 (hormis le cadre deontologique) decrit la CIBLE ROADMAP - le branchement OpenRouter - non encore implementee.

### 9.1 Architecture du service [CIBLE ROADMAP - non implemente]

Le microservice IA est decouple du CRM. Il recevra une image en base64 ou multipart, la transmettra a un modele de vision via OpenRouter, et retournera un diagnostic structure. En MVP, le proxy renvoie des scores aleatoires sans appel reseau.

### 9.2 Strategie de fallback a plusieurs modeles [CIBLE ROADMAP - non implemente]

```
Requete d'analyse
    |
    v
[Gemini Flash Vision] -- succes --> Retourne diagnostic
    |
    | echec/timeout
    v
[GPT-4o mini]         -- succes --> Retourne diagnostic
    |
    | echec/timeout
    v
[Claude 3.5 Haiku]    -- succes --> Retourne diagnostic
    |
    | echec total
    v
[Erreur gracieuse : "Analyse indisponible, reessayez"]
```

### 9.3 Niveaux de confiance

| Niveau         | Signification                                        |
|----------------|------------------------------------------------------|
| ok             | Diagnostic fiable, coherent avec les observations     |
| a_confirmer    | Diagnostic plausible, le praticien doit valider       |
| non_concluant  | Image insuffisante ou modele incertain, reprendre la capture |

### 9.4 Cadre deontologique

- Le diagnostic est strictement cosmetique, jamais medical.
- Le praticien a toujours le dernier mot.
- L'IA est un outil d'aide a la decision, pas un substitut au jugement professionnel.
- Les photos clients ne sont jamais utilisees pour entrainer des modeles.
- [CIBLE ROADMAP] Les modeles seront appeles via OpenRouter ; un routage possible hors UE impose un encadrement (Zero Data Retention, EU in-region, SCC) ou la minimisation avant tout envoi d'image.

---

## Annexes

### Ports et services

ETAT REEL (MVP). Les lignes Redis et Laravel relevent de la CIBLE ROADMAP, absentes du `docker-compose` actuel.

| Service                  | Port  | Protocole  | Etat          |
|--------------------------|-------|------------|---------------|
| Mirror App (dev)         | 5173  | HTTP       | REALISE       |
| API metier (mock Express)| 8100  | HTTP/REST  | REALISE       |
| IA Service (mock Express)| 3001  | HTTP/REST  | REALISE (mock)|
| Microscope Proxy         | 9100  | HTTP/MJPEG | REALISE       |
| PostgreSQL               | 5432  | TCP        | REALISE (PG15)|
| Adminer                  | 8080  | HTTP       | REALISE       |
| CRM Laravel              | 8000  | HTTP/REST  | CIBLE ROADMAP |
| Redis                    | 6379  | TCP        | CIBLE ROADMAP |

### Commandes principales

```bash
# Backend
cd smart-mirror && docker-compose up -d

# Mirror App
cd smart-mirror/mirror-app && pnpm dev

# Tests
cd smart-mirror/mirror-app && pnpm test          # Vitest
cd smart-mirror/mirror-app && npx playwright test # E2E

# Microscope (proxy WiFi/TCP JHCMD -> ffmpeg MJPEG :9100)
cd smart-mirror/microscope-proxy && node proxy.js
```
