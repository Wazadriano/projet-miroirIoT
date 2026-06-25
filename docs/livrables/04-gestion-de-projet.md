# Livrable 4 — Gestion de projet

Projet : Miroir connecté de diagnostic capillaire — KBEAUTY / K Beauty Cosmetics
Chef de projet : Adriano Palamara (chef de projet unique)
Date : 15 juin 2026

---

## 1. Méthodologie : Merise Agile + TDD, justifiée

Le projet a été piloté selon une méthodologie hybride : **Merise pour la rigueur du modèle de données, Agile pour le rythme d'enrichissement, TDD pour la fiabilité du code**.

### La question piège anticipée

> « Merise, c'est du cycle en V, ce n'est pas de l'agile. »

C'est une confusion fréquente entre une **méthode de modélisation** et un **cycle de vie projet**. Merise n'impose aucun cycle : c'est un formalisme de conception des données (MCD) et des traitements (MCT). On peut donc l'instancier dans un cycle itératif.

Ma démarche :
- **Merise apporte la rigueur structurelle** : le MCD/MCT garantit que les entités (Client, Séance, Capture, Analyse, Boutique, Tenant) et leurs relations sont cohérentes avant tout code. C'est le rempart contre la dette de modélisation, irréversible une fois la base remplie.
- **L'itération agile enrichit le modèle sprint par sprint** : le MCD n'est pas figé en amont. **Sprint 0 = un MCD squelettique** (Client, Séance, Capture). Chaque sprint ajoute les entités émergeant des user stories réellement implémentées (Analyse IA, QR/PDF, Sync, multi-tenant).
- **TDD ancre la qualité** : sur les chemins critiques (synchronisation hors-ligne, parsing des réponses IA, chiffrement au repos), le test est écrit avant le code. C'est mesurable : 42 tests unitaires Vitest + 136 cas E2E Playwright (détail section 4).

Autrement dit : **Merise n'est pas le cycle, c'est l'outil de modélisation utilisé à l'intérieur d'un cycle agile.** La rigueur du modèle de données et l'adaptabilité du planning ne s'opposent pas, elles se complètent.

---

## 2. Le cycle en 5 phases

| Phase | Nom | Livrable de sortie | Activité Merise / Agile |
|-------|-----|--------------------|--------------------------|
| 0 | **Document Project** | Cartographie du brownfield, dictionnaire de données initial | Inventaire de l'existant, premières entités |
| 1 | **Analyse** | Brief → PRD, besoins KBEAUTY, contraintes RGPD/RED | MCD squelettique, user stories |
| 2 | **Planning** | Architecture technique, découpage Epics / User Stories | MCT (workflows métier), backlog priorisé |
| 3 | **Solutioning** | Sprint planning, estimations J/H, choix de stack | Validation croisée MCD/MCT |
| 4 | **Implementation** | Code + tests + revue | TDD, enrichissement incrémental du MCD |

Les phases 1 à 4 sont rejouées à chaque incrément : le cycle est **itératif, pas séquentiel**.

---

## 3. Backlog reconstitué

Estimations en jours/homme (J/H). Statut au 15/06/2026 : `Fait` / `Partiel` / `À faire`.

| Epic | User stories | J/H | Statut |
|------|--------------|-----|--------|
| **E1 — Miroir (device)** | App Electron 33 kiosque plein écran ; 9 écrans React 19 ; clavier virtuel tactile ; mode veille (MediaPlayer) ; ErrorBoundary | 18 | Fait |
| **E2 — Provisioning** | Identification du miroir ; association à 1 boutique / 1 tenant ; stockage config locale ; WiFi `wlan0` via `wifi.service.ts` (mono-interface, double-WiFi non implémenté V1) | 6 | Partiel |
| **E3 — Workflow séance** | Recherche/création client ; consentement explicite ; capture microscope WiFi/TCP JHCMD (4 zones max) ; affichage diagnostic | 14 | Fait |
| **E4 — Analyse IA** | Envoi snapshot JPEG au proxy `:3001` ; **IA mockée en V1** (scores `Math.random`, `server.js:514-545`) ; parsing JSON ; niveau de confiance. Cible : appel OpenRouter cloud (~0,002 EUR/analyse) | 10 | Fait (mock) |
| **E5 — PDF / QR Code** | Génération rapport PDF côté CRM ; affichage QR ; téléchargement client | 6 | Partiel |
| **E6 — Sync médias / hors-ligne** | File d'attente locale ; reprise au retour réseau ; cache assets (`media-cache.service.ts`, `sync.service.ts`) | 9 | Fait |
| **E7 — Backend / CRM** | API mock locale (Node 20 + Express + PostgreSQL 15) ; CRM distant Laravel/Sanctum (api-kbeauty.a3n.fr) ; `crm-sync.service.ts` (372 lignes, **0 test**) | 12 | Partiel |
| **E8 — Export Shopify** | Synchronisation clients/produits vers boutique Shopify KBEAUTY | 5 | À faire |
| **E9 — Back-office** | Pilotage tenant, supervision miroirs, gestion collaborateurs | 8 | À faire |
| **E10 — Sécurité & conformité** | Fondations Electron déjà en place (contextIsolation, preload, IPC, sandbox actif `index.ts:51`, CSP en production `index.ts:121-143`) ; chiffrement au repos AES-256-GCM (cryptoVault) des photos (`.jpg.enc`), de la file de sync et des tokens **réalisé** ; restants = sécuriser le backend mock, audit deps CI bloquant, pgcrypto ; dossier RGPD Chapitre V | 11 | Partiel |

