  
**CAHIER DES CHARGES FONCTIONNEL**

─────  ✧  ─────

Smart Mirror

Analyse capillaire assistée par intelligence artificielle

K Beauty Cosmetics — Bubble Hair Spa

**DreamTech**

| Version | 2.0 |
| :---- | :---- |
| **Date** | Mars 2026 |
| **Client** | K Beauty Cosmetics |
| **Équipe** | DreamTech |
| **Statut** | En attente de validation |

# **Sommaire**

# **1\. Contexte et objectifs**

## **1.1 Présentation du client**

K Beauty Cosmetics est une enseigne spécialisée en cosmétiques coréens, présente dans 3 boutiques en France : Nice, Lyon et Cannes. L’enseigne propose un service premium « Bubble Hair Spa » dédié au soin capillaire en boutique.

Le client dispose d’un site e-commerce Shopify (kbeauty-cosmetics.com) avec une base clients existante, et utilise Klaviyo pour ses campagnes de mailing. À ce jour, il n’existe aucun outil dédié au soin capillaire en boutique — les praticiens travaillent avec une tablette qui sera remplacée par le miroir connecté.

## **1.2 Besoin exprimé**

Le client souhaite un ensemble composé de deux briques :

* Un miroir connecté (smart mirror) sous Linux, utilisé en boutique pour l’analyse capillaire assistée par IA, avec flux vidéo sans fil du microscope et génération d’un rapport client en fin de séance

* Un back-office web pour gérer les fiches clients, les contenus du miroir, les produits proposés, et exporter les données vers le CRM Shopify existant

## **1.3 Objectifs du projet**

* Offrir une expérience client premium et différenciante en boutique

* Centraliser les données clients liées au soin capillaire (marketing \+ analytique)

* Permettre un suivi longitudinal de l’état capillaire d’une séance à l’autre

* Exploiter l’IA comme avantage concurrentiel (aucun concurrent sur ce créneau)

* Alimenter le CRM Shopify existant avec les données du miroir pour du mailing ciblé

* Construire un MVP en vue d’une commercialisation à d’autres boutiques

## **1.4 Cibles utilisateurs**

| Utilisateur | Rôle |
| :---- | :---- |
| **Praticien en boutique** | Utilise le miroir : lance les analyses, effectue les soins, prend les photos, génère les rapports |
| **Client final** | Valide son consentement, observe le flux en direct, scanne le QR code en fin de séance |
| **Administrateur / siège** | Gère les fiches clients, les contenus du miroir, les produits, les exports vers Shopify via le back-office |

# **2\. Périmètre fonctionnel**

## **2.1 Inclus dans le MVP**

| Module | Description |
| :---- | :---- |
| **Application miroir** | Flux vidéo sans fil du microscope, captures photo, analyse IA des photos, consentement RGPD, QR code \+ rapport PDF |
| **Back-office web** | Fiches clients (marketing \+ analytiques \+ rapports), contrôle du miroir, gestion produits, export Shopify |
| **IA par API** | Analyse des photos via API LLM vision : diagnostic \+ commentaire \+ recommandations produits en un seul appel |
| **Rapport PDF \+ QR** | Analyse IA, photos avant/après, recommandations produits avec liens d’achat |
| **Consentement RGPD** | Écran de consentement sur le miroir, validé par le client avant toute capture |

## **2.2 Hors périmètre MVP**

* Paiement sur le miroir

* Prise de rendez-vous

* Notifications push / relances client

* Intégration directe Klaviyo (le client gère ses campagnes depuis Shopify/Klaviyo)

# **3\. Application miroir**

## **3.1 Système d’exploitation**

Le miroir fonctionne sous Linux (Debian/Ubuntu ARM). Le miroir Shineworld étant fabriqué sur mesure, le choix de l’OS est libre. Linux est retenu pour les raisons suivantes :

* Gestion native de deux interfaces WiFi simultanées (nécessaire pour le microscope sans fil \+ la connexion cloud)

* Application développée en Electron (React/TypeScript) — correspond aux compétences de l’équipe

* Mode kiosque total : l’application se lance au démarrage en plein écran, aucune interface parasite

* Maintenance à distance par SSH

* Mises à jour par script ou OTA

## **3.2 Connectivité réseau (double WiFi)**

Le microscope sans fil crée son propre réseau WiFi. Quand le miroir s’y connecte, il perd internet. Solution retenue :

