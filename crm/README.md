<div align="center">
  <img src="frontend/public/logo-kbeauty.svg" alt="KBeauty Mirror CRM" height="90" />

# KBeauty Mirror CRM

**Le CRM tout-en-un pour les instituts de beauté connectés**

_Miroir interactif · Analyse IA capillaire · Rapports PDF personnalisés_

---

[![PHP](https://img.shields.io/badge/PHP-8.4-d4a38e?style=flat-square&logo=php&logoColor=white)](https://php.net)
[![Laravel](https://img.shields.io/badge/Laravel-13-c5907b?style=flat-square&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19-d4a38e?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-323032?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-a67b66?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-c5907b?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-d4a38e?style=flat-square&logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-323032?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![Node.js](https://img.shields.io/badge/Node.js-20-a67b66?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)

</div>

---

## Table des matières

- [À propos](#-à-propos)
- [Aperçu](#-aperçu)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture technique](#-architecture-technique)
- [Structure du projet](#-structure-du-projet)
- [Installation & Lancement](#-installation--lancement)
- [Variables d'environnement](#-variables-denvironnement)
- [Frontend — Architecture détaillée](#-frontend--architecture-détaillée)
- [Commandes Make disponibles](#-commandes-make-disponibles)
- [Liens utiles](#-liens-utiles)

---

## À propos

**KBeauty Mirror CRM** est une plateforme professionnelle conçue pour les réseaux d'instituts de beauté équipés de miroirs connectés. Elle centralise la gestion de la clientèle, pilote les appareils en temps réel, délègue l'analyse capillaire à un micro-service IA, et génère des rapports PDF personnalisés automatiquement envoyés par email après chaque soin.

Le projet est découpé en trois services indépendants orchestrés par Docker Compose :

- **Backend API** — Laravel 13, la source de vérité métier
- **Frontend CRM** — React 19, l'interface de pilotage pour l'équipe
- **IA Service** — Node.js 20 / Express, l'analyseur d'images capillaires par LLM multi-modèle

---

## Aperçu

> _Ajoutez vos captures d'écran dans `docs/screenshots/` et remplacez les chemins ci-dessous._

|                  Dashboard                   |              Fiche cliente               |         Séance & diagnostic IA         |
| :------------------------------------------: | :--------------------------------------: | :------------------------------------: |
| ![Dashboard](docs/screenshots/dashboard.png) | ![Cliente](docs/screenshots/cliente.png) | ![Séance](docs/screenshots/seance.png) |

---

## Fonctionnalités

**Gestion multi-boutiques**

- Tableau de bord avec métriques en temps réel (séances du jour, clients, miroirs en ligne)
- Gestion des boutiques, équipes (gérant / collaborateur) et rôles
- Vue unifiée cross-boutiques pour les administrateurs

**Clientèle & RGPD**

- Fiche client complète (coordonnées, historique de séances, consentements GDPR)
- Anonymisation one-click conforme RGPD
- Export CSV et Shopify

**Miroir connecté**

- Inscription et authentification des appareils par MAC + token device
- Heartbeat WebSocket (Laravel Reverb) — statut en ligne / hors-ligne en temps réel
- Configuration de l'affichage miroir (logo, couleurs, médias, produits)

**Analyse IA capillaire**

- Upload de photos scalp/cheveux depuis le miroir
- Analyse multi-modèle avec fallback automatique (GitHub Models: Llama 3.2 Vision → Phi-3.5 → GPT-4o mini)
- 8 catégories cosmétiques, score de confiance, recommandations produits
- Vocabulaire strictement cosmétique (aucune terminologie médicale — conformité CNIL)

**Rapports & Automatisation**

- Génération PDF automatique à la fin de chaque séance
- QR code unique par rapport, suivi du premier scan
- Pipeline n8n : envoi email Brevo, notifications WebSocket, purge des photos, suivi QR

**Médiathèque & Produits**

- Bibliothèque d'images et vidéos YouTube affichées sur le miroir
- Catalogue produits avec synchronisation Shopify

---

## Architecture technique

| Couche              | Technologies                                                                                                    | Port     |
| ------------------- | --------------------------------------------------------------------------------------------------------------- | -------- |
| **Frontend**        | React 19 · TypeScript 5.9 · Tailwind CSS 4 · Vite 8 · TanStack Query · React Router 7 · Recharts · Lucide Icons | `3000`   |
| **Backend API**     | Laravel 13 · PHP 8.4 · Sanctum · Reverb · DomPDF · php-qrcode                                                   | `8000`   |
| **IA Service**      | Node.js 20 · Express 4 · GitHub Models API                                                                      | `3002`   |
| **Base de données** | PostgreSQL 16 (extension `unaccent`)                                                                            | `5432`   |
| **Cache / Queue**   | Redis 7                                                                                                         | `6379`   |
| **WebSocket**       | Laravel Reverb                                                                                                  | `8080`   |
| **Reverse proxy**   | Traefik (prod) · Nginx (prod standalone)                                                                        | `80/443` |

### Flux de données (séance type)

```
Miroir (device) ──POST /api/miroir/seances──► Backend (Laravel)
                                                    │
                      ┌─────────────────────────────┤
                      │                             │
              IA Service                       PostgreSQL
        POST /api/analyze               (séance, photos, bilan_ia)
         (base64 image)                             │
              │                                     │
         JSON bilan                        n8n webhook
              │                         (PDF → email Brevo)
              └─────────────────────────────────────► miroir
                                          WebSocket (Reverb)
```

---

## Structure du projet

```
kbeauty-mirror-crm/
├── backend/                 # API Laravel 13
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── Api/Auth*          # Authentification & reset mdp
│   │   │   │   ├── Api/Miroir/        # Endpoints device (miroir)
│   │   │   │   ├── Api/Crm/           # Endpoints CRM (frontend)
│   │   │   │   └── Api/N8n/           # Endpoints automation
│   │   │   └── Middleware/            # CORS · rôles · token n8n
│   │   ├── Jobs/                      # CheckQrAndNotifyJob
│   │   ├── Models/                    # Boutique, Cliente, Seance, Photo…
│   │   └── Services/                  # ShopifyService
│   ├── config/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/
│       ├── api.php                    # Toutes les routes API
│       └── console.php                # Scheduler (heartbeat check)
│
├── frontend/                # React 19 + TypeScript
│   └── src/
│       ├── components/      # Layout, Sidebar, Modal, Pagination…
│       ├── hooks/           # useDarkMode
│       ├── lib/
│       │   ├── api.ts       # Client HTTP (fetch + auth headers)
│       │   ├── auth.tsx     # AuthContext + AuthProvider
│       │   ├── echo.ts      # Laravel Echo (WebSocket Reverb)
│       │   ├── hooks.ts     # React Query hooks (useClientes, useSeances…)
│       │   └── types.ts     # TypeScript interfaces
│       └── pages/           # Dashboard, Clientes, SeanceDetail, Miroirs…
│
├── ia-service/              # Micro-service IA (Node.js)
│   └── src/
│       └── server.js        # Express + GitHub Models + fallback chain
│
├── docker/                  # Dockerfiles & configs Nginx
├── docker-compose.yml       # Dev (Traefik)
├── docker-compose.prod.yml  # Production (Nginx)
├── Makefile                 # Commandes courantes
└── docs/
    └── API.md               # Documentation API complète
```

---

## Installation & Lancement

### Prérequis

- [Docker](https://docs.docker.com/get-docker/) ≥ 24 et Docker Compose v2
- (optionnel) PHP 8.4 + Composer pour le développement local sans Docker

---

### 1 — Cloner et configurer l'environnement

```bash
git clone https://github.com/<votre-org>/kbeauty-mirror-crm.git
cd kbeauty-mirror-crm

# Copier et remplir les variables d'environnement
cp .env.example .env
```

Éditez `.env` avec vos propres valeurs (voir la section [Variables d'environnement](#-variables-denvironnement)).

---

### 2 — Lancer les services

```bash
# Construction et démarrage de tous les conteneurs
make up

# Ou directement
docker compose up -d
```

---

### 3 — Initialiser la base de données

```bash
# Migrations + seed (données de démo)
make migrate-fresh
```

---

### 4 — Accéder à l'application

| Service      | URL locale            |
| ------------ | --------------------- |
| Frontend CRM | http://localhost:3000 |
| API Backend  | http://localhost:8000 |
| IA Service   | http://localhost:3002 |

**Compte de démo** : `admin@kbeauty.fr` / `password`

---

### Développement local (sans Docker)

```bash
# Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
composer dev   # Lance API + queue + logs + Vite en parallèle

# Frontend (dans un autre terminal)
cd frontend
npm install
npm run dev

# IA Service
cd ia-service
npm install
npm run dev
```

---

## Variables d'environnement

Copiez `.env.example` en `.env` et renseignez les variables suivantes :

| Variable                 | Description                                         | Exemple                               |
| ------------------------ | --------------------------------------------------- | ------------------------------------- |
| `APP_KEY`                | Clé de chiffrement Laravel (généré automatiquement) | `base64:...`                          |
| `DB_DATABASE`            | Nom de la base PostgreSQL                           | `kbeauty_crm`                         |
| `DB_USERNAME`            | Utilisateur PostgreSQL                              | `kbeauty`                             |
| `DB_PASSWORD`            | Mot de passe PostgreSQL                             | _(secret)_                            |
| `REVERB_APP_KEY`         | Clé publique WebSocket                              | `kbeauty-reverb-key`                  |
| `REVERB_APP_SECRET`      | Secret WebSocket                                    | _(secret)_                            |
| `GITHUB_TOKEN`           | Token GitHub pour GitHub Models API                 | `ghp_...`                             |
| `MIRROR_SHARED_SECRET`   | Secret partagé entre backend et IA service          | _(random 32 chars)_                   |
| `SHOPIFY_DOMAIN`         | Domaine Shopify (optionnel)                         | `mystore.myshopify.com`               |
| `SHOPIFY_ACCESS_TOKEN`   | Token accès Shopify (optionnel)                     | `shpat_...`                           |
| `N8N_TOKEN`              | Token statique pour les webhooks n8n                | _(secret)_                            |
| `N8N_WEBHOOK_SEANCE_FIN` | URL webhook n8n déclenchée à la fin d'une séance    | `https://n8n.example.com/webhook/...` |
| `NOCODEUR_WEBHOOK_URL`   | URL webhook pour la notification QR                 | `https://n8n.example.com/webhook/...` |
| `TEST_CLIENT_EMAIL`      | Email du client de test (dev uniquement)            | `admin@kbeauty.fr`                    |

> **Sécurité** — Ne commettez jamais le fichier `.env`. Il est exclu par `.gitignore`.  
> Générez des secrets forts avec : `openssl rand -hex 32`

---

## Frontend — Architecture détaillée

### Stack

| Librairie                    | Rôle                                               |
| ---------------------------- | -------------------------------------------------- |
| **React 19**                 | UI (Strict Mode activé)                            |
| **TypeScript 5.9**           | Typage statique complet                            |
| **Tailwind CSS 4**           | Design system utilitaire (Vite plugin)             |
| **Vite 8**                   | Bundler + HMR                                      |
| **TanStack Query 5**         | Gestion du cache serveur, invalidation, pagination |
| **React Router 7**           | Routage SPA avec routes protégées                  |
| **Laravel Echo + Pusher.js** | Événements temps réel (WebSocket Reverb)           |
| **Recharts 3**               | Graphiques du dashboard                            |
| **@hello-pangea/dnd**        | Drag & drop (médiathèque, réordonnancement)        |
| **Lucide React**             | Bibliothèque d'icônes                              |

### Palette de couleurs

| Nom              | Hex       | Rôle                        |
| ---------------- | --------- | --------------------------- |
| `primary`        | `#d4a38e` | Boutons principaux, accents |
| `primary-light`  | `#e8c9b5` | Fonds clairs                |
| `primary-dark`   | `#c5907b` | Hover, liens actifs         |
| `primary-deeper` | `#a67b66` | Éléments de mise en avant   |
| `dark`           | `#323032` | Header sombre, texte fort   |
| `offwhite`       | `#fcfcfc` | Fond général                |
| `success`        | `#10b981` | Statuts positifs            |
| `warning`        | `#f59e0b` | Alertes                     |
| `danger`         | `#ef4444` | Erreurs, suppressions       |

Typographie : **Montserrat** (corps) · **Playfair Display** (titres)

### Lancement

```bash
# Développement
npm run dev        # http://localhost:3000

# Production
npm run build      # Génère dist/
npm run preview    # Prévisualise le build
```

### Architecture des composants

```
src/
├── components/
│   ├── Layout.tsx         # Wrapper principal (sidebar + outlet + nav mobile)
│   ├── Sidebar.tsx        # Navigation latérale desktop
│   ├── BottomNav.tsx      # Navigation mobile
│   ├── Modal.tsx          # Portail modale générique
│   ├── PageHeader.tsx     # En-tête de page réutilisable
│   ├── Pagination.tsx     # Composant de pagination
│   └── StatusBadge.tsx    # Badge de statut (en ligne/hors ligne)
├── lib/
│   ├── api.ts             # fetch wrapper avec token Bearer + boutique header
│   ├── auth.tsx           # AuthContext (login, logout, rôles)
│   ├── echo.ts            # Instance Laravel Echo (WebSocket)
│   ├── hooks.ts           # React Query hooks typés (useClientes, useSeances…)
│   └── types.ts           # Interfaces TypeScript (User, Cliente, Seance…)
├── hooks/
│   └── useDarkMode.ts     # Dark mode avec persistance localStorage
└── pages/
    ├── Dashboard.tsx      # Métriques, graphiques, miroirs en ligne
    ├── Clientes.tsx       # Liste paginée + recherche full-text
    ├── ClienteDetail.tsx  # Fiche + historique + RGPD
    ├── SeanceDetail.tsx   # Détail séance + photos + bilan IA
    ├── Miroirs.tsx        # Gestion des miroirs + statut temps réel
    ├── Mediatheque.tsx    # Bibliothèque médias (images + YouTube)
    ├── Produits.tsx       # Catalogue produits + sync Shopify
    ├── Equipe.tsx         # Gestion utilisateurs
    ├── Boutiques.tsx      # Gestion boutiques (super-admin)
    ├── ExportPage.tsx     # Exports CSV / Shopify
    └── RgpdPage.tsx       # Outils conformité RGPD
```

---

## Commandes Make disponibles

```bash
make up              # Démarrer tous les services
make down            # Arrêter tous les services
make restart         # Redémarrer
make build           # Rebuilder les images (--no-cache)
make logs            # Suivre les logs
make migrate         # Lancer les migrations
make migrate-fresh   # Reset BDD + seed
make seed            # Injecter les données de démo
make test            # Lancer la suite de tests PHPUnit
make test-coverage   # Tests avec rapport de couverture
make shell-back      # Shell dans le conteneur backend
make shell-front     # Shell dans le conteneur frontend
make shell-db        # psql dans PostgreSQL
make queue-work      # Démarrer le worker de queue manuellement
make reverb-start    # Démarrer le serveur WebSocket en mode debug
make up-prod         # Lancer en mode production
```

---

## Liens utiles

- [Documentation API complète](docs/API.md)
- [GitHub Models — catalogue des modèles disponibles](https://github.com/marketplace/models)
- [Laravel Reverb — WebSocket](https://reverb.laravel.com)
- [Laravel Sanctum — auth API](https://laravel.com/docs/sanctum)
- [TanStack Query](https://tanstack.com/query)

---

<div align="center">
  <sub>Fait avec soin pour les instituts K Beauty &mdash; &copy; 2026</sub>
</div>
