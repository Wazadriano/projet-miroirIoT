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

| Parametre       | Valeur                                      |
|-----------------|---------------------------------------------|
| Framework       | Laravel 13, PHP 8.4                          |
| Base de donnees | PostgreSQL 16                                |
| Cache/Queues    | Redis 7                                      |
| Auth            | Laravel Sanctum (tokens revocables)          |
| PDF             | DomPDF (generation cote serveur)             |
| WebSocket       | Laravel Reverb                               |
| Workflows       | N8N (orchestration externe)                  |
| Sync e-commerce | Shopify API                                  |
| Port            | :8000                                        |

Le backend est multi-tenant : chaque boutique est isolee au niveau des donnees. Trois roles : super-admin (plateforme), gerant (boutique), collaborateur (praticien).

### 2.3 IA Service (Microservice Diagnostic)

| Parametre       | Valeur                                      |
|-----------------|---------------------------------------------|
| Runtime         | Node.js + Express                            |
| API             | GitHub Models API                            |
| Modeles         | Llama 3.2 (primaire), Phi 3.5 (fallback 1), GPT-4o mini (fallback 2) |
| Port            | :3001                                        |

Le service recoit une photo capturee par le microscope, la transmet au modele de vision, et retourne un diagnostic structure en JSON. Le fallback a trois niveaux garantit la disponibilite meme en cas d'indisponibilite d'un modele.

Important : le diagnostic est cosmetique, jamais medical. Le praticien conserve toujours le dernier mot.

### 2.4 Microscope Proxy

| Parametre       | Valeur                                      |
|-----------------|---------------------------------------------|
| Materiel        | Ninyoon 4K USB UVC                           |
| Grossissement   | x50 a x200                                  |
| Capture         | Python (V4L2) -> MJPEG                       |
| Proxy           | Node.js HTTP relay                           |
| Bouton physique | Python listener (GPIO/USB HID)               |
| Port            | :9100                                        |

Le proxy capture le flux video USB, le convertit en MJPEG et le sert sur localhost. L'application Electron consomme ce flux dans un tag img/video standard.

---

## 3. Flux de Donnees : De la Capture au Rapport PDF

```
1. Le praticien positionne le microscope sur le cuir chevelu du client
        |
2. Le flux MJPEG en direct s'affiche sur l'ecran Session
   (Microscope USB -> stream.py -> proxy.js:9100 -> Electron <img>)
        |
3. Le praticien appuie sur "Capturer" (ou bouton physique)
   -> La frame MJPEG est extraite et stockee localement (fichier + store Zustand)
        |
4. Jusqu'a 4 zones capturees par seance
        |
5. Le praticien lance l'analyse IA
   -> Les photos sont envoyees au service IA (:3001)
   -> Fallback : Llama 3.2 -> Phi 3.5 -> GPT-4o mini
   -> Reponse JSON : diagnostic, recommandations, niveau de confiance
        |
6. Les resultats s'affichent sur l'ecran Session
   -> Niveau de confiance : ok / a_confirmer / non_concluant
   -> Le praticien valide ou ajuste
        |
7. La seance est synchronisee vers le CRM (:8000)
   -> Photos uploadees, diagnostic sauvegarde (JSONB)
   -> Si hors-ligne : file d'attente locale, sync automatique au retour du reseau
        |
8. Le CRM genere un rapport PDF via DomPDF
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

- Photos chiffrees en local (Electron safeStorage).
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

Chaque miroir physique est identifie par son adresse MAC. Lors du provisioning, le miroir recoit sa configuration (boutique associee, branding, parametres IA). Le token d'authentification est stocke dans le keychain OS via Electron safeStorage.

### 6.3 Roles et permissions

| Role          | Perimetre                                              |
|---------------|--------------------------------------------------------|
| super-admin   | Toutes les boutiques, configuration plateforme          |
| gerant        | Sa boutique, gestion collaborateurs, rapports           |
| collaborateur | Seances de sa boutique, clients, captures               |

---

## 7. Securite

### 7.1 Authentification

- **Miroir -> CRM** : authentification par adresse MAC lors du provisioning initial. Le CRM delivre un token Sanctum stocke dans Electron safeStorage (keychain OS). Jamais de credentials en clair sur le disque.
- **API** : Laravel Sanctum avec tokens revocables. Chaque miroir a son propre token.

### 7.2 Chiffrement

- Photos locales : chiffrees via Electron safeStorage.
- Transferts : TLS obligatoire (HTTPS).
- Base de donnees : PostgreSQL avec acces restreint par role.

### 7.3 Surface d'attaque reduite

- Le miroir est en mode kiosque : pas de barre d'adresse, pas d'acces systeme.
- Le microscope proxy ecoute uniquement sur localhost (:9100).
- Pas d'exposition de ports inutiles.

---

## 8. Chemin de Scalabilite

### 8.1 Etat actuel (MVP)

- Un docker-compose avec PostgreSQL, mock-api et adminer.
- Un miroir en developpement, un tenant de test.
- 65+ tests unitaires et E2E.

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

### 9.1 Architecture du service

Le microservice IA est decouple du CRM. Il recoit une image en base64 ou multipart, la transmet a un modele de vision via l'API GitHub Models, et retourne un diagnostic structure.

### 9.2 Strategie de fallback a trois modeles

```
Requete d'analyse
    |
    v
[Llama 3.2 Vision] -- succes --> Retourne diagnostic
    |
    | echec/timeout
    v
[Phi 3.5 Vision]   -- succes --> Retourne diagnostic
    |
    | echec/timeout
    v
[GPT-4o mini]      -- succes --> Retourne diagnostic
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
- Les modeles sont appeles via API, les images ne sont pas stockees cote fournisseur IA.

---

## Annexes

### Ports et services

| Service           | Port  | Protocole |
|-------------------|-------|-----------|
| Mirror App (dev)  | 5173  | HTTP      |
| CRM API           | 8000  | HTTP/REST |
| IA Service        | 3001  | HTTP/REST |
| Microscope Proxy  | 9100  | HTTP/MJPEG|
| PostgreSQL        | 5432  | TCP       |
| Redis             | 6379  | TCP       |
| Adminer           | 8080  | HTTP      |

### Commandes principales

```bash
# Backend
cd smart-mirror && docker-compose up -d

# Mirror App
cd smart-mirror/mirror-app && pnpm dev

# Tests
cd smart-mirror/mirror-app && pnpm test          # Vitest
cd smart-mirror/mirror-app && npx playwright test # E2E

# Microscope
cd smart-mirror/microscope-proxy && python3 stream.py & node proxy.js
```