Couverture : les 4 briques (miroir E1-E3, backend E7, IA E4, back-office E9) et 6+ processus métier (workflow séance E3, provisioning E2, analyse IA E4, PDF/QR E5, sync médias E6, export Shopify E8) sont tracés.

> **Note de transparence (Mantra IA-16) :** E2, E5, E7, E10 sont en `Partiel`, E8 et E9 en `À faire`. Le périmètre de soutenance MVP est **1 boutique / 1 tenant** ; la cible commerciale est **6 miroirs / 3 boutiques** (Nice, Lyon, Cannes).

---

## 4. Niveaux de test et application réelle

Priorité Merise Agile : **Unit > Integration > E2E** (préférer les niveaux bas, plus rapides et moins fragiles).

| Niveau | Outil | Cas réels | Application concrète |
|--------|-------|-----------|----------------------|
| **Unit** | Vitest | 42 | Logique isolée : `api-client.service`, `config.service`, `sync.service`, `crypto-vault.service` (7 tests, anti-régression chiffrement) |
| **Integration** | (à formaliser) | — | Tests API first-class, non encore industrialisés |
| **E2E** | Playwright | 136 (4 specs) | Parcours utilisateur complets sur l'app Electron |

**Total : 178 cas réels.** Couverture honnête : **4 services sur 9** sont couverts en unitaire. Le service `crm-sync.service.ts` (372 lignes) est à **0 test** — c'est le risque technique n°1 du backlog.

**Outillage déjà en place :** CI GitHub Actions (`ci.yml`, audit deps non encore bloquant), `playwright.config` et ESLint flat config présents. **Dette assumée :** configuration de couverture (`--coverage`) non encore industrialisée et audit deps CI à rendre bloquant après `npm audit fix`. `npm audit` à re-vérifier la veille de l'oral.

Cette franchise est volontaire : la méthode Merise Agile + TDD privilégie une **mesure réelle** plutôt qu'un affichage flatteur. Connaître précisément la dette est une condition du pilotage.

---

## 5. Positionnement : un chef de projet, un outillage IA

**Adriano est le chef de projet unique et le seul auteur des décisions.** Toutes les arbitrages — choix de stack (device Electron 33 + React 19 + TypeScript 5.7 + Zustand 5 ; backend Node 20 + Express + PostgreSQL 15 ; CRM Laravel/Sanctum ; **pas de Redis** ; stack Bun/Supabase/Vercel des anciennes specs **abandonnée**), priorisation du backlog, décisions d'ingénierie (ex. dimensionnement RAM du Raspberry Pi 5 conditionné à une mesure 48h, pas à un a priori) — relèvent du chef de projet.

Les **agents BYAN** (Hermes, architect, dev, quinn, tea, etc.) sont un **outillage IA d'assistance** : aide à la rédaction, à la modélisation et à la revue. Ce sont des outils logiciels, **jamais une équipe humaine**. Aucun agent n'a de responsabilité de livraison ni de signature : c'est un copilote, pas un collaborateur.

Ce positionnement est aussi un argument de différenciation produit : face aux concurrents établis (L'Oréal/Kérastase K-Scan, BECON soutenu par Samsung, FotoFinder, Aram Huvis ARAMO, CareOS Poseidon, HiMirror), la valeur du projet n'est pas « il n'y a pas de concurrent », mais une **intégration verticale** (microscope WiFi bas coût + IA cloud en cible + CRM Shopify) ciblée institut K-beauty premium.

---

*Remerciements et parcours : [A COMPLETER : identité et activité d'OHADJA, TJM d'Adriano, parcours personnel, remerciements].*
