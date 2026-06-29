# DOSSIER DE CONNAISSANCE — Soutenance RNCP 37046
## Chef de projet en solutions logicielles pour l'IoT
### Smart Mirror KBEAUTY / Bubble Hair Spa

> Document de connaissance du projet, mappe aux blocs de competences BC01 a BC06 du
> referentiel RNCP 37046. Il presente le projet tel qu'il a ete concu et realise (MVP),
> distingue ce qui releve du MVP livre de ce qui releve de la cible/roadmap, et expose
> les raisons des choix techniques et methodologiques.

---

## PARTIE 1 — Presentation et contexte client

### Le client : KBEAUTY (K Beauty Cosmetics)

KBEAUTY est une enseigne de cosmetiques coreens disposant de trois boutiques en France
(Nice, Lyon, Cannes). Elle propose un service premium de soin capillaire baptise
"Bubble Hair Spa". Son e-commerce repose sur Shopify (kbeauty-cosmetics.com) et son
mailing sur Klaviyo. Une base clients existe deja. Aujourd'hui, les praticiens realisent
les soins en s'appuyant sur une tablette, sans outil dedie a l'analyse capillaire ni a
la centralisation des donnees client.

### Le besoin

Remplacer la tablette par un miroir connecte capable d'analyser le cuir chevelu via un
microscope, de proposer un diagnostic cosmetique assiste par IA, de recueillir le
consentement RGPD du client, puis d'alimenter le CRM de l'enseigne. La proposition de
valeur : "Votre cuir chevelu, analyse par IA. Votre soin, revele par K Beauty Cosmetics."

### Les acteurs

Trois cibles utilisateurs structurent le produit :
- le praticien, qui conduit la seance au miroir ;
- le client final, qui consent et recoit son bilan ;
- l'administrateur / siege, qui pilote les boutiques et les miroirs via le back-office.

### SWOT (positionnement KBEAUTY)

| Axe | Elements |
|---|---|
| Forces | Positionnement premium, CRM Shopify deja en place, IA differenciante, architecture offline-first robuste |
| Faiblesses | Dependance a un fournisseur d'IA cloud, perimetre MVP mono-boutique, equipe reduite |
| Opportunites | Fenetre de positionnement (couplage microscope WiFi + IA + CRM en institut K-Beauty peu peuple en France), modele franchise / B2B instituts |
| Menaces | Risque de requalification en dispositif medical en cas de glissement de vocabulaire (RGPD art. 9 / MDR), transfert de donnees image hors UE, reproduction par un concurrent |

---

## PARTIE 2 — Marche, PESTEL et veille concurrentielle

### Analyse PESTEL (synthese)

- Politique / Legal : RGPD (consentement art. 7, minimisation, retention), debat donnees
  de sante / hebergement HDS, contrat de sous-traitance (DPA) avec le fournisseur d'IA
  cloud, vocabulaire medical proscrit, cadres RED (art. 3.3) et Cyber Resilience Act
  (exigence de SBOM). Le perimetre est strictement cosmetique, hors MDR.