* WiFi interne du miroir → connecté au hotspot du microscope (flux vidéo)

* Dongle WiFi USB (\~10-15 €) branché sur le miroir → connecté à la box internet de la boutique (cloud \+ API IA)

Les deux interfaces fonctionnent simultanément sous Linux. Le miroir reçoit la vidéo ET communique avec le cloud en parallèle.

## **3.3 Accès**

Le miroir est allumé et immédiatement utilisable par tout praticien. Pas d’authentification individuelle. Interface tactile, optimisée pour un usage debout.

## **3.4 Flux vidéo du microscope**

* Affichage en continu du flux vidéo sans fil du microscope pendant tout le soin

* Deux modes d’affichage : plein écran ou fenêtre réduite

* Pas de sélection de source vidéo — le microscope est l’unique source

* Le flux vidéo reste local sur le miroir, il ne transite pas par le cloud

* Le praticien déclenche des captures photo (snapshots) depuis le flux

## **3.5 Analyse IA des photos**

L’IA n’analyse pas le flux vidéo. Elle analyse uniquement les photos (snapshots) prises par le praticien.

* Le praticien prend une photo → envoyée à l’API IA

* L’API renvoie : diagnostic (catégorie \+ score de confiance), commentaire en français, recommandations de produits Shopify

* Le résultat s’affiche sur le miroir à côté de la photo

* L’IA indique « analyse non concluante » si le score est trop faible

## **3.6 Consentement RGPD**

* Écran de consentement affiché avant toute capture

* Le client valide sur l’écran tactile

* Consentement enregistré et horodaté

* Aucune capture possible sans consentement

## **3.7 Contenus affichés sur le miroir**

En dehors du flux microscope, le miroir affiche des contenus configurés depuis le back-office : images, visuels promotionnels, produits mis en avant. Le praticien ne configure pas ces éléments.

## **3.8 Workflow d’une séance type**

1. Le praticien ouvre l’application sur le miroir

2. Recherche ou création de la fiche client

3. Validation du consentement RGPD par le client

4. Activation du flux vidéo sans fil du microscope

5. Analyse AVANT-SOIN : le praticien prend des photos, l’IA les analyse

6. Réalisation du soin capillaire (le flux vidéo reste affiché)

7. Analyse APRÈS-SOIN : nouvelles photos, nouveaux résultats IA

8. Comparaison avant/après affichée sur le miroir

9. Génération du rapport PDF et du QR code

10. Le client scanne le QR code et accède à son rapport

# **4\. Back-office web**

Le back-office est l’interface centrale de gestion. Il pilote le contenu du miroir, gère les fiches clients, et exporte les données vers Shopify.

## **4.1 Fiches clients**

### **4.1.1 Informations marketing**

* Nom, prénom

* Adresse email

* Numéro de téléphone

Ces données servent à contacter le client et à alimenter le CRM Shopify.

### **4.1.2 Informations analytiques**

* Âge

* Sexe

* Notes et observations du praticien

### **4.1.3 Rapports de séances**

* Chaque séance est enregistrée dans la fiche client

* Contenu : photos avant/après, résultats IA, recommandations, produits suggérés

* Classé par date (chronologie des séances)

* Consultation de l’évolution dans le temps

## **4.2 Contrôle du miroir**

* Choix des images et visuels affichés (promotions, ambiance, branding)

* Sélection des displays / écrans de contenu

* Gestion des produits mis en avant

Le praticien ne configure pas ces éléments — tout est piloté depuis le back-office.

## **4.3 Gestion des produits**

* Les données produits (nom, description, tags, catégorie, prix, lien) proviennent de Shopify

* Un développeur dédié récupère les tags et data produits depuis l’API Shopify

* Ces produits sont injectés dans le prompt de l’IA pour les recommandations

* Le back-office gère quels produits sont proposés et mis en avant

## **4.4 Export vers le CRM Shopify**

* Export des informations marketing (email, téléphone) vers la base clients Shopify

* Correspondance entre client miroir et client Shopify par email

* Objectif : synchronisation avec la base existante et exploitation via Klaviyo

L’intégration directe de Klaviyo n’est pas dans le périmètre.

## **4.5 Multi-boutique et statistiques**

* Gestion des boutiques (Nice, Lyon, Cannes)

* Historique client unifié entre les boutiques

* Gestion des rôles (admin siège, manager boutique)

* Tableau de bord : séances, diagnostics, évolutions

