

**CDC TECHNIQUE**

**Smart Mirror**

K Beauty Cosmetics — Bubble Hair Spa

|  |  |
| :---- | :---- |
| Projet | Smart Mirror — Miroir connecté d'analyse capillaire |
| Client | K Beauty Cosmetics / Bubble Hair Spa (Nice, Lyon, Cannes) |
| Équipe | DreamTech |
| Version | 4.0 — retours reviewer intégrés |
| Date | Mars 2026 |
| Statut | En cours de validation |

Blocs colorés \= qui fait quoi :

| \[ DÉVS \] | \[ NO-CODEUR \] | \[ GRAPHISTE \] | \[ MARKETING \] |
| :---: | :---: | :---: | :---: |

# **1\. Ce qu'on construit**

K Beauty Cosmetics possède 3 boutiques (Nice, Lyon, Cannes). Chaque boutique propose un soin capillaire premium avec analyse microscopique du cuir chevelu. Aujourd'hui ce service repose sur une tablette. On la remplace par un miroir connecté intelligent.

## **1.1 Le système en 3 parties**

| Partie | Ce que c'est | Qui l'utilise |
| :---- | :---- | :---- |
| Le miroir en boutique | Miroir tactile avec microscope sans fil. La praticienne filme, capture, l'IA analyse, un rapport PDF est généré avec QR code. Appelle uniquement l'API — pas d'accès direct à la DB ni au CRM. | Praticienne en boutique |
| Le CRM web | Interface de gestion réservée aux gérants : fiches clientes, historique, pilotage du miroir (affichage, médias, produits), médiathèque, gestion d'équipe. | Gérant et collaborateurs autorisés |
| L'API Laravel | Unique point d'entrée vers la base de données. Répond aux appels du miroir ET du CRM. WebDB ne génère pas l'API — il visualise la DB. | Miroir \+ CRM (HTTP) |

## **1.2 Parcours d'une séance**

| Étape | Ce qui se passe | Acteur |
| :---- | :---- | :---- |
| 1 — Accueil | La praticienne cherche la fiche cliente ou en crée une | Miroir → API Laravel |
| 2 — Consentement | La cliente valide l'écran RGPD. L'API refuse toute séance sans consentement valide. | Miroir \+ cliente |
| 3 — Capture avant soin | Microscope actif, praticienne capture une photo | Miroir \+ microscope |
| 4 — Analyse IA | Photo envoyée au serveur Express → OpenRouter → diagnostic JSON retourné | Miroir → Express → OpenRouter |
| 5 — Stockage | Diagnostic stocké via l'API. Photo enregistrée localement ET envoyée au serveur. | Miroir → API Laravel |
| 6 — Soin en cours | Miroir diffuse la playlist de médias promotionnels | Miroir |
| 7 — Capture après soin | Nouvelle photo, nouveau diagnostic, comparaison avant/après | Miroir → Express → API |
| 8 — Fin de séance | L'API déclenche n8n via webhook. n8n génère PDF \+ QR code. | API → n8n |
| 9 — QR non scanné | Si QR non scanné après 1h et email disponible, n8n envoie le PDF par email | n8n (cron) |
| 10 — Retour accueil | Miroir revient en mode veille | Automatique |

# **2\. Architecture technique**

## **2.1 Stack complète**

| Composant | Technologie | Rôle | Hébergement |
| :---- | :---- | :---- | :---- |
| Base de données | PostgreSQL 15 | Toutes les données métier | Serveur dédié EU |
| Interface DB (no-codeur) | WebDB (open-source, self-hosted) | Visualisation et gestion visuelle de la DB — outil interne uniquement, jamais appelé par le miroir ni le CRM | Serveur dédié |
| API principale | Laravel 13 (PHP 8.4) [CIBLE ROADMAP - non implemente ; backend realise = mock Express] | Reçoit tous les appels du miroir et du CRM. Unique point d'entrée vers PostgreSQL. | Serveur dédié |
| Automatisations | n8n (self-hosted) | PDF, QR code, webhook scan, email fallback, cron RGPD — communique via l'API Laravel | Serveur dédié |
| Serveur IA | Express (Node.js 20 LTS) | Proxy dédié : reçoit la photo du miroir, appelle OpenRouter, retourne le diagnostic. Authentifié par token partagé. | Serveur dédié |
| CRM | React 19 \+ TypeScript | Interface gérant : clientes, séances, miroirs, médias, produits | Navigateur web |
| Miroir | Electron \+ React (Debian 12, kiosk) | Interface praticienne, flux microscope, séance, QR code | On-premise boutique |
| IA | OpenRouter (Gemini Flash 1.5) | Analyse des photos capillaires | Cloud (OpenRouter) |
| Shopify | API Shopify | Catalogue produits, export clientes | Shopify |

## **2.2 Règle d'architecture fondamentale**

ℹ  Le miroir et le CRM ne parlent JAMAIS directement à PostgreSQL. Tout passe par l'API Laravel. WebDB est un outil interne réservé au no-codeur — jamais exposé à l'extérieur.

| Qui appelle | Qui répond | Pour quoi |
| :---- | :---- | :---- |
| Miroir | API Laravel | Chercher/créer une cliente, enregistrer consentement, créer/terminer séance, uploader photo, récupérer config et playlist |
| Miroir | Serveur Express (IA) | Analyser une photo — retourne le diagnostic JSON. Authentifié par token partagé miroir/Express. |
| CRM React | API Laravel | Toutes les opérations CRUD (clientes, séances, miroirs, médias, produits, utilisateurs) |
| API Laravel | n8n (webhook) | Déclencher génération PDF \+ QR à la fin d'une séance |
| n8n | API Laravel | Mettre à jour la séance (rapport\_pdf\_path, rapport\_url) \+ vérifier scan QR \+ marquer email\_envoye |
| n8n (cron) | API Laravel | Lister les séances non scannées après 1h pour l'email fallback |
| n8n (cron) | API Laravel | Lister les photos/PDFs à supprimer (rétention RGPD) |

⚠  n8n ne se connecte JAMAIS directement à PostgreSQL. Il passe par l'API Laravel. Cela garantit que toute la logique métier (filtrage boutique, validation) reste centralisée.

## **2.3 Sécurité des endpoints**

| Endpoint | Authentification | Restriction |
| :---- | :---- | :---- |
| API Laravel (endpoints miroir) | Token device JWT (généré au provisioning, durée 24h avec refresh) | Accès limité aux routes miroir uniquement — pas d'accès aux routes CRM |
| API Laravel (endpoints CRM) | JWT Laravel Sanctum (email \+ mot de passe gérant) | Chaque requête filtrée par boutique\_id côté applicatif Laravel |
| API Laravel (webhook n8n) | Token statique partagé (header Authorization) | IP whitelist serveur n8n recommandée en production |
| Serveur Express (IA) | Token partagé miroir/Express (header X-Mirror-Token) | Sans ce token, l'endpoint rejette la requête — empêche les appels tiers |
| WebDB | Accès interne serveur uniquement | Jamais exposé sur le réseau public — port lié à 127.0.0.1 |
| n8n | Accès interne serveur uniquement | Interface admin protégée par mot de passe, non exposée publiquement |

## **2.4 CORS et rate limiting**

| Point | Configuration |
| :---- | :---- |
| CORS | API Laravel configurée pour n'accepter les requêtes que depuis l'origine du CRM (domaine production) et localhost en développement. Le miroir Electron est exempt (pas de navigateur). |
| Rate limiting | Endpoint IA (Express) : 10 requêtes/minute par IP. Endpoint upload photo (Laravel) : 30 requêtes/minute par device. Endpoints CRM : 200 requêtes/minute par utilisateur. Implémenté via middleware Laravel \+ express-rate-limit. |

# **3\. Justification des choix technologiques**

Ce chapitre documente les alternatives évaluées pour chaque choix technique majeur. L'objectif n'est pas de rouvrir les débats, mais de montrer que chaque décision a été prise en connaissance de cause.

## **3.1 Laravel (PHP) vs Node.js full-stack**

| Critère | Laravel 13 (PHP 8.4) [CIBLE ROADMAP] | Node.js full-stack (Express ou Fastify) |
| :---- | :---- | :---- |
| Maîtrise équipe | Connue — le dev a une expérience Laravel documentée | Express utilisé pour le serveur IA mais pas en full-stack |
| Maturité ORM | Eloquent — mature, migrations versionnées, relations robustes | Drizzle / Prisma — plus récents, moins battle-tested |
| Authentification | Laravel Sanctum — intégré, tokens, sessions, multidevice | Passport.js ou custom — à configurer manuellement |
| Job scheduling | Laravel Horizon / Task Scheduling natif | Bull, Agenda — librairies tierces |
| Cohérence stack | PHP \+ Node coexistent (Express pour IA) | Unification possible mais nécessite de refaire l'API |
| Verdict | ✅ Retenu | ❌ Écarté — gain marginal, coût de migration élevé |