- Economique : modele SaaS B2B par boutique, materiel maitrise, cout d'analyse IA tres
  faible (de l'ordre de 0,002 EUR par analyse).
- Social : attente de personnalisation et de transparence sur l'usage des donnees.
- Technologique : Raspberry Pi 5, Electron, vision par IA, microscope WiFi.
- Environnemental : sobriete energetique (consommation mesuree 5,7 a 6,8 W cote SBC).

### Veille concurrentielle

Le marche n'est pas vide : des acteurs serieux existent a l'echelle adjacente, meme si le
couplage precis microscope WiFi + IA + CRM en institut K-Beauty reste peu peuple en France.
- analyse capillaire / cuir chevelu professionnelle : L'Oreal/Kerastase K-Scan, BECON
  (coreen, soutenu par Samsung), FotoFinder (trichoscopie medicale), Aram Huvis / ARAMO ;
- miroirs connectes beaute grand public : CareOS, HiMirror.

La differenciation du projet ne repose pas sur une absence de concurrents mais sur
l'integration verticale : microscope WiFi a faible cout + IA + suivi longitudinal en
boutique relie au CRM Shopify de l'enseigne. Toute affirmation de type "aucun concurrent"
ou "first-mover" est ecartee.

---

## PARTIE 3 — Cahier des charges fonctionnel (CDCF)

### Problematique metier

Absence d'outil dedie au soin capillaire (la tablette ne centralise rien), besoin de
suivi longitudinal des clients, d'un diagnostic differenciant, et d'une alimentation
automatique du CRM, le tout dans une perspective de franchise.

### Besoins fonctionnels

- Application miroir : flux microscope en direct, captures photo, analyse IA, recueil et
  horodatage du consentement RGPD, deroule complet de la seance.
- Back-office : fiches clients, controle des miroirs, produits synchronises via Shopify,
  export vers le CRM, gestion multi-boutique.
- IA : 5 a 15 photos par seance, un appel par photo, reponse structuree JSON, 7 categories
  de diagnostic cosmetique.
- Restitution : QR code et PDF A4 du bilan remis au client.

### Contraintes

- Materiel : Debian 12 sur Raspberry Pi 5 (4 Go retenu, cf. decision RAM ; ARM64), double
  WiFi (dongle USB, non automatise en V1), ecran 32" 400 nits, microscope WiFi (~45 EUR),
  Electron en mode kiosk.
- RGPD : consentement obligatoire, minimisation, retention bornee.
- Contrainte de flux : le flux video en direct du microscope reste local et ne transite
  pas par le cloud. Cette contrainte concerne le flux video temps reel. Les captures
  (snapshots) destinees a l'analyse IA, elles, sont transmises au service d'analyse (voir
  Partie 5 et la note RGPD), distinction documentee explicitement.

### Solution retenue

Deux briques applicatives : le miroir (device) et le back-office. Design sombre, futuriste,
coherent avec l'identite K-Beauty.

### Tracabilite besoin -> regle de gestion -> test

Le projet maintient une chaine de tracabilite des regles de gestion (RG-001 a RG-010) vers
les cas de test critiques (TC-01 a TC-06). Exemple : le besoin de consentement se traduit
par les regles RG-001/RG-005, verifiees par le test TC-02 (refus HTTP 422 en l'absence de
`consentement_id`). Cette chaine illustre directement la maitrise du cadrage (BC01).

Le perimetre commercial cible vise 6 miroirs sur 3 boutiques. Le perimetre du MVP de
soutenance est volontairement reduit a une boutique et un tenant.

---

## PARTIE 3bis — Estimation, budget et cout total de possession

### Couts materiels

Le materiel unitaire avec ecran s'etablit autour de 1 000 a 1 100 EUR : ecran 32" ~700 a
900 EUR (incertitude majeure, a figer par devis fournisseur), Raspberry Pi 5 ~150 a 200 EUR
(tension RAM 2026), alimentation 27 W, refroidisseur actif, microSD, boitier imprime,
microscope WiFi ~45 EUR, dongle ~15 EUR, cablage ~10 EUR. Hors ecran, le poste materiel
revient a environ 250 a 290 EUR par miroir. L'ecran represente ainsi environ 70 a 75 % du
BOM unitaire : c'est la vraie incertitude du cout total, le reste etant stable.

### Couts recurrents (OpEx)

Charge mensuelle estimee entre 55 et 115 EUR par instance : VPS, stockage, sauvegarde,
appels au service d'IA cloud (~3 300 appels/mois), nom de domaine, SMTP. Le choix d'ecarter
un hebergement HDS (perimetre strictement cosmetique) economise 150 a 400 EUR/mois.

### Cout d'usage de l'IA

L'analyse cloud revient a environ 0,002 EUR par analyse, soit de l'ordre de 0,20 EUR par
mois et par miroir a 100 analyses. Au cout strict, le cloud est plus economique qu'un
accelerateur local ; l'investissement on-device se justifie par la souverainete et
l'independance reseau, non par le prix. Cet arbitrage est assume.

### Decoupage en lots (tiroirs)

Le chiffrage projet se decompose en lots : (1) device Electron, (2) backend et base de
donnees, (3) service IA, (4) microscope et proxy, (5) UX, (6) tests, CI et securite,
(7) provisioning et boitier 3D, (8) gestion de projet. Le cout total de possession sur
3 ans agrege le CapEx materiel et l'OpEx mensuel.

---

## PARTIE 4 — Gestion de projet et methodologie

### Methodologie : Merise Agile + TDD

La methode combine la rigueur de modelisation Merise (modele conceptuel de donnees MCD,
modele conceptuel de traitements MCT etablis avant le code) et l'iteration agile
(enrichissement incremental). Le Sprint 0 produit un MCD squelettique, enrichi sprint
apres sprint. Cette combinaison repond a la contre-objection classique ("Merise releve du
cycle en V") : la modelisation donne le socle de donnees, l'agile en gere l'evolution.

Articulation avec la contre-attaque jury : Merise sert a la rigueur du modele de donnees,
l'iteration agile sert a l'enrichir incrementalement. Sprint 0 = MCD squelettique, enrichi
ensuite.

### Cycle de developpement en 5 phases

Document Project -> Analyse -> Planning -> Solutioning -> Implementation.

### Niveaux de test

Priorite aux niveaux bas de la pyramide : unitaire, puis integration, puis end-to-end. Les
tests d'API sont traites comme des citoyens de premiere classe. La valeur de cette approche
s'est verifiee lors de la bascule du backend mock vers l'integration CRM.

### Role

Le projet est pilote par un chef de projet unique, qui orchestre l'ensemble du cycle. Le
versioning est assure par Git.

---

## PARTIE 5 — Cahier des charges technique (CDCT)

### Stack technique realisee (MVP)

Device (`smart-mirror/mirror-app`) :
- Electron ^33.2.0, React ^19, TypeScript ^5.7, Zustand ^5.
- electron-vite, electron-builder, electron-updater (mises a jour OTA avec rollback),
  electron-store (config), qrcode, react-simple-keyboard (clavier tactile).

Backend du device :
- Le backend embarque du miroir est un mock Express (Node.js), reuni dans un fichier
  unique exposant deux applications Express : une API simulant le backend ("Mock Laravel
  API", port 8100) et un proxy IA ("Mock Express IA Proxy", port 3001). Ce n'est pas un
  Laravel embarque.
- Acces a la base : SQL brut via le driver `pg` (`Pool.query`), sans ORM.

Base de donnees serveur :
- PostgreSQL 15 (`postgres:15-alpine`), base `smartmirror`, schema charge depuis `init.sql`.
  Types specifiques Postgres (UUID via `uuid-ossp`, JSONB pour le diagnostic IA, TEXT[]).
  Multi-tenant par `boutique_id`, requetes parametrees contre l'injection SQL.

Microscope et video :
- Connexion WiFi/TCP vers `192.168.34.1:8080`, handshake protocole JHCMD a la connexion.
- Codec source H.264, transcode en MJPEG par ffmpeg cote proxy. Le H.264 n'atteint jamais
  le renderer. La preview en direct est un flux MJPEG (`multipart/x-mixed-replace`) affiche
  dans une balise `<img>` pointant sur le port 9100. Les snapshots sont des JPEG recuperes
  en HTTP (`/snapshot.jpg`) puis transmis par IPC. ffmpeg est central dans le pipeline.

CRM separe (hors device) :
- Un veritable Laravel existe, mais c'est le CRM separe (`crm/backend`, framework ^13.0),
  deploye cote serveur. Il ne doit pas etre confondu avec le backend embarque du miroir.
  La montee vers ce CRM Laravel constitue la cible / roadmap d'integration.

### Modele de donnees

- Le schema `init.sql` definit 9 tables : boutiques, clientes, consentements, miroirs,
  seances, photos, produits, medias, et `config_miroir`.
- Le MCD definit 8 entites : BOUTIQUE, CLIENTE, CONSENTEMENT, MIROIR, SEANCE, PHOTO,
  PRODUIT, MEDIA. Chacune correspond 1:1 a une table SQL.
- L'ecart 8 entites vs 9 tables s'explique par `config_miroir`, table technique de
  configuration de l'interface du miroir, presente en base mais absente du MCD.
- Divergences de nommage documentees : pour MIROIR, le MCD parle de
  `adresse_mac/token_device/en_ligne` la ou le SQL utilise `device_token/is_online/ip_address`
  (pas de colonne `adresse_mac`) ; pour PRODUIT, le MCD parle de `mis_en_avant` la ou le
  SQL utilise `affiche_miroir`.

### Verrou RGPD du consentement (deux niveaux)

- Niveau base : `consentement_id UUID NOT NULL REFERENCES consentements(id)` sur la table
  `seances`.
- Niveau applicatif : `POST /api/seances` refuse en HTTP 422 si le `consentement_id` est
  absent, et egalement si le consentement est introuvable ou revoque (verification de
  `date_revocation IS NULL`). Le code retourne 422, et non 403.

### Chiffrement et securite (etat realise)

- Chiffrement au repos en AES-256-GCM via le service CryptoVault (singleton `cryptoVault`).
  Format de la charge : version (1 octet) + IV (12 octets) + authTag GCM (16 octets) +
  chiffre. Donnees chiffrees : photos de cuir chevelu (`.jpg.enc`), file de synchronisation
  JSON, secrets et tokens de configuration. Avant upload vers le CRM, les `.jpg.enc` sont
  dechiffres et le suffixe `.enc` retire du nom distant.
- Gestion de la cle maitre, par ordre de priorite : variable d'environnement
  `SMART_MIRROR_MASTER_KEY` (base64, 32 octets), puis credentials systemd, puis fichier
  `MASTER_KEY_FILE`, puis cle de developpement locale en dernier recours. En production
  sans cle, le service leve une exception (pas de degrade silencieux).
- safeStorage d'Electron n'est pas utilise en production ; il n'apparait que dans le mock de
  test. Le chiffrement applicatif repose sur CryptoVault.
- Durcissement Electron : `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`,
  et une CSP appliquee en production via `onHeadersReceived`. systemd durci
  (`ProtectSystem=strict`, `NoNewPrivileges`), mode kiosk durci.

### Integration continue (CI)

Le pipeline `.github/workflows/ci.yml` definit des controles dont l'etat de blocage est le
suivant :
- Bloquants : `npm audit` au niveau CRITICAL sur les dependances de production, et le scan
  de secrets gitleaks (job `secrets-scan`).
- Non bloquants (`continue-on-error`) : `npm audit` au niveau high incluant les dependances
  de developpement, la generation de SBOM CycloneDX (uploadee en artefact), et l'analyse
  statique Semgrep.

Cette gradation est assumee : les gates bloquants couvrent le risque critique avere et la
fuite de secrets ; SBOM et Semgrep sont en place comme controles d'observation, non encore
promus en gates bloquants.

### Tests

- Tests unitaires Vitest : 60 cas repartis sur 5 services (`src/main/services/`) :
  api-client (14), config (14), crm-sync (18), crypto-vault (7), sync (7). Le service
  crm-sync est donc bien couvert (18 cas). Les services non couverts en unitaire sont
  media-cache, microscope, updater et wifi (5 services testes sur 9).
- Tests end-to-end Playwright : 136 cas sur 4 fichiers (mirror-qa 14, qa-complete 65,
  qa-senior-vm 42, vm-qa 15), dont des scenarios pilotes via CDP sur VM Debian 12.
- Total : 196 cas (60 unitaires + 136 e2e). Six cas critiques (TC-01 a TC-06) couvrent
  l'isolation tenant, le consentement 422, la synchronisation offline, l'authentification,
  l'IA malformee et le fallback email. Le test crypto-vault verrouille notamment le fait
  qu'un JPEG ecrit sur disque ne commence pas par l'en-tete FF D8 (preuve du chiffrement).

### Build et packaging

electron-builder cible Linux uniquement : formats deb et AppImage, chacun produit pour
arm64 ET x64 (pas de mono-architecture). appId `com.dreamtech.smartmirror`, productName
`SmartMirror`. Publication via `provider: generic` sur l'URL `${UPDATE_SERVER_URL}`. Aucune
cible Windows ni macOS.

### Benchmarks technologiques documentes

- Electron vs Chromium kiosk : Chromium economise 300 a 500 Mo de RAM ; footprint RAM
  maitrise (reconstruit a ~1,3 a 2,2 Go depuis le code), 4 Go suffisent pour le MVP (cf.
  decision RAM, a valider par mesure 48 h), avec bascule documentee en repli.
- Electron vs Tauri : Tauri presente un footprint inferieur, mais Rust + WebKitGTK fait
  peser un risque sur le rendu glassmorphism (backdrop-filter) ; Electron retenu, Tauri
  documente comme voie de migration mesuree.
- PostgreSQL vs MySQL : PostgreSQL retenu pour JSONB, les types UUID/TEXT[] et l'isolation
  multi-tenant par `boutique_id` (requetes parametrees).
- Codecs : source microscope H.264 transcodee par ffmpeg en MJPEG pour la preview live
  (balise `<img>`, port 9100) ; snapshots JPEG pleine resolution pour l'analyse. AV1/H.266
  rejetes (pas de decodage materiel sur Pi 5).

---

## PARTIE 6 — Bilan et roadmap

### Roadmap priorisee

- Court terme : promotion en gate bloquant de l'audit de dependances apres remediation,
  ajout d'un seuil de couverture de tests en CI.
- Moyen terme : integration du CRM Laravel separe (Laravel 13, PHP 8.4, PostgreSQL 16 en
  cible), pgcrypto sur colonnes sensibles, securisation complete du backend.
- Long terme : evolution de la souverainete de l'IA (voir section dediee), accelerateur
  materiel local (Hailo) sous reserve d'un dataset trichoscopique labellise.

### Elements hors-scope post-MVP documentes

Workflows d'automatisation etendus, file et workers asynchrones, temps reel, scaling
horizontal (load-balancer, replicas), multi-region, monitoring par tenant.

### Bilan projet

Le MVP atteint ses criteres : perimetre une boutique / un tenant, isolation multi-tenant
operationnelle des le depart, chaine de seance complete fonctionnelle en conditions
offline-first.

---

# SECTIONS TRANSVERSES

## A) Mapping RNCP 37046 — BC01 a BC06

| Bloc | Preuves dans le projet |
|---|---|
| BC01 — Specifier / cadrer | CDCF complet (problematique, besoins, contraintes, 3 cibles, parcours seance) ; finalite cosmetique explicite (hors MDR) ; 10 regles de gestion RG-001 a RG-010 tracees vers TC-01 a TC-06 ; cadre RGPD. |
| BC02 — Concevoir l'architecture | Architecture en deux briques (device + back-office) plus services (proxy IA, proxy microscope) ; MCD 8 entites / 9 tables en base ; choix techniques justifies par benchmarks ; offline-first ; multi-tenant par `boutique_id` ; anticipation RGPD (chiffrement au repos, retention). |
| BC03 — Developper | Device structure (services main, IPC typee, contextBridge) ; backend mock Express + PostgreSQL 15 ; pipeline microscope WiFi/TCP JHCMD -> ffmpeg MJPEG -> preview `<img>` ; QR et PDF ; boitier 3D parametrique ; versioning Git ; durcissement Electron (sandbox, contextIsolation, CSP en production) ; chiffrement au repos AES-256-GCM (CryptoVault) des photos, de la file de sync et des tokens. |
| BC04 — Tester / mettre en production | 196 cas de test (60 unitaires Vitest dont crm-sync 18 + 136 e2e Playwright), 6 cas critiques ; CI GitHub Actions ; build electron-builder cross-architecture (deb + AppImage, arm64 et x64) ; OTA avec rollback ; systemd et kiosk durcis. |
| BC05 — Maintenir / faire evoluer | Veille CVE ; roadmap priorisee ; OTA electron-updater ; cadre Cyber Resilience Act (SBOM CycloneDX en place, non bloquant) ; gestion des secrets via variables d'environnement et `.env.example`. |
| BC06 — Piloter | Methodologie Merise Agile + TDD justifiee ; cycle en 5 phases ; priorisation ; hygiene du depot. |

## B) Securite (presentee comme une force — BC04 et BC05)

Mesures realisees et verifiables dans le code :
- Isolation Electron : `contextIsolation: true`, `nodeIntegration: false`, contextBridge
  propre, refus des fenetres externes (`setWindowOpenHandler` deny), `sandbox: true`, CSP
  appliquee en production.
- Chiffrement : photos (`.jpg.enc`), file de synchronisation et tokens (device.token,
  crmToken, crmBearerToken) chiffres au repos en AES-256-GCM via CryptoVault ; cle maitre
  resolue selon l'ordre environnement -> credentials systemd -> keyfile -> repli dev, avec
  exception levee en production en l'absence de cle.
- RGPD : consentement obligatoire cote API (refus HTTP 422 si absent ou revoque), retention
  des photos a 30 jours, vocabulaire medical proscrit, isolation multi-tenant par `boutique_id`.
- Gestion des dependances : 2 CVE hautes identifiees (Electron, fast-uri) suivies pour
  remediation ; audit en CI.

Points de vigilance documentes (cible) : securisation complementaire du backend, pgcrypto
sur colonnes sensibles, et surtout l'enjeu de confidentialite lie au transfert de la photo
vers le service d'analyse cloud (voir note RGPD ci-dessous).

## C) Souverainete de l'IA et confidentialite des donnees

### Etat realise (MVP)

- Chemin par defaut de l'application : le proxy IA du device (port 3001) est un mock. Les
  scores sont generes aleatoirement (`Math.random`), la latence simulee, le modele est une
  chaine litterale en dur. L'image recue n'est pas exploitee. Il n'existe aucune vision par
  ordinateur on-device : aucun OpenCV, aucune cascade Haar, aucune inference CPU locale.
- Service d'analyse IA reel : un second service (`crm/ia-service`, port 3002) realise un
  veritable appel reseau. Il envoie la photo JPEG complete encodee en base64 vers GitHub
  Models (plateforme Azure, hebergement US), en vision multimodale (`image_url`),
  authentifie par `GITHUB_TOKEN`, sur des modeles vision (Llama-3.2-11B-Vision,
  Phi-3.5-vision, gpt-4o-mini). Ce service est deploye cote serveur (CRM), pas sur le
  device. Le fournisseur reellement appele dans le code est GitHub Models / Azure, et non
  OpenRouter.

Consequence RGPD a documenter : dans le chemin d'analyse reel, la photo quitte le device
vers un cloud situe hors UE. La contrainte "flux local" s'applique au flux video temps
reel ; les snapshots d'analyse, eux, sont transmis. Ce transfert doit etre encadre
(consentement explicite, contrat de sous-traitance) et constitue le principal point de
vigilance de confidentialite.

### Roadmap de souverainete (trois versions, cible)

| Critere | V1 actuelle (cloud US) | V2 cloud souverain (Mistral UE) | V3 NPU local offline |
|---|---|---|---|
| Souverainete | Faible (hebergement US) | Elevee (editeur et hebergement UE) | Maximale (rien ne sort du miroir) |
| Dependance internet | Oui | Oui | Non |
| Type de sortie | Langage naturel | Langage naturel | Voie A : labels + scores ; Voie B : langage naturel |
| Cout materiel | Pi 5 seul | Pi 5 seul | + HAT NPU 70 a 130 EUR |
| Cout d'usage | ~0,002 EUR/analyse | fractions de centime a ~1 ct EUR | 0 EUR marginal |
| Statut RGPD | Transfert hors UE | Pas de transfert hors UE si endpoint EU + Zero Data Retention + DPA | Aucun traitement externe |

- V2 (Mistral AI, UE) : Mistral est une entreprise francaise, hebergement UE par defaut,
  routage US en option explicite, Zero Data Retention contractualisable via DPA. La gamme
  vision actuelle est Medium 3.5 / Large 3 / Ministral 3 (Pixtral etant deprecie depuis
  debut 2026). Cette option rend l'analyse substantiellement souveraine, sans etre 100%
  locale : l'image quitte toujours le miroir. La souverainete UE depend de la configuration
  (endpoint EU + ZDR active + DPA signe).
- V3 (NPU local sur Pi 5) : deux voies realistes. Voie A (defendable aujourd'hui) :
  classification CNN dediee sur Hailo-8 (par exemple "cuir chevelu sec / gras / pellicules /
  normal"), sortie en labels + scores, texte cosmetique genere par regles cote application,
  100% offline. Voie B (prospective) : VLM generatif local, possible seulement avec le tres
  recent Hailo-10H (AI HAT+ 2, janvier 2026) ou un petit VLM sur CPU a latence degradee. Un
  VLM generatif "diagnostic en langage naturel 100% local" n'est pas realiste sur
  Hailo-8/8L (limite SRAM : pas d'interface memoire externe).

### Note RGPD transversale

Une image de cuir chevelu a finalite cosmetique n'est en principe pas une donnee de sante
au sens de l'article 9 du RGPD, tant qu'aucune finalite medicale (diagnostic de pathologie)
n'est revendiquee. D'ou le cadrage strict "cosmetique, non medical" dans toute la
documentation et le code (vocabulaire medical proscrit, seuil de non-conclusion si la
confiance est inferieure a 60%).

## D) Optimisation (donnees, energie, materiel, budget)

Energie :
- Pi 5 sous Electron avec video : 5,7 a 6,8 W. Levier : ffmpeg `-r 15 -q:v 5` plafonne le
  decodage ; passer a `-r 10` reduirait CPU, consommation et temperature.
- Pas de mise en veille ecran (kiosk 24/7) : le retroeclairage domine le bilan energetique,
  arbitrage disponibilite > economie de veille assume.
- SoC entre 65 et 75 C, marge avant throttle (80 C) preservee par l'Active Cooler.

Materiel :
- Boitier en profil slim (29,3 mm) contre 40,7 mm avec HAT NVMe, soit -28% d'epaisseur en
  supprimant le M.2 HAT, sans perte thermique ; microSD au lieu de SSD.
- Un accelerateur Hailo occuperait le slot PCIe/M.2 (incompatible SSD NVMe simultane) et
  exigerait un dataset trichoscopique labellise : d'ou l'IA cloud en MVP.
- Le microscope WiFi mutualise capture video et bouton physique sur une seule interface :
  pas de GPIO, pas de cablage, BOM simplifiee.

Donnees :
- Retention : photos serveur 365 jours, photos locales 30 jours apres synchronisation, QR
  30 jours, logs 90 jours. Minimisation RGPD.
- Synchronisation incrementale par checksum SHA-256, cache medias < 2 Go, lecture du cache
  local.
- RAM miroir maintenue sous 6 Go sur 8 (gate non negociable Electron).

Budget :
- Materiel ~1 000 a 1 100 EUR/unite (ecran ~700 a 900 + ~250 a 290 hors ecran) ; l'ecran pese ~70 a 75 % du BOM, vraie variable de cout.
- OpEx 55 a 115 EUR/mois ; HDS ecarte (-150 a -400 EUR/mois) grace au cadrage cosmetique.
- IA cloud ~0,002 EUR/analyse : le cloud gagne au cout strict, l'on-device se justifie par
  la souverainete.

## E) Architecture offline-first (point fort BC02/BC03)

L'application est concue offline-first : `savePhotoLocally` ecrit la photo chiffree sur
disque puis l'ajoute a la file de synchronisation avant toute operation reseau. La file de
synchronisation est un fichier JSON chiffre (`/var/smart-mirror/sync-queue.json`), sans
broker (ni MQTT, ni Redis, ni AMQP). Le traitement de la file (`processQueue`) ne s'execute
que si le device est provisionne et reempile l'element en cas d'erreur reseau (retry).
Polling toutes les 30 s, heartbeat toutes les 60 s, purge des photos expirees (30 jours)
hors elements encore en file. Le device ne dialogue jamais directement avec la base
distante : il passe par le backend. Une seance peut donc se terminer entierement hors ligne.

Cote stockage local du device, il n'existe aucun SQLite : la persistance repose sur
electron-store (configuration), le fichier JSON chiffre de la file de synchronisation, et
les fichiers `.jpg.enc`. La seule base relationnelle du systeme est le PostgreSQL 15 du
serveur.

---

## Preparation orale — questions cles et reponses alignees

1. "Le flux video reste local mais l'analyse IA part dans le cloud, expliquez."
   Le flux video en direct du microscope reste 100% local. Seuls les snapshots JPEG sont
   transmis au service d'analyse IA reel (`crm/ia-service`, cote serveur), qui les envoie a
   GitHub Models (Azure, US). C'est un transfert hors UE encadre par consentement explicite
   et contrat de sous-traitance. La suppression totale du transfert passe par la souverainete
   V2 (Mistral UE) ou V3 (NPU local), documentees en roadmap.

2. "Montrez que les photos sont chiffrees localement."
   `savePhotoLocally` ecrit un fichier `.jpg.enc` produit par CryptoVault (AES-256-GCM,
   `crypto-vault.service.ts`) ; `config.service.ts` chiffre de la meme facon device.token,
   crmToken et crmBearerToken. Un test verrouille le fait que le fichier sur disque ne
   commence pas par l'en-tete JPEG FF D8.

3. "Diagnostic capillaire : est-ce un dispositif medical ?"
   Non. Finalite strictement cosmetique, aucune allegation therapeutique, vocabulaire
   medical proscrit cote code (RG-010), seuil de non-conclusion si confiance < 60%. Hors MDR
   et hors RGPD art. 9.

4. "Quel est l'etat de votre veille sur les dependances ?"
   Deux CVE hautes identifiees (Electron, fast-uri), suivies pour remediation. La CI execute
   un audit (bloquant au niveau critical/prod, observant au niveau high) et genere un SBOM
   CycloneDX. L'industrialisation continue avec la promotion progressive des controles en
   gates bloquants.

5. "Pourquoi Electron et pas Tauri ?"
   Tauri offre un meilleur footprint, mais Rust + WebKitGTK fait peser un risque sur le
   rendu glassmorphism. Electron retenu avec une gate RAM non negociable (<6 Go sur Pi 5),
   Tauri documente comme voie de migration mesuree.

6. "Quelle est votre couverture de tests ?"
   196 cas au total : 60 unitaires Vitest (api-client 14, config 14, crm-sync 18,
   crypto-vault 7, sync 7) sur 5 services, et 136 e2e Playwright sur 4 fichiers. La
   couverture unitaire vise 5 services sur 9 ; l'extension aux services restants est
   planifiee.

7. "Comment industrialisez-vous la qualite avant merge ?"
   CI GitHub Actions : audit de dependances (bloquant critical/prod), scan de secrets
   gitleaks (bloquant), plus SBOM CycloneDX et Semgrep en controle d'observation. La
   prochaine etape est la promotion de ces controles en gates et l'ajout d'un seuil de
   couverture.

8. "Que se passe-t-il si le reseau tombe en pleine seance ?"
   L'architecture est offline-first : la photo est chiffree et ecrite sur disque
   immediatement, la seance bufferisee, une file rejoue l'upload (30 s) et la synchronisation
   CRM (60 s). Le miroir parle a un backend local, jamais directement a la base distante. La
   seance se termine meme totalement hors ligne.

9. "Quelle est votre demarche de modelisation ?"
   Modelisation Merise (MCD 8 entites, MCT) au coeur de la methode Merise Agile, completee
   par les diagrammes UML demandes par le referentiel (cas d'usage, sequence du workflow
   seance, deploiement).

10. "Vous revendiquez une position de precurseur ?"
    Non. Le marche n'est pas vide : K-Scan (L'Oreal/Kerastase), BECON (coreen, Samsung),
    FotoFinder, Aram Huvis/ARAMO en analyse capillaire ; CareOS, HiMirror en miroir beaute.
    Je ne revendique aucun first-mover ; la differenciation tient a l'integration verticale
    (microscope WiFi + IA + CRM offline-first) et au suivi longitudinal relie au CRM Shopify,
    pour le creneau B2B institut K-Beauty.

11. "Le scaling a 100 salons tient-il ?"
    Le MVP cible une boutique, un tenant. L'isolation multi-tenant par `boutique_id` est en
    place des le depart. Le scaling horizontal est explicitement hors-scope MVP et documente
    en post-MVP.