* Export de données (CSV, rapports)

# **5\. QR code et rapport PDF**

## **5.1 QR code**

* Généré automatiquement en fin de séance

* Affiché en grand sur le miroir pour que le client le scanne

* Pointe vers une URL unique et sécurisée

* Durée de validité du lien : à définir (voir section 9\)

## **5.2 Contenu du rapport PDF**

Le rapport est en français et contient :

* En-tête avec le branding K Beauty / Bubble Hair Spa

* Informations client : nom, date, boutique, praticienne

* Photos avant-soin et après-soin côte à côte

* Résultats de l’analyse IA : catégories, scores de confiance

* Commentaire IA en français rédigé par le LLM

* Graphique d’évolution si historique de séances

* Recommandations de soins

* Suggestions de produits Shopify avec lien d’achat direct

Format A4 portrait — imprimable et lisible sur smartphone.

# **6\. Intelligence artificielle**

## **6.1 Principe**

L’IA n’analyse pas le flux vidéo. Elle analyse uniquement les photos prises par le praticien (5 à 15 par séance). L’analyse se fait via un appel à une API LLM multimodale hébergée dans le cloud. Un seul appel par photo produit : le diagnostic, le commentaire en français, et des recommandations de produits du catalogue Shopify.

## **6.2 Fonctionnement**

Pour chaque photo, le back-end envoie à l’API :

* La photo (JPEG)

* Le catalogue produits Shopify (noms, tags, descriptions, URLs)

* Un prompt système décrivant les catégories d’analyse et le format de réponse

* Le contexte client si disponible (historique des séances précédentes)

L’API renvoie un JSON structuré contenant le diagnostic, le commentaire et les produits recommandés.

## **6.3 Agrégateur API : OpenRouter**

L’API est appelée via OpenRouter, un agrégateur qui permet de basculer entre différents modèles (GPT-4o mini, Gemini Flash, Claude Haiku) sans changer le code :

* Pas de dépendance à un seul fournisseur

* Basculement immédiat si un provider augmente ses prix ou tombe en panne

* Possibilité de comparer la qualité des diagnostics entre modèles

## **6.4 Catégories d’analyse**

Liste initiale à valider avec le client et les praticiens :

* Cuir chevelu sec

* Cuir chevelu gras / excès de sébum

* Pellicules (sèches / grasses)

* Inflammation / rougeurs

* Densité capillaire (normale / faible)

* Zones clairsemées / alopécie débutante

* Cuir chevelu sain

## **6.5 Recommandation de produits**

Le catalogue produits Shopify est injecté dans le contexte de chaque appel IA. Le LLM fait le matching sémantique entre le diagnostic et les produits. Pas de système de matching à développer séparément.

* Les produits recommandés apparaissent sur le miroir après chaque analyse

* Ils sont inclus dans le rapport PDF avec lien d’achat vers kbeauty-cosmetics.com

## **6.6 Évolution long terme**

Si le volume augmente ou si l’on souhaite supprimer la dépendance aux API externes, il sera possible de fine-tuner un modèle de classification (ViT-B/16) sur le dataset AI-Hub Korea (21 000+ images microscopiques de cuir chevelu) et de le déployer sur HuggingFace Inference API.

# **7\. Matériel**

## **7.1 Miroir connecté**

| Caractéristique | Détail |
| :---- | :---- |
| **Fabricant** | Dongguan Shineworld Innovations Technology Co., Ltd. — sur mesure |
| **Système** | Linux (Debian/Ubuntu ARM) |
| **Écran** | Tactile capacitif |
| **Connectivité** | WiFi interne (microscope) \+ dongle WiFi USB (internet) |
| **Application** | Electron (React/TypeScript) en mode kiosque |

## **7.2 Microscope**

| Caractéristique | Détail |
| :---- | :---- |
| **Modèle** | Jiusion 4K WiFi (réf. Amazon B0CPVH11Z6) |
| **Résolution** | 4K (3840×2160) |
| **Grossissement** | 50x à 1000x |
| **Connexion** | WiFi sans fil (hotspot « HD-Microscope-xxx ») |
| **Format capture** | JPEG |
| **Prix** | \~45 € (Amazon FR) |
| **Compatibilité** | iOS, Android, Windows, Mac, Linux, Chrome OS |

Le microscope crée son propre hotspot WiFi. Le flux vidéo est accessible sur le réseau local du microscope. Le miroir s’y connecte via son WiFi interne.