ℹ  Le choix de maintenir Express séparé pour l'IA (et non unifier sur Node) est justifié section 8.1 : isolation de charge des appels asynchrones longue durée. Ce n'est pas une incohérence — c'est une décision d'architecture délibérée.

## **3.2 Electron vs Chromium kiosk**

| Critère | Electron (retenu) | Chromium kiosk (sans Electron) |
| :---- | :---- | :---- |
| Consommation RAM | \~300–500 Mo de plus (embarque son propre Chromium \+ Node.js) | Plus léger — un seul processus Chromium |
| Accès système (microscope, WiFi, config) | Native via Node.js (modules udev, nmcli, electron-store) | Nécessite un daemon externe ou bridge custom pour l'accès hardware |
| Communication main/renderer | IPC Electron bien documenté et typé (contextBridge) | Pas d'IPC natif — architecture à concevoir from scratch |
| OTA updates | electron-updater — intégré, signé, rollback natif | Script shell custom — moins fiable, pas de rollback auto |
| Kiosk mode | \--kiosk flag natif, window management | \--kiosk flag Chromium \+ gestionnaire de session |
| Complexité de développement | Stack React connue par l'équipe | Même stack React mais sans les APIs Electron |
| Budget RAM Pi 5 | Objectif \< 6 Go — contrainte tendue. À valider en PO-01. | \~300–500 Mo économisés — marge plus confortable |
| Verdict | ✅ Retenu (sous réserve PO-01) | ⚠️ Alternative viable si Pi 5 \< 6 Go RAM non respecté |

⚠  Point critique soulevé par le reviewer : sur Pi 5 avec budget RAM \< 6 Go, Electron est ambitieux. Le benchmark PO-01 (Sprint 1\) est non-négociable. Si le budget RAM est dépassé en conditions réelles, la bascule vers Chromium kiosk doit être évaluée — l'économie de 300–500 Mo peut être décisive.

## **3.3 NocoDB vs WebDB**

Les deux outils sont des interfaces visuelles no-code sur PostgreSQL. La comparaison est pertinente pour choisir lequel confier au no-codeur.

| Critère | NocoDB | WebDB (retenu) |
| :---- | :---- | :---- |
| Interface | Spreadsheet-like avec vues multiples (grille, galerie, kanban) | Interface SQL \+ éditeur visuel de tables — plus proche de la DB réelle |
| Modification de schéma | Via interface graphique — peut modifier les tables directement | Éditeur de schéma visuel avec prévisualisation des changements |
| Visualisation des relations | Vue basique des clés étrangères | Diagramme ERD intégré — voir toutes les relations entre tables d'un coup |
| Requêtes SQL | Possible mais limité | Éditeur SQL complet intégré — utile pour debug et vérifications |
| Légèreté | Application avec backend propre — consomme plus de ressources serveur | Outil de visualisation léger — moins d'overhead sur le serveur |
| Coût | Gratuit (self-hosted) | Gratuit (open-source) |
| Adapté no-codeur | Oui — interface intuitive | Oui — plus transparent sur ce qu'on fait réellement à la DB |
| Verdict | ⚠️ Écarté — overhead serveur pour usage purement visuel | ✅ Retenu — léger, ERD intégré, SQL pour le debug |

ℹ  WebDB est retenu pour la visualisation et l'exploration par le no-codeur. Il ne remplace pas les migrations Laravel en production — il sert à voir et comprendre la structure de la DB.

## **3.4 n8n vs Laravel queues (Horizon) / tâches planifiées**

| Critère | n8n (retenu) | Laravel Horizon \+ Task Scheduling |
| :---- | :---- | :---- |
| Profil utilisateur | No-codeur construit et modifie les workflows visuellement | Dev PHP — code PHP pour chaque job |
| Génération PDF | Nœuds prêts à l'emploi (HTML to PDF, templates) | Librairie PHP (Dompdf, mPDF) — à coder et maintenir |
| Envoi email | Nœud SMTP natif, configuration graphique | Laravel Mailables — code PHP |
| Cron / webhooks | Interface graphique, modification sans déploiement | php artisan schedule — nécessite un déploiement pour modifier |
| Coût | Gratuit (self-hosted) | Inclus dans Laravel — gratuit |
| Complexité infra | Service Docker supplémentaire à maintenir | Intégré à Laravel — pas de service en plus |
| Verdict | ✅ Retenu — séparation dev/no-codeur est le critère décisif | ❌ Écarté — rend le no-codeur dépendant du dev pour chaque modification de workflow |

## **3.5 PostgreSQL vs MySQL / SQLite**

| Critère | PostgreSQL 15 (retenu) | MySQL 8 | SQLite |
| :---- | :---- | :---- | :---- |
| JSONB (diagnostic IA) | Natif — indexable, requêtable | JSON supporté mais moins performant | JSON stocké en texte brut |
| RLS (isolation boutiques) | Natif — Row Level Security intégré | Pas de RLS natif | Pas de RLS |
| Types avancés (UUID, arrays) | Natif | UUID via plugin, arrays limités | Types basiques uniquement |
| Scalabilité | Excellente — conçu pour la haute charge | Très bonne | Limité à une machine, pas de concurrence élevée |
| Conformité ACID | Complète | Complète (InnoDB) | Complète mais monofichier |
| Verdict | ✅ Retenu | ❌ Écarté — RLS et JSONB sont des critères bloquants | ❌ Écarté — inadapté à une architecture multi-services |

## **3.6 Hébergement — Scaleway vs Hetzner**

Les deux sont des VPS EU populaires et comparables techniquement. Le différenciant principal est la position RGPD.

| Critère | Scaleway (retenu) | Hetzner |
| :---- | :---- | :---- |
| Siège social | France (Paris) — soumis au droit français et européen | Allemagne (Nuremberg) — soumis au droit allemand et européen |
| Localisation des datacenters | Paris, Amsterdam — exclusivement en France/UE | Nuremberg, Falkenstein, Helsinki — UE, mais aussi hors UE possible selon la config |
| RGPD — DPA | DPA disponible, signable en ligne, conforme art. 28 RGPD, rédigé en français | DPA disponible, mais documentation RGPD moins détaillée et principalement en allemand |
| Certifications | ISO 27001, SOC 2 Type II, HDS (Healthcare Data en option), SecNumCloud (en cours) | ISO 27001 — certifications moins étendues |
| Transparence RGPD | Page dédiée RGPD claire, sous-traitants listés publiquement, DPA auto-signable | Moins de documentation publique sur les sous-traitants et les flux de données |
| Option HDS certifiée | Oui — Scaleway HDS disponible si qualification données de santé (PO-05) | Non — pas d'offre HDS certifiée |
| Tarif (4 vCPU / 8 Go / 100 Go) | \~30–35 EUR/mois (DEV1-XL ou GP1-XS) | \~20–25 EUR/mois (CX31) |
| Support français | Oui — support en français | Non — support en anglais/allemand |
| Verdict | ✅ Retenu — position RGPD supérieure, option HDS disponible si besoin | ❌ Écarté — moins transparent sur les flux RGPD, pas d'option HDS |

ℹ  Le surcoût Scaleway (\~10 EUR/mois) est justifié par la conformité RGPD renforcée, la documentation en français, et surtout la disponibilité de l'option HDS si PO-05 devait être requalifié en données de santé. C'est une assurance architecturale.

# **4\. Qui fait quoi**

## **4.1 Le no-codeur**

Il structure la base de données via WebDB (interface visuelle sur PostgreSQL) et construit les workflows n8n. Il travaille en collaboration étroite avec le dev : tout changement de schéma est validé en amont.

| \[ NO-CODEUR \]  Créer toutes les tables PostgreSQL via WebDB : boutiques, clientes, consentements, seances, photos, produits, medias, miroirs, config\_miroir, boutique\_users |
| :---- |
|             Définir colonnes, types, contraintes (unicité, clés étrangères, NOT NULL) et index de performance |
|             Créer les dossiers de stockage sur le serveur : /storage/photos et /storage/rapports (avec permissions restreintes) |
|             n8n — Workflow 1 : webhook fin de séance → générer PDF → générer QR code → appeler l'API Laravel pour mettre à jour la séance |
|             n8n — Workflow 2 : cron horaire → via API Laravel, lister les séances non scannées après 1h → envoyer PDF par email → mettre à jour email\_envoye via API |
|             n8n — Workflow 3 : cron quotidien → via API Laravel, lister les fichiers à purger → supprimer → mettre à jour la DB via API |
|             Maintenir un fichier schema-changelog.md dans le repo Git : chaque modification de table (date, description, colonnes touchées, statut) |
|             Valider TOUT changement de schéma avec le dev AVANT application, même en développement |