## **7.3 Dongle WiFi USB**

Un dongle WiFi USB (\~10-15 €) est branché sur le miroir pour la connexion internet en parallèle du microscope.

# **8\. Données et conformité RGPD**

## **8.1 Données collectées**

| Donnée | Nature | Sensibilité |
| :---- | :---- | :---- |
| Nom, prénom, email, tél. | Données marketing | Standard |
| Âge, sexe | Données analytiques | Standard |
| Photos cuir chevelu | Images potentiellement médicales | Élevée |
| Résultats IA | Données de santé potentielles | Élevée |
| Consentement RGPD | Preuve légale | Critique |
| Historique séances | Données métier | Modérée |

## **8.2 Hébergement**

* Stockage hybride : cache local miroir \+ persistance cloud

* Cloud en datacenter européen (RGPD)

## **8.3 Données de santé**

Les photos et diagnostics IA pourraient être qualifiés de données de santé. Si oui, hébergement HDS requis. Point à trancher avant production.

## **8.4 Mesures RGPD**

* Consentement explicite et horodaté

* Droit d’accès via le rapport PDF

* Droit à l’effacement : suppression complète

* Durée de rétention : à définir

* Chiffrement au repos et en transit

Les photos envoyées à l’API LLM nécessitent un DPA avec le fournisseur d’API.

# **9\. Risques et points ouverts**

## **9.1 Risques identifiés**

| Risque | Impact | Mitigation |
| :---- | :---- | :---- |
| Protocole WiFi du microscope Jiusion | Modéré | Scanner le réseau WiFi du microscope et vérifier l’accès au flux MJPEG |
| Qualité du diagnostic IA (LLM) | Modéré | Comparer GPT-4o mini / Gemini Flash / Claude Haiku sur un jeu de test |
| DPA avec le fournisseur API IA | Modéré | Vérifier les DPA chez OpenAI / Google / Anthropic |
| Qualification HDS requise | Modéré | Consulter un juriste. Démarrer sur hébergeur EU standard |
| Perte de connexion en soin | Faible | Flux vidéo local non impacté. Photos stockées et envoyées après reconnexion |

## **9.2 Points ouverts**

| \# | Point | Responsable | Deadline |
| :---- | :---- | :---- | :---- |
| 1 | Vérification protocole WiFi Jiusion 4K (MJPEG ?) | Équipe dev | Dès réception |
| 2 | Catégories d’analyse à valider | Client / praticiens | Validation CDC |
| 3 | Qualification HDS | Juridique | Avant production |
| 4 | Durée de validité du lien QR | Dev \+ client | Validation CDC |
| 5 | Durée de rétention des données | Client \+ juridique | Avant production |
| 6 | Format export Shopify | Dev \+ client | Validation CDC |
| 7 | DPA fournisseur API IA | Juridique | Avant production |

# **10\. Livrables**

## **10.1 Livrables MVP**

1. Application miroir Electron (Linux) : flux microscope, captures, analyse IA, QR code

2. Back-office web : fiches clients, contrôle miroir, gestion produits, export Shopify

3. Intégration API IA via OpenRouter : diagnostic \+ commentaire \+ recommandations

4. Génération du rapport PDF

5. Documentation du projet

## **10.2 Roadmap post-MVP**

* Modèle IA custom (ViT fine-tuné) si le volume le justifie

* Mode offline avec synchronisation

* Migration HDS si nécessaire

* Espace client web (consultation historique)

# **11\. Identité visuelle et graphisme**

L’interface du Smart Mirror est conçue pour un environnement boutique premium. Le parti pris est un design mode sombre, épuré et futuriste, avec des rappels discrets de l’univers K-Beauty.

## **11.1 Charte graphique**

### **Palette de couleurs**

Fond sombre premium, accents lumineux discrets, lisibles sur écran miroir en aluminium teinté.

| Rôle | Couleur | Usage |
| :---- | :---- | :---- |
| **Fond principal** | Noir clair | Fond général interface miroir |
| **Titres et textes** | Blanc cassé | Titres actifs, textes sur fond sombre |
| **Boutons** | Rose  | Boutons principaux |
| **Éléments graphiques** | Rose clair | Icônes et éléments décoratifs |

### **Typographie**

| Titres miroir | Playfair Display |
| :---- | :---- |
| **Corps miroir** | Montserrat Medium |

### **Logo**

* Logo K Beauty Cosmetics en haut du miroir — version blanche sur fond sombre

* Logo DreamTech uniquement dans le back-office et les documents techniques

* L’interface miroir est 100% K Beauty — signature discrète « Powered by Smart Mirror » en pied d’écran

## **11.2 Design de l’interface miroir**

Interface conçue pour un usage debout, tactile, en conditions de soin. La praticienne a les mains occupées — zones interactives larges, gestes simples. Le client ne touche jamais l’écran.

### **6 écrans clés**

| Écran | Description |
| :---- | :---- |
| **1 — Accueil / veille** | Logo K Beauty centré, phrase de bienvenue. Bouton recherche ou créer client. |
| **2 — Recherche client** | Champ de recherche large (nom, email, tél). Résultats en liste. Bouton « Nouveau client ». |
| **3 — Consentement RGPD** | Texte court et clair. Grande case à cocher « J’accepte ». Horodatage automatique. |
| **4 — Flux vidéo \+ IA** | Flux dans un cercle, possibilité plein écran. Menu à droite. Résultats IA affichés après chaque photo. |
| **5 — Comparaison avant/après** | Deux captures côte à côte. Résultats IA différentiels. |
| **6 — QR Code** | QR code grande taille. Texte : « Scannez pour recevoir votre rapport ». Fond sombre, QR blanc. |

*Note graphistes : réaliser un mock-up de chaque écran dans l’environnement physique réel (mur blanc, cadre aluminium noir) pour valider le rendu avant intégration.*

## **11.3 Design du rapport PDF**

Le rapport PDF est le seul document conservé par le client. Vecteur de marque direct — positionnement premium. Mode clair (fond blanc).

| En-tête | Logo K Beauty \+ Bubble Hair Spa à gauche, date et boutique à droite. Filet rose. |
| :---- | :---- |
| **Bloc client** | Prénom, date de séance, nom de la praticienne. |
| **Photos avant/après** | Deux photos côte à côte. Labels « Avant » / « Après » en typographie légère. |
| **Diagnostic IA** | Catégories détectées avec score visuel. Ton sobre, médical. |
| **Évolution** | Graphique minimaliste entre séances (si historique existant). |
| **Recommandations** | 2-3 suggestions de soins \+ produits Shopify avec liens d’achat. |
| **Pied de page** | Logo K Beauty, lien kbeauty-cosmetics.com, mention RGPD. |

## **11.4 Design du back-office**

Interface web mode clair, desktop et tablette. Ergonomie orientée efficacité.

| Module | Description |
| :---- | :---- |
| **Tableau de bord** | Vue synthétique : séances, diagnostics, alertes. Graphiques simples. |
| **Clients** | Liste searchable. Filtres boutique, date, diagnostic. |
| **Fiche client** | Marketing \+ analytiques. Chronologie séances. Export Shopify. |
| **Contenu miroir** | Upload et gestion visuels. Planning de rotation. |
| **Produits** | Produits Shopify synchronisés. Gestion mises en avant miroir et PDF. |
| **Boutiques** | Nice / Lyon / Cannes. Permissions. Stats par boutique. |
| **Export** | CSV clients. Synchronisation Shopify. Historique exports. |

# **12\. Communication et marketing**

Le Smart Mirror est un produit marketing autant qu’un outil technique. Il crée une expérience mémorable et constitue un argument de différenciation fort pour la franchise. Aucun concurrent n’existe sur ce marché.

## **12.1 Positionnement**

*« Votre cuir chevelu, analysé par IA. Votre soin, révélé par K Beauty Cosmetics. »*

| Innovation | Aucun concurrent identifié — first-mover advantage. |
| :---- | :---- |
| **Premium** | Le miroir élève le Bubble Hair Spa au niveau haut de gamme. |
| **Scientifique** | L’IA apporte une crédibilité technique : diagnostic mesuré et documenté. |
| **Personnel** | Chaque client repart avec son rapport unique. |
| **Franchise** | Brique clé du package franchise — barrière à l’entrée. |

### **Messages clés**

* Clients boutique : « Voyez votre cuir chevelu comme jamais. Repartez avec votre diagnostic. »

* B2B instituts : « Offrez à vos clients une expérience qu’ils n’ont jamais vécue ailleurs. »

* Presse / réseaux : « K Beauty Cosmetics invente le soin capillaire de demain. »

## **12.2 Stratégie de lancement**