⚠  En production, le schéma PostgreSQL ne peut être modifié que via une migration Laravel versionnée. WebDB sert à explorer et visualiser — pas à modifier le schéma de prod.

## **4.2 Le développeur**

Il construit l'API Laravel, le CRM React, le serveur Express IA et l'application miroir Electron. Il traduit le schéma WebDB en migrations Laravel pour la production.

| \[ DÉVS \]  API Laravel : tous les endpoints miroir et CRM, authentification (Sanctum), filtrage par boutique, validation des entrées |
| :---- |
|             API Laravel : endpoint fin de séance déclenchant le webhook n8n |
|             API Laravel : endpoint de vérification scan QR (appelé par n8n) |
|             API Laravel : rate limiting, configuration CORS, chiffrement des tokens Shopify (encrypt()) |
|             Migrations Laravel : traduire le schéma WebDB en fichiers de migration versionnés pour la production |
|             Serveur Express (Node.js) : endpoint d'analyse IA avec authentification token partagé \+ rate limiting |
|             CRM React : toutes les pages (dashboard KPIs, clientes, séances, miroirs, médias, produits, config, équipe) |
|             CRM React : graphiques évolution diagnostics via Recharts ou Chart.js |
|             CRM React : éditeur config miroir (couleurs, typo, style) avec prévisualisation |
|             Application miroir Electron \+ React : 8 écrans, flux microscope, clavier virtuel (Onboard ou Squeekboard), sync photos offline |
|             Application miroir : polling config toutes les 30 min, synchronisation cache médias par checksum |

## **4.3 Les graphistes**

Ils fournissent tous les assets visuels et les maquettes que le dev intègre.

| \[ GRAPHISTE \]  Charte graphique : palette, typographies disponibles sur Debian (seules celles installées sur le miroir sont utilisables), espacements |
| :---- |
|             Maquettes miroir (Figma) — 8 écrans : Accueil/veille, Recherche cliente, Nouveau client, Consentement, Séance, Comparaison, QR Code, Provisioning |
|             Maquettes miroir : prévoir les zones dynamiques (couleurs et typo viennent de config\_miroir — variables, pas codées en dur) |
|             Maquettes CRM : Dashboard (KPIs \+ graphiques), fiche cliente (avec graphique évolution), config miroir (éditeur avec prévisualisation), médiathèque, paramètres équipe |
|             Template rapport PDF : A4 portrait, zones pour logo, photos avant/après, diagnostic, recommandations, pied de page |
|             Assets exportés : logo K Beauty SVG, icônes miroir, illustrations fond animé |
|             Médias promotionnels de démo pour les tests (formats : MP4 H.264 / JPG-PNG, résolution 1920×1080 minimum) |

ℹ  Zones tactiles miroir : minimum 48×48 px, lisibles à 50 cm, opérables d'une seule main. Prévoir clavier virtuel sur les écrans Recherche et Nouveau client.

## **4.4 L'équipe marketing**

| \[ MARKETING \]  Texte du consentement RGPD — doit être validé par un juriste AVANT intégration |
| :---- |
|             Catalogue produits Shopify : noms, descriptions, tags (les tags alimentent directement les recommandations IA) |
|             Libellés des catégories d'analyse affichés à la cliente (voir section 7.2 — validation requise) |
|             Validation du ton des commentaires IA : professionnel, bienveillant, cosmétique — jamais médical |
|             Contenus promotionnels pour le miroir en veille : vidéos MP4 H.264 et images JPG/PNG |
|             Textes fixes du rapport PDF : introduction, objet de l'email fallback, pied de page, mentions légales |

# **5\. Gestion du schéma de base de données**

WebDB permet au no-codeur de visualiser et manipuler PostgreSQL sans écrire de SQL. Mais en production, toute modification de schéma doit être versionnée pour éviter les régressions.

## **5.1 Environnements et droits**

| Environnement | WebDB | Migrations Laravel | Qui peut modifier le schéma |
| :---- | :---- | :---- | :---- |
| Développement | Exploration et prototypage libres | Générées depuis le schéma validé | No-codeur \+ dev, après validation mutuelle |
| Staging | Lecture seule — visualisation uniquement | Appliquées via artisan migrate | Dev uniquement |
| Production | Lecture seule — visualisation uniquement | Appliquées via artisan migrate (pipeline CI) | Dev uniquement, après validation |

## **5.2 Processus de modification de schéma**

* Le no-codeur documente la modification dans schema-changelog.md (colonne, type, raison, impact applicatif)

* Le dev valide : impact sur les modèles Eloquent, les endpoints API, le CRM

* En développement : le no-codeur applique dans WebDB, le dev génère la migration Laravel correspondante

* En staging/production : uniquement via php artisan migrate — jamais via WebDB

* Si régression : php artisan migrate:rollback restaure le schéma précédent

ℹ  Un renommage de colonne sans migration Laravel casse l'API immédiatement. Ce process protège contre ce risque.

# **6\. Base de données**

Toutes les tables sont créées par le no-codeur dans WebDB (interface visuelle sur PostgreSQL). Le dev les consomme via les modèles Eloquent de Laravel. Chaque table contient un champ boutique\_id.

ℹ  Dans le code Laravel, boutique\_id correspond au concept de 'tenant'. Dans l'interface et les documents fonctionnels, on dit toujours 'boutique'.

## **6.1 Isolation des données entre boutiques**

L'isolation repose sur deux niveaux complémentaires :

* Filtrage applicatif Laravel (obligatoire) : chaque requête ajoute automatiquement WHERE boutique\_id \= ? via un Global Scope Eloquent appliqué à tous les modèles concernés

* RLS PostgreSQL (recommandé sur les tables sensibles) : contrainte au niveau base de données — même un SQL brut oublié dans un export est filtré automatiquement

| Table | RLS recommandé | Justification |
| :---- | :---- | :---- |
| clientes | Oui — prioritaire | Données personnelles — une fuite entre boutiques est une violation RGPD |
| consentements | Oui — prioritaire | Preuve légale — ne doit jamais être accessible à une autre boutique |
| seances | Oui | Données de séance liées à une cliente |
| photos | Oui — prioritaire | Photos capillaires — données sensibles potentielles |
| produits | Optionnel | Catalogue commercial — risque faible |
| medias | Optionnel | Médias promo — risque faible |
| miroirs | Oui | Un gérant ne doit pas voir les miroirs d'une autre boutique |

ℹ  Exemple RLS sur clientes : CREATE POLICY boutique\_isolation ON clientes USING (boutique\_id \= current\_setting('app.boutique\_id')::uuid). Laravel injecte SET LOCAL app.boutique\_id \= ? avant chaque requête via un middleware dédié.

## **6.2 boutiques**