### **Phase 1 — Lancement interne (mois 1-3)**

* Objectif : valider en conditions réelles, collecter retours praticiens et clients

* Canaux : formation équipes boutique, affichage en boutique, réseaux sociaux K Beauty

* KPIs : séances/semaine, taux de scan QR, NPS client

### **Phase 2 — Lancement B2B (mois 4-6)**

* Objectif : présenter la solution à d’autres instituts premium

* Canaux : salons pro beauté, LinkedIn, démarchage direct

* KPIs : démonstrations, leads qualifiés, premiers contrats

### **Calendrier**

| Période | Action | Canal |
| :---- | :---- | :---- |
| J-7 | Teaser « quelque chose se prépare » | Instagram K Beauty |
| J1 | Post révélation du miroir en boutique | Instagram, TikTok |
| Semaine 2 | Vidéo immersive parcours client | Reels, TikTok |
| Mois 1 | Témoignages premières clientes | Stories, Klaviyo |
| Mois 2-3 | Dossier de presse beauté tech | Presse, LinkedIn |
| Mois 4+ | Démarche commerciale B2B | LinkedIn, salons pro |

## **12.3 Supports de communication**

### **Affiche boutique**

* Format A3 portrait — 2 versions : zone d’accueil \+ cabine de soin

* Visuel du miroir en situation, accroche courte, logo K Beauty

* Livrable : Figma \+ PDF haute résolution

### **Campagne réseaux sociaux**

* 6 visuels minimum : 2 posts feed, 2 stories, 1 Reel cover, 1 TikTok cover

* Style futuriste et premium — reflet du miroir, ambiance coréenne

* \#SmartMirror \#KBeautyCosmetics \#BubbleHairSpa \#BeautyTech \#HairAnalysis

### **Vidéo de présentation (60 secondes)**

* 0-10s : problème (tablette) → 10-40s : miroir en action → 40-60s : client \+ QR code

* Motion design ou vidéo réelle — ambiance coréenne, musique douce, sous-titres

## **12.4 Commercialisation B2B**

Le Smart Mirror est commercialisé auprès d’autres instituts. K Beauty se positionne en premier opérateur. DreamTech assure le développement et le déploiement.

| Package de base | Miroir (\~800€) \+ microscope (\~45€) \+ dongle WiFi (\~15€) \+ installation \+ formation |
| :---- | :---- |
| **Logiciel** | Intégré au package — pas d’abonnement standalone |
| **Modèle franchise** | Brique du package franchise K Beauty — fourni aux franchisés |
| **Cible B2B** | Instituts premium, spas capillaires, boutiques K-Beauty, salons haut de gamme |

### **Arguments de vente**

* Aucun concurrent — first-mover advantage

* ROI mesurable : augmentation du panier moyen via les recommandations produits

* Fidélisation renforcée : suivi longitudinal incitant à revenir

* Collecte de données marketing pour le CRM existant

* Différenciation immédiate face aux concurrents

### **Roadmap commercialisation**

* Court terme (0-6 mois) : déploiement 3 boutiques K Beauty, validation terrain

* Moyen terme (6-12 mois) : premiers franchisés, salons pro beauté

* Long terme (12-24 mois) : déploiement national, 10+ partenaires multi-tenant

*Point ouvert : le modèle tarifaire exact doit être défini avec K Beauty avant toute démarche commerciale externe.*

# **13\. Glossaire**

| Terme | Définition |
| :---- | :---- |
| **CRM** | Customer Relationship Management — gestion de la relation client |
| **MVP** | Minimum Viable Product — version minimale fonctionnelle |
| **HDS** | Hébergeur de Données de Santé — certification française pour les données médicales |
| **RGPD** | Règlement Général sur la Protection des Données |
| **LLM** | Large Language Model — modèle de langage utilisé pour l’analyse IA |
| **API** | Application Programming Interface — interface entre services |
| **Electron** | Framework pour créer des applications de bureau avec des technologies web (JS/TS) |
| **MJPEG** | Motion JPEG — format de flux vidéo transmis image par image |
| **QR Code** | Code-barres 2D scannable par smartphone |
| **Klaviyo** | Plateforme de marketing automation utilisée via Shopify |
| **OpenRouter** | Agrégateur d’API IA — appeler différents modèles LLM via une seule interface |
| **DPA** | Data Processing Agreement — contrat de traitement des données avec un fournisseur tiers |