| boutiques |  |  |  |
| :---- | :---- | :---- | :---- |
| **Colonne** | **Type** | **Requis** | **Description** |
| **id** | uuid | Oui | Identifiant unique, généré automatiquement |
| **nom** | text | Oui | Ex : 'K Beauty Nice' |
| **email\_contact** | text | Non | Email boutique (utilisé par n8n pour les envois d'urgence) |
| **shopify\_domain** | text | Non | Ex : 'kbeauty-nice.myshopify.com' |
| **shopify\_access\_token** | text | Non | Clé Shopify — chiffrée avec Laravel encrypt() avant stockage |
| **created\_at** | timestamp | Auto |  |

| \[ NO-CODEUR \]  Créer les 3 lignes au déploiement initial : K Beauty Nice, K Beauty Lyon, K Beauty Cannes |
| :---- |

## **6.3 clientes**

| clientes |  |  |  |
| :---- | :---- | :---- | :---- |
| **Colonne** | **Type** | **Requis** | **Description** |
| **id** | uuid | Oui |  |
| **boutique\_id** | uuid | Oui | Clé étrangère → boutiques. Indexé. |
| **prenom** | text | Oui |  |
| **nom** | text | Oui |  |
| **email** | text | Non | Unique par boutique (contrainte composite email \+ boutique\_id) |
| **telephone** | text | Non |  |
| **age** | integer | Non |  |
| **sexe** | text | Non | 'F' / 'M' / 'autre' |
| **note\_praticien** | text | Non | Note interne — JAMAIS transmise dans le rapport PDF |
| **shopify\_customer\_id** | text | Non | ID Shopify si exportée |
| **created\_at** | timestamp | Auto |  |
| **updated\_at** | timestamp | Auto |  |

## **6.4 consentements**

Preuve légale RGPD. Créé avant toute capture. L'API refuse toute séance sans consentement\_id valide.

| consentements |  |  |  |
| :---- | :---- | :---- | :---- |
| **Colonne** | **Type** | **Requis** | **Description** |
| **id** | uuid | Oui |  |
| **boutique\_id** | uuid | Oui |  |
| **cliente\_id** | uuid | Oui | Clé étrangère → clientes |
| **texte\_consent** | text | Oui | Texte EXACT affiché sur le miroir — preuve légale complète, pas une référence de version |
| **date\_consentement** | timestamp | Oui | Horodatage UTC précis \+ timezone |
| **date\_revocation** | timestamp | Non | Null si toujours valide |

⚠  Le texte intégral du consentement est fourni par le marketing et doit être validé par un juriste avant intégration.

## **6.5 seances**

| seances |  |  |  |
| :---- | :---- | :---- | :---- |
| **Colonne** | **Type** | **Requis** | **Description** |
| **id** | uuid | Oui |  |
| **boutique\_id** | uuid | Oui |  |
| **miroir\_id** | uuid | Oui | Clé étrangère → miroirs |
| **cliente\_id** | uuid | Oui | Clé étrangère → clientes |
| **consentement\_id** | uuid | Oui | Obligatoire — l'API valide son existence avant création |
| **date\_debut** | timestamp | Oui | Démarrage automatique |
| **date\_fin** | timestamp | Non | Null si séance en cours |
| **note\_seance** | text | Non | Note du praticien sur cette séance uniquement |
| **rapport\_pdf\_path** | text | Non | Chemin fichier PDF sur le serveur — rempli par n8n via API |
| **rapport\_url** | text | Non | URL publique du rapport — remplie par n8n via API |
| **qr\_scanne\_at** | timestamp | Non | Null si jamais scanné — mis à jour par l'endpoint GET /rapports/{id}/scan |
| **email\_envoye** | boolean | Non | True si email fallback envoyé (défaut: false) — mis à jour par n8n via API |

ℹ  Les champs rapport\_pdf\_path, rapport\_url, qr\_scanne\_at et email\_envoye sont tous mis à jour par n8n via l'API Laravel — jamais directement par le miroir.

## **6.6 photos**

Captures microscopiques \+ diagnostic IA. Stockées localement sur le miroir ET sur le serveur.

| photos |  |  |  |
| :---- | :---- | :---- | :---- |
| **Colonne** | **Type** | **Requis** | **Description** |
| **id** | uuid | Oui |  |
| **seance\_id** | uuid | Oui | Clé étrangère → seances (suppression en cascade) |
| **boutique\_id** | uuid | Oui |  |
| **chemin\_local** | text | Oui | Chemin miroir : /var/smart-mirror/photos/{id}.jpg |
| **chemin\_serveur** | text | Non | Chemin serveur : /storage/photos/{boutique\_id}/{id}.jpg — rempli après sync |
| **phase** | text | Oui | 'avant' ou 'apres' |
| **diagnostic\_ia** | jsonb | Non | Résultat complet : catégories, scores, commentaire, produits recommandés |
| **modele\_ia** | text | Non | Ex : 'google/gemini-flash-1.5' — pour le monitoring |
| **latence\_ms** | integer | Non | Durée appel IA en ms |
| **synced** | boolean | Non | True si uploadée sur le serveur (défaut: false) — mise à jour par l'API |
| **supprime\_local\_at** | timestamp | Non | Date de suppression du fichier local sur le miroir (rétention locale) |
| **created\_at** | timestamp | Auto |  |

ℹ  Le champ synced permet au miroir de tenir une file d'upload en attente en mode offline. Les photos locales sur le miroir sont supprimées après sync réussie \+ délai configurable (défaut : 30 jours).

## **6.7 produits**

| produits |  |  |  |
| :---- | :---- | :---- | :---- |
| **Colonne** | **Type** | **Requis** | **Description** |
| **id** | uuid | Oui |  |
| **boutique\_id** | uuid | Oui |  |
| **shopify\_id** | text | Non | ID Shopify — unique par boutique |
| **nom** | text | Oui | Nom exact — tel que cité dans le rapport PDF |
| **description** | text | Non | Sans HTML |
| **tags** | text\[\] | Non | Ex: \['cuir-sec','hydratation','sans-sulfate'\] — crucial pour le matching IA |
| **prix** | real | Non |  |
| **url\_produit** | text | Non | Lien page Shopify |
| **image\_url** | text | Non |  |
| **mis\_en\_avant** | boolean | Non | Prioritaire dans l'affichage miroir (défaut: false) |
| **actif** | boolean | Non | Masqué si false (défaut: true) |

| \[ MARKETING \]  Tags Shopify importés directement. Des tags bien choisis \= meilleures recommandations IA. |
| :---- |
|             Exemples : 'cuir-chevelu-sec', 'antipelliculaire', 'hydratant', 'sans-sulfate', 'soin-kératine' |

## **6.8 medias**

| medias |  |  |  |
| :---- | :---- | :---- | :---- |
| **Colonne** | **Type** | **Requis** | **Description** |
| **id** | uuid | Oui |  |
| **boutique\_id** | uuid | Oui |  |
| **type** | text | Oui | 'video' ou 'image' |
| **chemin\_fichier** | text | Oui | Chemin serveur : /storage/medias/{boutique\_id}/{id}.ext |
| **nom\_affichage** | text | Non | Nom lisible dans la médiathèque CRM |
| **checksum** | text | Oui | SHA-256 — pour synchroniser le cache du miroir |
| **ordre\_affichage** | integer | Non | Ordre dans la playlist |
| **actif** | boolean | Non | Activé/désactivé depuis le CRM (défaut: true) |
| **created\_at** | timestamp | Auto |  |

| \[ GRAPHISTE \]  Formats vidéo : MP4 (H.264), WebM (VP9) — max 500 Mo |
| :---- |
|             Formats image : JPG, PNG, WebP — max 10 Mo |
|             Résolution recommandée : 1920×1080 px minimum |

## **6.9 miroirs**

| miroirs |  |  |  |
| :---- | :---- | :---- | :---- |
| **Colonne** | **Type** | **Requis** | **Description** |
| **id** | uuid | Oui |  |
| **boutique\_id** | uuid | Oui |  |
| **nom** | text | Non | Ex : 'Miroir Nice 1' |
| **adresse\_mac** | text | Oui | Identifiant physique unique |
| **token\_device** | text | Oui | JWT généré au provisioning — stocké chiffré sur le miroir |
| **en\_ligne** | boolean | Auto | Mis à jour toutes les 30 secondes via heartbeat API |
| **derniere\_activite** | timestamp | Auto |  |
| **version\_app** | text | Non | Version Electron installée |
| **config\_id** | uuid | Non | Clé étrangère → config\_miroir |

## **6.10 config\_miroir**

Configuration d'affichage modifiable depuis le CRM. Le miroir vérifie updated\_at à chaque poll (toutes les 30 min) et recharge si nécessaire.

| config\_miroir |  |  |  |
| :---- | :---- | :---- | :---- |
| **Colonne** | **Type** | **Requis** | **Description** |
| **id** | uuid | Oui |  |
| **boutique\_id** | uuid | Oui |  |
| **miroir\_id** | uuid | Non | Null \= config par défaut de la boutique |
| **couleur\_primaire** | text | Non | Ex : '\#C2185B' |
| **couleur\_fond** | text | Non | Couleur de fond des écrans |
| **typographie** | text | Non | Police — doit être installée sur Debian |
| **fond\_anime** | boolean | Non | (défaut: true) |
| **theme\_fond\_anime** | text | Non | 'particles' / 'waves' / 'aurora' |
| **logo\_url** | text | Non | Chemin du logo boutique sur le serveur |
| **volume** | integer | Non | 0–100 (défaut: 50\) |
| **updated\_at** | timestamp | Auto | Mis à jour automatiquement — le miroir le compare à sa version locale |

## **6.11 boutique\_users**

Gestion des accès collaborateurs (lecture seule sans droits d'export ni suppression).

| boutique\_users |  |  |  |
| :---- | :---- | :---- | :---- |
| **Colonne** | **Type** | **Requis** | **Description** |
| **id** | uuid | Oui |  |
| **boutique\_id** | uuid | Oui |  |
| **user\_id** | uuid | Oui | Clé étrangère → table users de Laravel Auth |
| **role** | text | Oui | 'gerant' (accès complet) / 'collaborateur' (lecture seule, pas d'export/suppression) |
| **created\_at** | timestamp | Auto |  |

## **6.12 Rétention des données (RGPD)**

| Données | Conservation | Suppression |
| :---- | :---- | :---- |
| Photos serveur | 365 jours (configurable par boutique) | Cron n8n via API Laravel |
| Photos locales miroir | 30 jours après sync réussie (configurable) | Processus local sur le miroir |
| Rapports PDF | Idem photos serveur | Cron n8n via API Laravel |
| Lien QR code | 30 jours (configurable) | URL expirée \= accès refusé |
| Fiche cliente | Jusqu'à demande RGPD | Manuelle, via API Laravel |
| Note praticien | Idem fiche cliente | Supprimée avec la fiche |
| Consentement | Indéfini — preuve légale | Jamais supprimé automatiquement |
| Logs système | 90 jours | Rotation automatique (logrotate) |

# **7\. API Laravel**

Laravel est l'unique point d'entrée vers PostgreSQL pour le miroir, le CRM et n8n.

## **7.1 Endpoints miroir**

| Endpoint | Méthode | Ce que ça fait |
| :---- | :---- | :---- |
| POST /api/miroir/auth | POST | Authentification du miroir (token device → JWT 24h avec refresh) |
| GET /api/clientes?search= | GET | Chercher une cliente par nom, email ou téléphone |
| POST /api/clientes | POST | Créer une nouvelle fiche cliente |
| POST /api/consentements | POST | Enregistrer le consentement RGPD signé |
| POST /api/seances | POST | Créer une séance (vérifie l'existence du consentement\_id) |
| PATCH /api/seances/{id} | PATCH | Mettre à jour la séance en cours |
| POST /api/seances/{id}/fin | POST | Signaler la fin de séance → déclenche webhook n8n |
| POST /api/photos | POST | Uploader une photo (fichier \+ métadonnées) \+ stocker diagnostic IA |
| GET /api/miroirs/{id}/config | GET | Config d'affichage (couleurs, typo, logo, playlist avec checksums) |
| GET /api/produits | GET | Produits actifs de la boutique |
| GET /api/rapports/{seance\_id}/scan | GET | Marquer le QR comme scanné (appelé aussi par n8n pour vérification) |

## **7.2 Endpoints CRM**

| Ressource | Endpoints | Rôles |
| :---- | :---- | :---- |
| Auth | POST /login, POST /logout, GET /me | Public (login), authentifié (reste) |
| Boutiques | CRUD /boutiques | super-admin uniquement |
| Clientes | GET/POST/PATCH/DELETE /clientes, GET /clientes/{id}/seances | gerant, collaborateur (lecture) |
| Séances | GET /seances, GET /seances/{id} | gerant, collaborateur |
| Miroirs | CRUD /miroirs, PATCH /miroirs/{id}/config | gerant |
| Médias | CRUD /medias, PATCH /medias/reorder | gerant |
| Produits | CRUD /produits, POST /produits/sync-shopify | gerant |
| Utilisateurs | CRUD /boutique-users | gerant |
| Export | POST /export/shopify, GET /export/csv | gerant |

## **7.3 Endpoints n8n**

| Endpoint | Usage n8n |
| :---- | :---- |
| POST /api/n8n/seances/{id}/rapport | n8n met à jour rapport\_pdf\_path et rapport\_url après génération |
| GET /api/n8n/seances/non-scannees | n8n récupère les séances non scannées après 1h pour l'email fallback |
| PATCH /api/n8n/seances/{id}/email-envoye | n8n marque email\_envoye \= true après envoi |
| GET /api/n8n/photos/a-supprimer | n8n récupère les fichiers dont la rétention est expirée |
| DELETE /api/n8n/photos/{id}/serveur | n8n confirme la suppression du fichier côté DB |

ℹ  Les endpoints n8n sont authentifiés par token statique (header Authorization: Bearer {N8N\_TOKEN}) et en production, limités à l'IP du serveur n8n.

# **8\. Serveur IA (Express Node.js)**

## **8.1 Justification du service séparé**

L'appel IA peut prendre jusqu'à 5 secondes et bloquer un worker PHP. Laravel étant synchrone par nature, un pic de séances simultanées (ex : journée portes ouvertes) pourrait saturer le pool de workers. Express Node.js gère nativement les I/O asynchrones et supporte mieux ce type de charge.

⚠  L'endpoint Express doit être authentifié. Sans token, n'importe quel tiers pourrait envoyer des photos et générer des coûts OpenRouter. Le miroir inclut le header X-Mirror-Token à chaque appel. Express rejette toute requête sans ce token.

## **8.2 Paramètres IA**

| Paramètre | Valeur |
| :---- | :---- |
| Modèle par défaut | Google Gemini Flash 1.5 (via OpenRouter) |
| Modèle fallback 1 | OpenAI GPT-4o mini (si Gemini indisponible) |
| Modèle fallback 2 | Anthropic Claude 3.5 Haiku (si GPT-4o mini indisponible) |
| Timeout | 30 secondes par appel |
| Retries | 2 tentatives automatiques avant erreur |
| Objectif latence totale | Photo capturée → résultat affiché sur miroir \< 5 secondes |
| Température | 0.2 (résultats stables et reproductibles) |
| Max produits recommandés | 3 (depuis le catalogue de la boutique uniquement) |

## **8.3 Positionnement cosmétique — règle absolue**

**🔴  Le système produit des constats cosmétiques observationnels. Il n'est PAS médecin. Il ne pose aucun constat médical. Les mots 'diagnostic', 'pathologie', 'maladie', 'traitement', 'inflammation', 'alopécie' sont INTERDITS dans toutes les sorties IA — prompts, commentaires, libellés.**

Ce positionnement cosmétique, maintenu rigoureusement, évite la requalification des données en données de santé par la CNIL (requalification 'par destination'). La section 8 développe ce point.

## **8.4 Catégories d'analyse**

L'IA identifie une ou plusieurs catégories parmi les 8 suivantes. Les identifiants techniques et libellés ont été corrigés pour éliminer tout terme médical.

| Identifiant technique | Libellé affiché (à valider marketing) | Description cosmétique |
| :---- | :---- | :---- |
| cuir\_chevelu\_sec | Cuir chevelu déshydraté | Manque d'hydratation, desquamation légère, surface terne |
| cuir\_chevelu\_gras | Excès de sébum | Aspect brillant/huileux, teinte jaunâtre |
| pellicules\_seches | Pellicules sèches | Petites squames blanches, fond sec, sans rougeur |
| pellicules\_grasses | Pellicules grasses | Squames jaunâtres, fond gras, possible irritation légère |
| sensibilite\_rougeurs | Sensibilité et rougeurs | Rougeurs visibles, réactivité cutanée — terme cosmétique, pas médical |
| densite\_faible | Densité capillaire faible | Cuir chevelu visible, espacement entre follicules |
| affinement\_capillaire | Affinement capillaire progressif | Cheveux visuellement plus fins — constat cosmétique uniquement, pas de renvoi médical |
| cuir\_chevelu\_sain | Cuir chevelu équilibré | Hydratation et densité normales, aucune anomalie visible |

⚠  Les deux catégories 'inflammation\_rougeurs' et 'alopecie\_debutante' de la v3 ont été renommées. 'inflammation' et 'alopécie' sont des termes médicaux (CIM-10). Tout renvoi vers un dermatologue a été supprimé — c'est un acte médical qui contredit le positionnement cosmétique.

| \[ MARKETING \]  Valider et ajuster les libellés affichés avant le lancement |
| :---- |
|             Ces libellés apparaissent sur le miroir ET dans le rapport PDF — doivent être compréhensibles par la cliente et rester dans le registre cosmétique/bien-être |

## **8.5 Gestion de la confiance**

| Score | Comportement |
| :---- | :---- |
| ≥ 80% | Résultat affiché normalement |
| 60 – 79% | Résultat affiché avec mention 'À confirmer par la praticienne' |
| \< 60% | 'Analyse non concluante' — aucun résultat, raison indiquée (photo floue, éclairage insuffisant…) |

ℹ  Le serveur Express force 'non concluant' si le score est \< 60%, même si le modèle retourne le contraire.

# **9\. Automatisations n8n**

n8n est l'outil de workflow du no-codeur. Il ne touche JAMAIS directement à PostgreSQL — il passe exclusivement par l'API Laravel.

## **9.1 Workflow 1 — Génération PDF \+ QR code**

| Étape | Action |
| :---- | :---- |
| Déclencheur | Webhook POST depuis Laravel (POST /api/seances/{id}/fin) |
| 1 | Appeler l'API Laravel pour récupérer les données complètes de la séance (cliente, photos, diagnostics, produits) |
| 2 | Générer le rapport PDF à partir du template graphiste |
| 3 | Sauvegarder le PDF : /storage/rapports/{boutique\_id}/{seance\_id}.pdf sur le serveur |
| 4 | Générer un QR code pointant vers l'URL du rapport (token signé, expire après 30 jours) |
| 5 | Appeler PATCH /api/n8n/seances/{id}/rapport pour mettre à jour rapport\_pdf\_path et rapport\_url |
| 6 | Retourner le QR code au miroir pour affichage grand format |

## **9.2 Workflow 2 — Fallback email si QR non scanné**

| Étape | Action |
| :---- | :---- |
| Déclencheur | Cron toutes les heures |
| 1 | Appeler GET /api/n8n/seances/non-scannees — liste les séances avec date\_fin \> 1h, email\_envoye \= false, qr\_scanne\_at IS NULL, et cliente.email présent |
| 2 | Pour chaque séance : récupérer le PDF depuis /storage/rapports/ |
| 3 | Envoyer un email à la cliente avec le PDF en pièce jointe et le lien vers le rapport |
| 4 | Appeler PATCH /api/n8n/seances/{id}/email-envoye → email\_envoye \= true |

ℹ  L'email n'est envoyé que si la cliente a fourni son email ET que le QR n'a pas été scanné. Si le QR est scanné avant le cron, email\_envoye reste false et l'email n'est pas envoyé.

## **9.3 Workflow 3 — Nettoyage RGPD**

| Étape | Action |
| :---- | :---- |
| Déclencheur | Cron quotidien (ex : 3h du matin) |
| 1 | Appeler GET /api/n8n/photos/a-supprimer — liste les fichiers dont la rétention est expirée |
| 2 | Supprimer les fichiers physiques sur le serveur (/storage/photos/ et /storage/rapports/) |
| 3 | Pour chaque fichier supprimé : appeler DELETE /api/n8n/photos/{id}/serveur pour mettre à jour chemin\_serveur \= null en DB |

| \[ NO-CODEUR \]  Implémenter les 3 workflows dans n8n |
| :---- |
|             Configurer les credentials : URL API Laravel, N8N\_TOKEN, chemin /storage/, SMTP email |
|             Tester le workflow 2 manuellement avant mise en production (cas : email présent/absent, QR scanné/non scanné) |

# **10\. Application miroir**

## **10.1 Architecture materielle (scenario 2 — compute deporte)**

Le miroir Shineworld integre un ecran tactile 32" avec Android embarque. L'Android est bypasse : l'ecran est utilise en mode moniteur HDMI, et le compute est assure par un Raspberry Pi 5 dans un boitier externe fixe au dos du cadre. Cette separation permet de maitriser l'OS, les mises a jour, et le hardware de maniere independante.

### Miroir (fourni par Shineworld — sur mesure)

| Élément | Spec demandee | Notes |
| :---- | :---- | :---- |
| Ecran | 32" IPS, 1920x1080, 400+ nits, tactile capacitif 10 points | Luminosite critique pour passage verre sans-tain |
| Verre | Sans-tain (25-35% transmission) | Cadre aluminium noir mat |
| Entree video | HDMI 2.0 Type A femelle | Pi envoie via micro-HDMI → adaptateur HDMI |
| Retour tactile | USB (protocole HID standard, pas de driver proprietaire) | Plug-and-play sur Debian 12 |
| Android embarque | Desactive ou non inclus | On bypasse — mode moniteur HDMI uniquement |
| Alimentation | Interne, cable secteur IEC C13/C7 | L'ecran s'alimente independamment du Pi |
| Passage cables | HDMI \+ USB sortie arriere ou partie basse du cadre | Pour connexion au boitier Pi |
| Fixation boitier | VESA 75x75 ou 100x100 au dos du cadre | Accueille le boitier Pi |
| Deploiement | 2 par boutique — 6 miroirs total (Nice, Lyon, Cannes) | |

### Boitier compute (externe — fixe au dos du miroir)

| Élément | Matériel | Notes |
| :---- | :---- | :---- |
| Ordinateur | Raspberry Pi 5 (8 Go RAM) | ARM64. Alternative Beelink SER5 a valider (PO-01) |
| Boitier | Imprime 3D PETG, profil slim, logo K Beauty | Fixation VESA au dos du miroir. Voir `device-setup/enclosure/` |
| Connexion ecran | Micro-HDMI (Pi) → adaptateur → HDMI 2.0 (miroir) | Cable court 30-50 cm |
| Connexion tactile | USB-A (Pi) ← USB (miroir) | Retour touch HID standard |
| Microscope | WiFi (Ninyoon 4K, \~45€) | Protocole TRANCHE et conforme au code : WiFi/TCP `192.168.34.1:8080`, handshake JHCMD, flux H.264 transcode par ffmpeg en MJPEG sur `localhost:9100` (`proxy.js`). Les references USB/UVC du depot sont des vestiges morts (PO-02 cloture). |
| Connectivite | WiFi interne Pi \+ dongle USB WiFi si microscope WiFi | WiFi interne \= internet boutique OU hotspot microscope |

## **10.2 Système et démarrage**

| \[ DÉVS \]  OS : Raspberry Pi OS Lite 64-bit (Debian 12, headless), X11 minimal \+ Openbox |
| :---- |
|             App Electron \+ React démarrée via systemd au boot, mode kiosk plein écran |
|             Objectif : \< 30 secondes entre mise sous tension et écran d'accueil |
|             Clavier virtuel : Onboard ou Squeekboard installé sur Debian — actif sur les écrans Recherche cliente et Nouveau client |
|             Crash recovery : redémarrage auto en 5 secondes. Rollback version précédente après 3 échecs consécutifs. |
|             SSH maintenance : port 2222, clé uniquement |

## **10.3 Les 8 écrans**

| Écran | Description | Contraintes |
| :---- | :---- | :---- |
| Accueil / veille | Logo boutique, fond animé, playlist médias en boucle | Bouton 'Nouvelle séance' très visible |
| Recherche cliente | Recherche par nom, email, téléphone | Clavier virtuel Onboard, résultats en temps réel |
| Nouveau client | Formulaire de création | Prénom, nom, email (opt), tél (opt), âge, sexe — clavier virtuel |
| Consentement RGPD | Texte légal \+ checkbox \+ Accepter | Impossible de bypasser — contrainte API |
| Séance | Flux microscope \+ bouton capture \+ résultats IA \+ produits | Zone capture très accessible, praticienne a les mains occupées |
| Comparaison | Photos avant/après côte à côte avec diagnostics | Swipe ou boutons |
| QR Code | QR code grand format vers rapport PDF | Min 200×200 px. Timer retour accueil automatique. |
| Provisioning | Config WiFi \+ ID boutique au premier démarrage | First boot uniquement |

| \[ GRAPHISTE \]  Maquettes des 8 écrans requises |
| :---- |
|             Zones cliquables minimum 48×48 px, lisibles à 50 cm, opérables d'une seule main |
|             Prévoir les zones de saisie texte avec clavier virtuel visible (écrans 2 et 3\) |
|             Couleurs et typographies viennent de config\_miroir — les maquettes doivent prévoir ces zones dynamiques |

## **10.4 Sync des photos (offline-first)**

| Étape | Comportement |
| :---- | :---- |
| Capture | Photo enregistrée immédiatement en local : /var/smart-mirror/photos/{id}.jpg |
| Envoi IA | Photo envoyée au serveur Express pour analyse (parallèle à l'upload) |
| Upload serveur | Photo uploadée vers POST /api/photos dès que le réseau le permet. synced \= true après confirmation. |
| Mode offline | Si pas de réseau : synced \= false, photo en file d'attente. Upload automatique à la reconnexion. |
| Rétention locale | Après sync réussie, la photo locale est supprimée après 30 jours (configurable). supprime\_local\_at est mis à jour. |

ℹ  La sync est critique (exigence de l'appel à projet : 'la synchronisation doit être fiable'). Le miroir maintient une file d'attente persistante des uploads en attente.

# **11\. CRM web (React)**

Interface réservée aux gérants et collaborateurs autorisés. Accessible depuis tout navigateur. Se connecte exclusivement à l'API Laravel.

| Page | Contenu | Rôle |
| :---- | :---- | :---- |
| Dashboard | KPIs (séances jour/mois), graphiques répartition diagnostics, alertes miroirs hors ligne | Gérant, collaborateur |
| Liste clientes | Recherche, filtres (boutique, date, diagnostic), export CSV | Gérant, collaborateur |
| Fiche cliente | Infos, note praticien (éditable), timeline séances, graphique évolution diagnostics | Gérant, collaborateur |
| Détail séance | Photos avant/après, diagnostic IA, produits recommandés, note, lien rapport PDF | Gérant, collaborateur |
| Miroirs | Statut (online/offline, microscope) mis à jour par polling toutes les 30s | Gérant |
| Config miroir | Éditeur couleurs/typo/fond animé/logo/volume avec prévisualisation — envoie PATCH /api/miroirs/{id}/config | Gérant |
| Médiathèque | Upload vidéos/images, playlist avec drag & drop pour réordonner | Gérant |
| Produits | Catalogue depuis Shopify, toggle mis-en-avant, sync manuelle | Gérant |
| Export Shopify | Envoi des fiches clientes (avec email) vers Shopify | Gérant |
| Paramètres équipe | Créer/modifier/supprimer accès collaborateurs | Gérant |
| Boutiques | Création et gestion boutiques | Super-admin uniquement |

| \[ GRAPHISTE \]  Maquettes : Dashboard (KPIs \+ graphiques), fiche cliente (historique graphique), config miroir (éditeur prévisualisation), médiathèque, paramètres équipe |
| :---- |
|             Le CRM est responsive tablette \+ desktop — le miroir est uniquement tactile |

# **12\. Rapport PDF**

Généré automatiquement par n8n à la fin de chaque séance. Template fourni par les graphistes, rempli programmatiquement.

| Section | Contenu | Source |
| :---- | :---- | :---- |
| En-tête | Logo boutique, nom boutique, date séance | config\_miroir.logo\_url \+ DB |
| Bloc cliente | Prénom uniquement (pas le nom complet pour la confidentialité) | DB clientes |
| Photos | Avant / après côte à côte | Fichiers /storage/photos/ |
| Observations | Catégories cosmétiques identifiées \+ scores \+ commentaire IA (2–4 phrases, ton bienveillant, vocabulaire cosmétique) | DB photos.diagnostic\_ia |
| Évolution | Graphique des diagnostics des séances précédentes (si historique disponible) | DB séances \+ photos |
| Recommandations | Produits conseillés avec nom, raison courte, lien Shopify | DB produits |
| Pied de page | Logo, URL boutique, mention RGPD, 'Powered by Smart Mirror' | Marketing |

| \[ GRAPHISTE \]  Fournir le template PDF : A4 portrait, zones pour chaque section ci-dessus |
| :---- |
|             Fond blanc, imprimable, lisible sur smartphone |
| **\[ MARKETING \]**  Rédiger les textes fixes : intro, objet de l'email fallback, pied de page, mentions légales |
|             Valider le ton des commentaires IA : cosmétique, bienveillant, jamais médical |

# **13\. Infrastructure et hébergement**

## **13.1 Serveur de production**

| Paramètre | Spécification |
| :---- | :---- |
| Provider | Scaleway (France) — VPS DEV1-XL ou GP1-XS. Retenu pour sa conformité RGPD supérieure, sa documentation en français et son option HDS disponible (voir section 3.6) |
| Localisation | Datacenter Union Européenne / EEE obligatoire (exigence RGPD art. 44\) |
| CPU | 4 vCPU minimum (PostgreSQL \+ Laravel \+ WebDB \+ n8n \+ Express \+ stockage) |
| RAM | 8 Go minimum — 16 Go recommandés en production avec charge réelle |
| Stockage | 100 Go SSD NVMe pour DB \+ OS. Volume séparé 200 Go+ pour /storage (photos, médias, PDFs) |
| Réseau | Bande passante : 1 Gbps. IP dédiée pour SSL. |
| OS | Debian 12 ou Ubuntu 22.04 LTS |
| Estimation coût | 20–40 EUR/mois (VPS EU 4 vCPU / 8 Go RAM / 100 Go SSD) |

ℹ  En cas de qualification HDS (point PO-05), le provider devra être certifié HDS. Dans ce cas : OVH Healthcare ou Scaleway HDS. Le coût est significativement plus élevé (\~150–400 EUR/mois).

## **13.2 Déploiement — Docker Compose**

Tous les services tournent via Docker Compose sur le même serveur. Chaque service est un conteneur isolé.

| Service | Image Docker | Notes |
| :---- | :---- | :---- |
| PostgreSQL | postgres:15 | Données sur volume persistant /var/lib/postgresql |
| Laravel (API) | php:8.3-fpm \+ nginx | Build depuis le repo Git via CI |
| WebDB | ghcr.io/cla-cif/web-db:latest | Port lié à 127.0.0.1 uniquement — jamais exposé publiquement |
| n8n | n8nio/n8n:latest | Données sur volume persistant |
| Express (IA) | node:20-alpine | Build depuis le repo Git via CI |
| Nginx (reverse proxy) | nginx:alpine | Point d'entrée public — TLS 1.3 avec Let's Encrypt |

ℹ  Docker Compose permet de démarrer tout l'environnement avec une commande, de reproduire l'environnement de prod en dev, et de mettre à jour chaque service indépendamment.

## **13.3 Backup**

| Élément | Fréquence | Rétention | Méthode |
| :---- | :---- | :---- | :---- |
| Base de données PostgreSQL | Quotidien (3h du matin) | 30 jours | pg\_dump compressé vers stockage distant (S3 EU ou Backblaze B2) |
| Fichiers /storage (photos, PDFs, médias) | Quotidien | 30 jours | rsync ou snapshot volume vers stockage distant |
| Config Docker Compose \+ .env | À chaque modification | Illimité | Git (repo privé — sans les secrets) |
| Test de restauration | Mensuel | — | Restaurer la DB sur un serveur de test et vérifier l'intégrité |

⚠  Sans backup testé, une panne disque signifie la perte de toutes les données clientes, photos et rapports. Le test de restauration mensuel est obligatoire.

## **13.4 Monitoring et alertes**

| Quoi surveiller | Seuil d'alerte | Outil |
| :---- | :---- | :---- |
| Uptime API Laravel | Indisponibilité \> 1 minute | UptimeRobot (gratuit) ou Betterstack |
| Espace disque /storage | \> 80% utilisé | Script cron \+ alerte email |
| RAM et CPU serveur | \> 85% pendant \> 5 minutes | Netdata (self-hosted) ou Grafana Cloud |
| Erreurs 5xx API | \> 10 erreurs en 5 minutes | Logs Laravel (Sentry ou simple log monitoring) |
| Échec backup | Si pg\_dump échoue | Script cron \+ alerte email |

## **13.5 Service email (SMTP pour n8n)**

Le workflow n8n de fallback email nécessite un service SMTP configuré. Deux options selon le volume :

| Option | Coût | Limite | Recommandation |
| :---- | :---- | :---- | :---- |
| Brevo (ex-Sendinblue) — plan gratuit | 0 EUR/mois | 300 emails/jour (soit \~9 000/mois) | Suffisant pour le MVP (3 boutiques × max 10 séances/jour \= 30 emails max/jour) |
| Mailgun — plan Flex | \~5 EUR/mois | 5 000 emails/mois | Si le volume de séances dépasse 300/jour |
| SMTP maison (Postfix sur le serveur) | 0 EUR (inclus serveur) | Illimité | Déconseillé — risque fort de blacklistage IP, maintenance lourde |

ℹ  Brevo est recommandé pour le MVP : gratuit, fiable, RGPD-conforme (hébergement EU), API simple pour n8n. La configuration SMTP est une tâche no-codeur dans n8n.

## **13.6 Chiffrement au repos**

| Donnée | Méthode |
| :---- | :---- |
| Base de données PostgreSQL | Chiffrement disque LUKS sur le volume PostgreSQL — transparent pour l'application |
| Fichiers /storage (photos, PDFs, médias) | Chiffrement disque LUKS sur le volume /storage — même niveau que la DB |
| Tokens Shopify en DB | Chiffrement applicatif Laravel encrypt() en plus du chiffrement disque |
| Token device miroir | Chiffrement via safeStorage Electron (OS keychain) côté miroir |

ℹ  LUKS (Linux Unified Key Setup) est le standard de chiffrement disque Linux. Il est transparent pour toutes les applications — pas de modification de code nécessaire.

# **14\. Estimation des coûts**

## **14.1 Coûts récurrents (mensuel)**

| Poste | Estimation | Notes |
| :---- | :---- | :---- |
| VPS serveur Scaleway (4 vCPU, 8 Go, 100 Go SSD) | 30–35 EUR/mois | Scaleway DEV1-XL ou GP1-XS — retenu pour conformité RGPD (voir section 3.6) |
| Volume stockage supplémentaire /storage | 5–15 EUR/mois | Selon volume photos/vidéos/PDFs |
| Backup distant (Backblaze B2 ou S3 EU) | 2–5 EUR/mois | Pour \~50 Go de données backupées |
| OpenRouter API (Gemini Flash 1.5) | 15–40 EUR/mois | Estimation \~3 300 appels/mois (5 séances/jour × 3 boutiques × 22j × 2 photos/séance) |
| Nom de domaine \+ certificat SSL | 1 EUR/mois | \~12 EUR/an — Let's Encrypt pour SSL \= gratuit |
| WebDB, n8n, Laravel | 0 EUR | Self-hosted sur le serveur |
| Service SMTP (Brevo plan gratuit / Mailgun si dépassement) | 0–5 EUR/mois | Brevo gratuit jusqu'à 300 emails/jour — suffisant pour le MVP |
| Total mensuel estimé (hors matériel) | \~55–115 EUR/mois | Variable selon le volume de séances |

## **14.2 Coûts matériels (par miroir — une seule fois)**

| Poste | Estimation | Notes |
| :---- | :---- | :---- |
| Miroir Shineworld (sur mesure, ecran 32" tactile HDMI) | A chiffrer | Selon fabricant — a budgeter avec le client |
| Raspberry Pi 5 (8 Go RAM) | \~90 EUR | Prix indicatif mars 2026 |
| Boitier Pi imprime 3D (PETG) | \~5 EUR | Impression FDM, materiau PETG |
| Adaptateur micro-HDMI → HDMI | \~10 EUR | Cable court 30-50 cm |
| Microscope Jiusion 4K WiFi | \~45 EUR | Amazon ref. B0CPVH11Z6 |
| Dongle WiFi USB | \~15 EUR | Si microscope WiFi (pour internet parallele) |
| Carte microSD (128 Go) | \~15 EUR | OS \+ app \+ cache medias |
| Total materiel par miroir (hors miroir Shineworld) | \~180 EUR | Boitier Pi \+ peripheriques |

## **14.3 Coûts de développement**

ℹ  Les coûts de développement (temps équipe DreamTech) sont à valoriser séparément dans le devis commercial. Ce tableau couvre uniquement les coûts d'infrastructure et de matériel.

# **15\. Positionnement RGPD — Données cosmétiques vs données de santé**

## **15.1 Décision : positionnement cosmétique**

Le point ouvert PO-05 est tranché. Le système se positionne comme un outil cosmétique et de bien-être, pas comme un outil médical. Ce positionnement permet d'éviter l'hébergement HDS (Hébergeur de Données de Santé) et les contraintes associées.

Pour que ce positionnement tienne juridiquement, trois conditions sont impératives :

* Vocabulaire : aucun terme médical dans les catégories, libellés, commentaires IA ou interface (voir section 8.3 et 7.4)

* Pas de renvoi médical : l'IA ne recommande jamais de consulter un médecin ou dermatologue

* Disclaimer affiché aux 3 endroits suivants : (1) écran de consentement du miroir — avant toute capture, (2) écran de résultats IA — sous chaque analyse, (3) rapport PDF — dans le pied de page. Texte type : 'Cet outil est un service cosmétique à titre indicatif. Il ne constitue pas un avis médical.'

## **15.2 Consentement RGPD — règles non-négociables**

| Règle | Description |
| :---- | :---- |
| RG-001 — Obligatoire | L'API refuse de créer une séance sans consentement\_id valide. Contrainte API — pas seulement UI. |
| RG-002 — Texte complet | Le texte exact affiché sur le miroir est stocké intégralement (pas une référence de version). Preuve légale. |
| RG-003 — Horodatage | Timestamp UTC précis \+ timezone. Obligatoire pour la valeur légale. |
| RG-004 — Par séance | Un consentement \= une séance. Pas de consentement permanent. |
| RG-005 — Droit à l'effacement | Suppression de toutes les données cliente sur demande. Le consentement lui-même est conservé (preuve légale). |

| \[ MARKETING \]  Le texte de consentement est fourni par le marketing, validé par un juriste AVANT intégration |
| :---- |
|             Tout changement de texte nécessite une revalidation juridique et une mise à jour coordonnée avec le dev |

## **15.3 DPA avec les fournisseurs**

⚠  Un Data Processing Agreement (DPA) doit être signé avec OpenRouter et tout fournisseur LLM utilisé, avant mise en production. Les photos capillaires transitent par ces services — leur traitement doit être contractuellement encadré (PO-04).

# **16\. Tests critiques**

Ces 6 tests sont non-négociables. Aucune mise en production si l'un d'eux échoue.

| \# | Test | Ce qui est vérifié |
| :---- | :---- | :---- |
| TC-01 | Isolation boutiques | Un compte gérant K Beauty Nice ne peut lire ni modifier aucune donnée K Beauty Lyon, via aucun endpoint Laravel. RLS vérifié si activé. |
| TC-02 | Consentement obligatoire | L'API retourne une erreur 422 si POST /api/seances est appelé sans consentement\_id valide — indépendamment de l'UI du miroir. |
| TC-03 | Sync offline photos | Des photos avec synced \= false sont intégralement uploadées et marquées synced \= true à la reconnexion, sans perte ni duplication. |
| TC-04 | Auth miroir \+ Express | Un token device expiré est rejeté (401 Laravel). Un appel Express sans X-Mirror-Token est rejeté (401 Express). Un miroir d'une autre boutique ne peut pas s'authentifier. |
| TC-05 | Validation IA | Une réponse malformée d'OpenRouter est interceptée par Express sans crash — retourne une erreur propre avec code HTTP au miroir. |
| TC-06 | Fallback email n8n | Une séance avec email cliente, QR non scanné après 1h et email\_envoye \= false déclenche l'email et met à jour email\_envoye \= true via l'API. |

# **17\. Critères de performance**

| Métrique | Objectif | Comment mesurer |
| :---- | :---- | :---- |
| Démarrage miroir (power-on → écran accueil) | \< 30 secondes | Chronomètre \+ systemd-analyze |
| Latence flux microscope | \< 50 ms | Performance API navigateur Electron |
| Photo capturée → résultat IA affiché | \< 5 secondes | Timer côté miroir déclenché à la capture |
| Génération PDF (n8n) | \< 5 secondes | Logs n8n |
| Réponse API Laravel (endpoints miroir, p95) | \< 300 ms | Logs Laravel |
| RAM totale sur le miroir | \< 6 Go (sur 8 Go) | free \-m sur le Pi |
| Cache médias sur le miroir | \< 2 Go (configurable) | df sur le Pi |

# **18\. Points ouverts**

PO-05 (qualification HDS) est tranché : positionnement cosmétique retenu (voir section 14). Les points restants :

| \# | Point | Impact | Responsable | Échéance |
| :---- | :---- | :---- | :---- | :---- |
| PO-01 | Choix hardware : Raspberry Pi 5 vs Beelink SER5 (benchmarks requis) | Budget device, performance | Orion \+ Carmack | Sprint 1 |
| PO-02 | TRANCHE (clos). Protocole streaming microscope confirme par le code : WiFi/TCP `192.168.34.1:8080`, handshake JHCMD, flux H.264 transcode par ffmpeg en MJPEG sur `localhost:9100` (`proxy.js`). Le plan B USB/UVC n'a pas ete retenu ; les references USB du depot sont des vestiges morts. | Architecture pipeline vidéo | Orion | Clos |
| PO-03 | Validation des 8 catégories d'analyse cosmétique par les praticiennes K Beauty | Qualité recommandations IA | Iris \+ client | Sprint 1 |
| PO-04 | DPA avec OpenRouter et fournisseurs LLM | RGPD — bloquant pour la prod | Externe (juridique) | Avant mise en prod |
| PO-05 | \~\~Qualification HDS\~\~  TRANCHÉ : positionnement cosmétique retenu (section 14\) | Résolu | — | Résolu |
| PO-06 | Durée validité QR code (défaut 30 jours) — à confirmer client | UX cliente, sécurité | PM \+ client | Validation CDC |
| PO-07 | Format export Shopify (champs, règles de mapping) | Intégration export clientes | Nadia | Sprint 2 |
| PO-08 | Nom de domaine \+ SSL production | Infrastructure réseau | Nadia | Sprint 2 |
| PO-09 | Modèle tarifaire B2B (package miroir, abonnement) | Stratégie commerciale | PM \+ client | Pré-lancement |

CDC Technique Smart Mirror  •  Version 5.0  •  Mars 2026  •  DreamTech — Confidentiel