# RAPPORT DE MISE EN PLACE - PROJET DREAMTECH SMART MIRROR

## Feuille de route technique et preuve de gestion de projet (RNCP 37046)

> Document de pilotage projet, redige en tant que chef de projet senior.
> Sert a la fois de feuille de route operationnelle ET de piece justificative de gestion de projet (bloc BC06) pour le jury du titre RNCP 37046 "Chef de projet en solutions logicielles pour l'internet des objets (IoT)".
>
> Date de redaction : 2026-06-25
> Candidat : Adriano (B3, preparation examen CDA)
> Certificateur : FACILITYCERT (ex-ALGOSUP)
> Statut du document : version de cadrage, source de verite pour la sequence de travaux a venir.

---

## Sommaire

1. Resume executif
2. Titre vise, blocs de competences et couverture
3. CHANTIER 1 - Chiffrement P0 des donnees sensibles
4. CHANTIER 2 - Tests et mise en production (BC04)
5. CHANTIER 3 - Coherence documentaire (narratif unique MVP vs cible)
6. CHANTIER 4 - Nettoyage de l'arborescence et des fichiers .md
7. CHANTIER 5 - Roadmap stack cible (documentee, non codee)
8. Plan d'execution sequence (checklist cochable)
9. Risques et points de vigilance transverses
10. Annexe - Questions/reponses pieges pour l'oral

---

## 1. Resume executif

### 1.1 Etat actuel constate

Le projet DreamTech Smart Mirror est un miroir connecte IoT destine aux salons K-Beauty, realisant une analyse capillaire (cuir chevelu) assistee par IA. Le coeur fonctionnel est demontre et tourne reellement :

- une application Electron 33 / React 19 (kiosque tactile pour Raspberry Pi) ;
- un backend MOCK Express (server.js) exposant deux serveurs (API metier sur le port 8100, proxy IA mock sur le port 3001) ;
- une base PostgreSQL 15-alpine conteneurisee (Docker) avec 9 tables et une regle RGPD verrouillee cote schema (consentement obligatoire avant seance) ;
- un microscope capillaire branche en WiFi/TCP (192.168.34.1:8080, protocole JHCMD) dont le flux H.264 est transcode par ffmpeg en MJPEG servi sur localhost:9100 ;
- 34 tests unitaires Vitest verts et 136 cas e2e Playwright.

Quatre constats critiques motivent ce plan :

1. Des donnees personnelles potentiellement sensibles (photos de cuir chevelu) sont ecrites EN CLAIR sur le disque du device, et des secrets (tokens device/CRM) peuvent etre stockes en clair sur le Pi kiosk headless. C'est l'ecart le plus grave (P0, conformite art. 32 RGPD).
2. La couverture de tests est partielle et inegale : le service de synchronisation CRM (crm-sync.service.ts, 372 lignes, chemin critique) est a 0 test, le backend mock n'a aucun test d'integration, et la CI laisse passer les vulnerabilites (audit de dependances non bloquant).
3. La documentation se contredit elle-meme et contredit le code sur plusieurs axes (microscope decrit en USB alors qu'il est en WiFi, photos pretendues chiffrees alors qu'elles sont en clair, Redis/Laravel presentes comme en place alors qu'ils n'existent pas). Ces contre-verites sont un risque direct devant un jury qui lit le code.
4. L'arborescence du depot est polluee par 666 fichiers d'outillage IA (BYAN) et des artefacts transitoires, qui brouillent le message d'examen.

### 1.2 Ce que nous allons faire

Cinq chantiers, sans contrainte de temps, avec un objectif de qualite maximale et une approche prudente (archiver plutot que supprimer, corriger la doc vers le code et non l'inverse) :

- CHANTIER 1 - Chiffrement P0 : mettre en place un chiffrement applicatif AES-256-GCM des photos et des tokens cote device, durcir le stockage des secrets, securiser le backend mock (PDF, secrets en dur), documenter la defense en profondeur (LUKS, pgcrypto, gestion de cle), et couvrir tous les nouveaux chemins crypto par des tests.
- CHANTIER 2 - Tests et mise en production (BC04) : combler les trous de couverture (crm-sync en tete, integration backend, regle RGPD), rendre la CI reellement bloquante (audit deps, SAST, scan secrets), poser des seuils de couverture.
- CHANTIER 3 - Coherence documentaire : etablir un narratif unique et honnete "MVP realise vs cible roadmap", corriger les contre-verites (microscope WiFi, photos en clair, Redis cible, chiffres de tests reels).
- CHANTIER 4 - Nettoyage arborescence : sortir le bruit (BYAN, snapshots, exports Figma bruts) de la vue jury sans rien perdre, via une archive interne.
- CHANTIER 5 - Roadmap stack cible : documenter et justifier la stack cible (Laravel 13 / PostgreSQL 16 / Redis 7) avec un schema de migration credible, SANS ecrire de Laravel maintenant.

Decisions du candidat respectees a la lettre : on garde le backend reel (mock Express + PostgreSQL 15), on documente la cible en roadmap, on met en place le chiffrement (P0), on renforce BC04, on corrige la doc microscope, et le bloc BC06 (management d'equipe humaine) est volontairement mis de cote pour cette phase.

### 1.3 Resultat attendu

A l'issue de ces chantiers : aucune donnee personnelle ni secret persiste en clair sur le device de prod ; une CI qui echoue reellement sur une vulnerabilite ou une regression ; une documentation dont chaque affirmation est soit verifiable dans le code (etat MVP), soit explicitement etiquetee roadmap ; un depot propre et lisible pour le jury ; et une vision d'architecture cible maitrisee et argumentee. En termes de blocs, BC04 et BC05 passent de "partiels" a "consolides", BC03 est renforce, et la credibilite transverse du dossier est securisee.

---

## 2. Titre vise, blocs de competences et couverture

### 2.1 Titre vise

RNCP 37046 - "Chef de projet en solutions logicielles pour l'internet des objets (IoT)", niveau 6. Certificateur : FACILITYCERT (ex-ALGOSUP).

### 2.2 Les 6 blocs de competences

| Bloc | Intitule (synthese) | Etat de couverture | Chantiers contributeurs |
|------|----------------------|--------------------|--------------------------|
| BC01 | Analyser les specifications / le besoin | Solide | CHANTIER 3 (veille concurrentielle redevenue honnete) |
| BC02 | Concevoir l'architecture de la solution | Solide | CHANTIER 5 (architecture cible justifiee, schema de migration), CHANTIER 3 (UML aligne sur le code) |
| BC03 | Developper les composants logiciels | Solide | CHANTIER 1 (module crypto AES-256-GCM, refactor services), CHANTIER 2 (tests IPC, pipeline microscope) |
| BC04 | Tester et mettre en production | Partiel -> Consolide | CHANTIER 2 (couverture, CI bloquante, audit deps), CHANTIER 1 (tests crypto) |
| BC05 | Maintenir et faire evoluer | Partiel -> Consolide | CHANTIER 5 (roadmap, plan de bascule), CHANTIER 1 (runbook cles, rotation, retention RGPD) |
| BC06 | Piloter et manager les equipes | Mis de cote (decision candidat) | Aucun chantier planifie ; ce present rapport sert de preuve de pilotage de projet |

### 2.3 Lecture de la couverture

- BC01, BC02, BC03 sont deja solides. Les chantiers visent surtout a ne pas les fragiliser par des incoherences documentaires (CHANTIER 3) et a les enrichir de preuves concretes (module de chiffrement, tests).
- BC04 et BC05 sont les blocs partiels prioritaires. CHANTIER 1 et CHANTIER 2 les consolident directement (tests, CI bloquante, audit, runbook de maintenance, strategie d'evolution).
- BC06 (manager une equipe humaine) est explicitement mis de cote pour cette phase, par decision du candidat, qui l'integrera plus tard. Aucun chantier n'est planifie dessus. En revanche, ce present rapport - planification, sequencement, gestion des risques, tracabilite des decisions - constitue une piece de gestion de projet exploitable devant le jury au titre du pilotage.

### 2.4 Comment chaque chantier renforce les blocs (vue synthetique)

| Chantier | BC03 | BC04 | BC05 | BC02 / BC01 |
|----------|------|------|------|-------------|
| 1 - Chiffrement P0 | Module crypto, refactor | Tests crypto, CI bloquante | Runbook cles, rotation, retention | - |
| 2 - Tests / mise en prod | Tests IPC, microscope | Couverture, CI, audit, integration | Filet anti-regression | - |
| 3 - Coherence doc | Code decrit fidelement | Chiffres de tests honnetes | Addendum date, roadmap | Veille honnete (BC01), UML aligne (BC02) |
| 4 - Nettoyage | - | - | Depot maintenable | Dossier lisible (BC01) |
| 5 - Roadmap cible | - | Trou de couverture identifie | Trajectoire d'evolution | Architecture justifiee (BC02) |

---

## 3. CHANTIER 1 - Chiffrement P0 des donnees sensibles

### 3.1 Objectif

Eliminer les deux fuites P0 confirmees cote device et corriger les expositions cote backend mock. Objectif final : aucune donnee personnelle ni secret persiste en clair sur le device de prod ; chiffrement applicatif AES-256-GCM authentifie pour les photos et les tokens ; defense en profondeur documentee ; conformite art. 32 RGPD pour des donnees potentiellement de sante ; couverture de tests sur les nouveaux chemins crypto (aujourd'hui 0 test). On garde la stack reelle (mock Express + PostgreSQL 15) ; la cible Laravel/Redis reste en roadmap.

### 3.2 Tableau des donnees actuellement en clair (avec fichier:ligne)

#### Donnees et secrets cote DEVICE

| Donnee / secret | Fichier:ligne | Format au repos | Chiffre ? | Priorite |
|-----------------|---------------|-----------------|-----------|----------|
| Photo cuir chevelu (donnee personnelle / potentiellement de sante) | sync.service.ts:56-61 (writeFileSync) ; fallback dev l.68 | Fichier .jpg binaire brut, nom `${Date.now()}-${phase}.jpg` | NON | P0 |
| File d'attente de synchronisation (localPath, seanceId, phase, createdAt) | sync.service.ts:98-105 ; QUEUE_FILE l.7 | JSON en clair (chemins disque + ID seance) | NON | P0 (defense en profondeur) |
| Configuration device (id, boutiqueId, macAddress, token, crmToken, crmBearerToken, URLs) | config.service.ts:69-73 (electron-store v8.2, sans encryptionKey) | JSON en clair ; seul device.token est pre-chiffre safeStorage | NON (crmToken/crmBearerToken en clair dans tous les cas) | P0 |
| device.token | Ecriture config.service.ts:167-173 ; lecture 113-126 | safeStorage SI dispo, SINON PLAINTEXT explicite (l.170-172) | PARTIEL (fallback plaintext sur Pi headless) | P0 |
| api.crmToken | config.service.ts:46,101-104 (process.env.CRM_TOKEN) | electron-store en clair, jamais via safeStorage | NON | P0 |
| api.crmBearerToken | config.service.ts:109-111 ; persiste crm-sync.service.ts:67-69 | electron-store en clair | NON | P0 |
| Mot de passe WiFi | wifi.service.ts:68-71 (exec nmcli ...password) | Non persiste par l'app, mais injecte en clair en shell (ps/injection) ; hotspot 'smartmirror' en dur l.92 | N/A | P1 |
| Etat updater (crashCount, versions, bootTime) | updater.service.ts:14-22 | JSON en clair (non sensible) | NON | Documente pour exhaustivite |
| Cache media (marketing boutique) | media-cache.service.ts:137-143 | Binaire brut, non personnel | NON | Faible sensibilite |

#### Donnees et secrets cote BACKEND MOCK

| Donnee / secret | Fichier:ligne | Format au repos | Chiffre ? | Priorite |
|-----------------|---------------|-----------------|-----------|----------|
| Rapport PDF de seance (nom/email client, diagnostic IA, notes) | server.js:308-388 ; RAPPORTS_DIR l.10 ; static l.296 | PDF en clair `${seanceId}.pdf`, servi publiquement SANS auth | NON | P0 |
| Donnees clientes (prenom, nom, email, telephone, date_naissance, sexe, notes) + consentements + seances + photos (chemin + diagnostic_ia) | init.sql:15-30, 32-40, 54-68, 70-83 | Colonnes TEXT/JSONB en clair, aucun pgcrypto | NON | P0 (champs sensibles) |
| device_token miroir | server.js:34 (generation) ; init.sql:46 | Colonne TEXT en clair, non hachee, renvoyee telle quelle (server.js:67) | NON | P1 |
| Mot de passe PostgreSQL + shopify_access_token | docker-compose.yml:7,31 ; init.sql:11 ; server.js:18 (defaut 'smartmirror_dev') | Secrets en dur dans le versioning | NON | P1 |

### 3.3 Approche retenue : defense en profondeur sur deux niveaux

#### Pourquoi pas safeStorage seul

Sur Pi 5 kiosk headless, sans session de bureau (pas de gnome-keyring/kwallet, pas de D-Bus Secret Service deverrouille), safeStorage retombe sur le backend `basic_text`, qui "chiffre" avec une cle codee en dur ('peanuts'). C'est de l'obfuscation, pas du chiffrement : equivalent a du plaintext face a un attaquant disque hors-ligne. Pire, le code actuel ecrit le token EN CLAIR si `isEncryptionAvailable()` est faux. safeStorage est donc degrade au rang de couche optionnelle, utilisable uniquement si `getSelectedStorageBackend() !== 'basic_text'`.

#### DEVICE - le coeur de la correction

Un module de chiffrement applicatif AES-256-GCM natif Node (crypto), independant du trousseau/D-Bus donc fiable en headless. Il chiffre a la fois les buffers JPEG des photos ET les tokens, avec IV aleatoire 96 bits par message et tag d'authentification 128 bits. La cle maitre 256 bits n'est jamais en dur : injectee via systemd-creds (LoadCredentialEncrypted, liee TPM2/installation OS) avec fallback documente keyfile root 0600 hors du repertoire app. On supprime la branche plaintext et on cesse d'ecrire les photos en clair. LUKS2 sur partition data reste une couche de base documentee (vol/perte du Pi en salon, AES materiel Pi 5), sans code.

Pourquoi AES-256-GCM applicatif plutot que safeStorage : independant du trousseau (fiable sans session graphique), authentifie (detecte toute alteration via le tag GCM), couvre aussi les buffers JPEG, et permet le crypto-shredding (effacement selectif par destruction de cle) pour le droit a l'effacement RGPD.

#### BASE / BACKEND - stack reelle conservee

Securiser le PDF (retirer le static public, servir derriere auth, nettoyer /tmp/rapports), activer pgcrypto sur les colonnes les plus sensibles (email, telephone, date_de_naissance), hacher les device_token en base (ne plus renvoyer le token brut), sortir les secrets du repo (variables d'env + .env.example, .env gitignore). Cible documentee en roadmap : object storage chiffre pour les photos, chiffrement de volume hebergeur, hebergement HDS UE/EEE.

#### TOKENS

Application de T1 (ne plus jamais ecrire le token en clair) + T2 (AES-256-GCM via le module crypto) comme barriere reelle ; safeStorage en couche optionnelle uniquement.

### 3.4 Etapes detaillees

| # | Titre | Fichiers | Type |
|---|-------|----------|------|
| 1 | Creer le module crypto AES-256-GCM (crypto-vault) : encryptBuffer/decryptBuffer, encryptString/decryptString, format `[version 1o || IV 12 || authTag 16 || ciphertext]`, cle maitre lue une fois via CREDENTIALS_DIRECTORY (systemd) puis keyfile root 0600 (MASTER_KEY_FILE), sinon throw explicite. Singleton, jamais de log de cle/plaintext. | crypto-vault.service.ts (nouveau) | Creer |
| 2 | Chiffrer les photos au repos (fuite P0 #1) : remplacer writeFileSync par encryptBuffer dans savePhotoLocally ; extension cible .jpg.enc ; adapter cleanupExpiredPhotos (l.145) ; cote lecture, dechiffrer dans pushPhotoCrm (crm-sync l.258) avant le Blob multipart. | sync.service.ts, crm-sync.service.ts | Modifier |
| 3 | Chiffrer les tokens et supprimer la branche plaintext (fuite P0 #2) : supprimer la branche else l.170-173 de provision() ; router getDeviceToken / getCrmToken / setCrmBearerToken / getCrmBearerToken via le module crypto ; safeStorage seulement si backend != basic_text ; documenter pourquoi basic_text == non chiffre. | config.service.ts, crm-sync.service.ts | Modifier |
| 4 | Chiffrer la file de synchronisation au repos (defense en profondeur) : passer saveQueue/getQueue par encryptString/decryptString ; chemin de migration (relire en clair une fois si ancien format, puis reecrire chiffre) pour ne pas perdre la file en attente. | sync.service.ts | Modifier |
| 5 | Ne plus passer le mot de passe WiFi en argument shell (P1) : remplacer exec par execFile('nmcli', [...]) sans interpolation ; idealement profil NetworkManager temporaire ; retirer le hotspot 'smartmirror' en dur (genere aleatoirement et affiche au provisioning). | wifi.service.ts | Modifier |
| 6 | Securiser le PDF et sortir les secrets du repo (backend) : retirer le static public sur RAPPORTS_DIR ou le placer derriere auth ; hacher device_token (sha256/bcrypt) ; sortir POSTGRES_PASSWORD/DB_PASSWORD et le defaut 'smartmirror_dev' vers process.env + .env.example ; .env gitignore. | server.js, docker-compose.yml, .env.example | Modifier |
| 7 | Chiffrement au niveau colonne (pgcrypto) : CREATE EXTENSION pgcrypto ; chiffrer email/telephone/date_de_naissance des clientes et shopify_access_token cote app (cle hors requete SQL). Compromis a documenter sur UNIQUE(email, boutique_id) : hash deterministe pour l'unicite + valeur chiffree pour la lecture, ou email en clair sous protection volume + chiffrement des autres champs. Photos hors base. | init.sql, server.js | Modifier |
| 8 | Tests unitaires sur tous les nouveaux chemins crypto (BC04) : crypto-vault (round-trip, rejet sur tag altere, IV unique, throw si pas de cle) ; sync (le fichier ecrit ne commence PAS par les magic bytes JPEG FFD8) ; config (plus de branche plaintext, tokens chiffres) ; premier test crm-sync (bearer chiffre persiste et recharge dechiffre). | crypto-vault.service.test.ts (nouveau), sync.service.test.ts, config.service.test.ts, crm-sync.service.test.ts (nouveau) | Creer |
| 9 | Durcir la CI : retirer continue-on-error de l'etape audit (SCA) pour la rendre bloquante ; Semgrep bloquant au moins sur p/secrets ; test:coverage couvre crypto-vault. | .github/workflows/ci.yml | Modifier |
| 10 | Documenter cles, runbook LUKS/systemd-creds, retention RGPD, encadrement OpenRouter (ZDR + EU in-region + SCC) ou minimisation, rappel HDS ; corriger les reponses fausses de DEFENSE-JURY. | (doc projet) | Documenter |

### 3.5 Implications RGPD / HDS

- Qualification : une photo de cuir chevelu analysee pour diagnostiquer l'etat capillaire peut reveler des informations sur l'etat de sante (art. 9 RGPD, categorie particuliere). Le risque de requalification en donnee de sante impose un niveau de protection eleve : chiffrement au repos + en transit, minimisation, conservation limitee.
- Etat actuel non conforme : photos ecrites en clair (sync.service.ts:56-78) et token potentiellement en clair (config.service.ts:170-173). Le chiffrement au repos est une mesure technique attendue (art. 32). Ecart P0 a corriger en priorite.
- Hebergement HDS : si les donnees sont qualifiees donnees de sante, l'hebergement doit etre assure par un hebergeur certifie HDS, avec stockage exclusivement sur le territoire UE/EEE ; tout transfert hors UE/EEE n'est possible que sous conditions du chapitre V (decision d'adequation ou garanties art. 46 / SCC), cartographie et publie.
- Transfert OpenRouter (US) : envoyer la photo a OpenRouter route vers des fournisseurs US constitue un transfert hors UE de donnee potentiellement sensible. A encadrer : politique Zero Data Retention, routage EU in-region (offres enterprise), garanties contractuelles (SCC). Sans cela, transfert difficilement justifiable pour de la donnee de sante.
- Minimisation / conservation : flouter/recadrer pour ne transmettre que la zone utile, transmettre des features plutot que l'image brute si possible, retention courte (cleanupExpiredPhotos, sync.service.ts:42 - a documenter et tester comme mesure RGPD).
- Consentement : deja exige avant seance (init.sql FK consentement_id NOT NULL ; server.js refuse la seance sans consentement). Le consentement doit couvrir explicitement l'analyse par IA et le transfert hors UE.
- Droit a l'effacement / integrite : le chiffrement applicatif par photo (AES-256-GCM) facilite le crypto-shredding et garantit l'integrite (tag GCM), deux atouts pour l'art. 32 et les droits des personnes.

### 3.6 Tests de validation (criteres d'acceptation)

- crypto-vault.service.test.ts vert : round-trip buffer et string, throw sur tag altere, IV unique entre deux chiffrements, throw si aucune cle maitre (pas de degrade silencieux).
- sync.service.test.ts : le fichier photo ecrit ne contient pas les magic bytes JPEG FFD8 et le dechiffrement redonne le buffer original ; sync-queue.json non lisible en JSON clair.
- config.service.test.ts : la branche plaintext de provision() n'existe plus ; getDeviceToken/getCrmToken/getCrmBearerToken ne renvoient le clair qu'apres dechiffrement, le store contient du ciphertext.
- crm-sync.service.test.ts (nouveau) : authenticate() persiste un bearer chiffre et le recharge dechiffre (l.29).
- Inspection disque : grep des magic bytes JPEG sur /var/smart-mirror/photos et lecture de smart-mirror-config.json -> aucun token ni JPEG en clair.
- mock-api : /api/rapports/<id>.pdf retourne 401/403 sans auth ; device_token stocke en hash ; git grep smartmirror_dev = 0 hit hors .env.example.
- CI : l'etape audit fait echouer le build sur une vuln high injectee de test ; test:coverage inclut crypto-vault.
- Les 34 tests unit existants restent verts ; les 136 e2e passent apres adaptation (PDF derriere auth).
- RGPD : cleanupExpiredPhotos teste comme mesure de retention (photo > 30 jours et hors file = supprimee).

### 3.7 Risques specifiques au chantier

- Gestion de cle = maillon faible : keyfile root 0600 sans TPM reste lisible par root et hors-ligne ; le Pi 5 n'a pas de fTPM standard (HAT TPM requis). Documenter le compromis choisi.
- Reutilisation d'IV interdite : randomBytes(12) par message imperatif ; ne jamais deriver l'IV d'un compteur partage.
- Migration des donnees existantes : photos, sync-queue.json et device.token deja en clair doivent etre migres (relire puis reecrire chiffre).
- Rotation de cle : prevoir une procedure de re-chiffrement avant tout changement de cle en prod.
- pgcrypto et UNIQUE(email) : le chiffrement non-deterministe casse l'unicite et l'indexation ; trancher hash deterministe vs chiffrement avant d'appliquer.
- safeStorage peut throw sur Electron recent : encadrer de try/catch.
- Retrait du static /api/rapports : peut casser des appels existants (crm-sync, e2e) ; verifier les 136 e2e.
- npm audit bloquant : faire le fix d'abord (sinon CI rouge sur des vulns preexistantes).
- Perf Pi 5 : mesurer la latence avant/apres sur le chemin de capture.

---

## 4. CHANTIER 2 - Tests et mise en production (BC04)

### 4.1 Objectif

Renforcer BC04 en comblant les trous de couverture critiques (crm-sync 0%, backend mock 0%, regle RGPD non verrouillee), en transformant la CI permissive (audit/SAST en continue-on-error) en pipeline qui ECHOUE reellement sur une vulnerabilite ou une regression, et en alignant le discours jury sur la realite mesurable. But : chaque affirmation BC04 prouvee par un test vert et un job CI bloquant.

### 4.2 Couverture actuelle

| Fichier de test | Type | Nb tests | Cible |
|-----------------|------|----------|-------|
| api-client.service.test.ts | Unitaire Vitest (fetch stubbe) | 14 | api-client.service.ts (registerDevice, clientes, consentements, seances, analyzePhoto, sync, heartbeat, erreurs HTTP) |
| config.service.test.ts | Unitaire (mocks electron) | 13 | config.service.ts (provision, getDeviceToken cas fallback PLAINTEXT teste, displayConfig...) ; branche safeStorage chiffree NON testee |
| sync.service.test.ts | Unitaire (fs mocke) | 7 | sync.service.ts (getQueueSize, savePhotoLocally + fallback EACCES) ; contenu chiffre NON teste |
| qa-complete.spec.ts | e2e Playwright (_electron.launch) | 65 | Parcours UI Electron ; NON CI (display/binaire) |
| qa-senior-vm.spec.ts | e2e via CDP (9222) | 42 | VM Debian externe ; NON CI |
| vm-qa.spec.ts | e2e via CDP (9222) | 15 | VM Debian + tunnel SSH ; NON CI |
| mirror-qa.spec.ts | e2e (_electron.launch) | 14 | QA miroir local ; NON CI |

Total : 34 unitaires (3 fichiers) + 136 e2e (4 fichiers) = 170 cas. Le README annonce a tort "65+ tests".

### 4.3 Lacunes identifiees

| Element | Fichier | Priorite |
|---------|---------|----------|
| crm-sync.service.ts a 0 test (authenticate, checkOnline, syncAll, pushTocrm, pushPhotoCrm, syncSessionNow, cleanupSynced) - tire la couverture vers le bas | crm-sync.service.ts (372 l) | P0 |
| Chiffrement non verifie par les tests (anti-regression photos + branche safeStorage chiffree du token) | sync.service.test.ts, config.service.test.ts | P0 |
| Aucun test d'integration backend mock-api (regle RGPD "pas de seance sans consentement" non verrouillee) | server.js | P0 |
| Services main non testes : microscope (coeur IoT), wifi, media-cache, updater | services/ | P1 |
| ipc/handlers.ts non teste (frontiere de securite main<->renderer) | handlers.ts (371 l) | P1 |
| Aucun test des ecrans/store du renderer (session.store, ConsentScreen RGPD) | renderer/src/ | P1 |
| Pas de seuils de couverture configures | vitest.config.ts | P1 |
| Ecart "65+ tests" annonce vs reel | README | P2 |

### 4.4 Etat de la CI (.github/workflows/ci.yml)

Etapes presentes (job mirror-app, ubuntu-latest, node 20) : npm ci [bloquant], typecheck [bloquant], lint [bloquant], test:coverage [bloquant], build [bloquant], npm audit --audit-level=high [NON bloquant, continue-on-error l.41], SBOM CycloneDX [NON bloquant], upload artifacts ; job semgrep [NON bloquant l.65 malgre --error].

Manques majeurs : audit SCA non bloquant (contradiction avec BC04), Semgrep non bloquant, aucun e2e en CI, aucun test d'integration backend, aucun seuil de couverture, aucun DAST, aucun scan d'image conteneur, aucun scan de secrets bloquant, pas de matrice multi-arch (cible Pi), pas de protection de branche.

### 4.5 Plan d'ajout de tests et de durcissement CI (3 vagues)

Principe de sequencement : on ecrit d'abord les tests qui verrouillent les regles metier/securite, PUIS on rend la CI bloquante (sinon elle casse immediatement sur l'existant). On reutilise systematiquement le pattern de mock existant (fetch stubbe, fs mocke).

#### Vague P0 - preuve et non-regression de base

| # | Action | Fichiers cles |
|---|--------|---------------|
| 1 | Tests unitaires crm-sync.service.ts (le plus gros trou : 372 l a 0%). Couvrir methode par methode nominal + erreur reseau + token expire (401). | crm-sync.service.test.ts (nouveau) |
| 2 | Tests d'integration backend mock-api (supertest + pg-mem ou service postgres CI) verrouillant "pas de seance sans consentement valide" (server.js ~166-185) : sans consentement_id -> 422 ; consentement revoque -> 422 ; valide -> 201. Attention aux routes reelles /api/... | mock-api/test/server.integration.test.js, mock-api/package.json |
| 3 | Tests anti-regression chiffrement (depend du CHANTIER 1) : le buffer ecrit n'est pas le JPEG brut (pas de FFD8) ; branche safeStorage chiffree du token. | sync.service.test.ts, config.service.test.ts |
| 4 | npm audit fix PUIS bascule de l'etape audit en bloquante (retirer continue-on-error). Ordre imperatif. Gate avec exceptions documentees pour les CVE non corrigeables. | ci.yml, package-lock.json |
| 5 | Semgrep bloquant sur regles critiques + scan de secrets bloquant (gitleaks). .semgrepignore documente, montee progressive. | ci.yml, .semgrepignore |

#### Vague P1 - largeur de couverture + gardes

| # | Action | Fichiers cles |
|---|--------|---------------|
| 6 | Seuils de couverture (coverage.thresholds, ex. 70% au depart) APRES etapes 1/3. Etendre coverage.include a src/main/ipc/**. | vitest.config.ts |
| 7 | Tests des 4 services main non couverts (priorite microscope = coeur IoT WiFi/TCP->ffmpeg->MJPEG, getStreamUrl/captureSnapshotAsync/health, pas USB/UVC), puis wifi, media-cache, updater. | microscope.service.test.ts, etc. |
| 8 | Tests renderer via projet vitest jsdom distinct (session.store, ConsentScreen RGPD). Installer jsdom + @testing-library/react. | session.store.test.ts, vitest.config.ts |
| 9 | Tests de la frontiere IPC (handlers.ts) + extension du perimetre coverage. | handlers.test.ts |
| 10 | Job e2e-smoke en CI : specs _electron.launch sous xvfb-run (--no-sandbox). Etiqueter les specs VM/CDP comme "manuels post-publication". | ci.yml, playwright.config.ts |
| 11 | Cabler le job d'integration backend dans la CI (service postgres ou pg-mem) + brancher npm test mock-api, bloquant. | ci.yml, mock-api/package.json |

#### Vague P2 - honnetete documentaire + securite avancee

| # | Action | Fichiers cles |
|---|--------|---------------|
| 12 | Scan d'image conteneur (Trivy/Grype) sur mock-api/Dockerfile, bloquant high/critical. | ci.yml, Dockerfile |
| 13 | DAST leger OWASP ZAP baseline contre le mock-api (non bloquant au depart, rapport en artefact ; pentest manuel en roadmap). | ci.yml |
| 14 | Correction HONNETE du decompte de tests (vs "65+") + retrait des assertions fausses de DEFENSE-JURY. | README, DEFENSE-JURY.md |
| 15 | Protection de branche main (required status checks : typecheck/lint/test/build/audit/semgrep/integration). | ci.yml, docs/ci-branch-protection.md |

### 4.6 Validation BC04

- test:coverage vert en CI avec crm-sync passant de 0% a une couverture significative (7 chemins critiques exerces).
- Mutation test manuel : commenter le garde-fou consentement de server.js doit faire passer un test au rouge (preuve que la regle RGPD est reellement verrouillee).
- Test chiffrement : contenu ecrit sans FFD8 ; les deux branches du token couvertes.
- CI : une PR avec CVE high fait echouer le job audit ; un secret/faille Semgrep critique fait echouer le job semgrep.
- Les coverage.thresholds cassent la CI sur une regression de couverture.
- Job e2e-smoke vert sous xvfb sans VM externe ; specs VM/CDP exclues du run CI.
- Decompte de tests dans la doc == sortie reelle de vitest + nb de specs Playwright.
- Protection de branche : merge bloque sur un check rouge.

---

## 5. CHANTIER 3 - Coherence documentaire (narratif unique MVP vs cible)

### 5.1 Objectif

Instaurer UN SEUL narratif coherent et honnete, aligne sur le code reellement verifie. Aujourd'hui les documents se contredisent entre eux ET contredisent le code sur 6 axes recurrents (microscope, chiffrement, backend, Redis/queues, versions/ports, chiffres de tests), plus les concurrents et des gaps securite perimes. But : chaque affirmation est soit VRAIE (etat MVP), soit explicitement etiquetee ROADMAP/CIBLE, jamais une cible presentee comme realisee.

### 5.2 Methode en 4 temps

1. Etablir une SOURCE DE VERITE unique (encart "Etat reel vs Cible").
2. Corriger d'abord les documents de soutenance directe (DEFENSE-JURY, README, PROJET-MVP).
3. Harmoniser les livrables d'analyse (UML, veille, SWOT, PESTEL, devis, gestion) qui pretendent a tort "USB UVC par defaut (conforme au code)".
4. Dater/versionner les documents d'audit perimes (FACT-CHECK, DOSSIER) et neutraliser les specs obsoletes.

Regle d'or transverse : distinguer typographiquement REALISE (MVP) de CIBLE (roadmap) partout.

### 5.3 Liste des corrections par fichier:ligne (extrait operationnel)

| Fichier | Ligne(s) | Claim faux | Correction |
|---------|----------|------------|------------|
| README.md | 3, 54, 67, 101-104, 126-128 | Microscope "USB UVC / V4L2 / stream.py Python" | Microscope WiFi (TCP 192.168.34.1:8080, JHCMD -> ffmpeg H.264->MJPEG -> proxy.js:9100) ; supprimer python3 stream.py |
| README.md | 50, 51, 23-24, 86 | "PostgreSQL 16, Redis 7", mock API :8000 | PostgreSQL 15, supprimer Redis 7 et :6379, port mock 8100 ; Laravel = cible |
| README.md | 18, 24, 86 | "IA Service :3002" | :3001 (docker-compose MOCK_IA_PORT) |
| README.md | 52, 53 | "GitHub Models API", "Llama 3.2 -> Phi 3.5 -> GPT-4o mini" | OpenRouter (cible), defaut Gemini Flash 1.5, fallbacks GPT-4o mini puis Claude 3.5 Haiku |
| README.md | 57, 171 | "65+ tests" | 170 cas (34 unit Vitest + 136 e2e Playwright), 3/8 services en unitaire, crm-sync non teste |
| docs/DEFENSE-JURY.md | 11, 101-103, 173-175, 187 | "microscope USB (UVC/V4L2)", "deconnexion USB" | WiFi/TCP JHCMD -> MJPEG HTTP ; health-check reseau localhost:9100 ; retirer l'argument "navigateur ne peut pas lire l'USB" (faux) |
| docs/DEFENSE-JURY.md | 25-35, 183 | "queues Redis", "Pourquoi Redis" presente comme realise | Redis = CIBLE (file JSON poll 30s aujourd'hui) |
| docs/DEFENSE-JURY.md | 157-159 | "photos chiffrees safeStorage" | Photos en CLAIR (sync.service.ts:61) ; seul le device token via safeStorage avec fallback plaintext ; chiffrement photos = P0 |
| docs/DEFENSE-JURY.md | 201-203 | "soit apps mobiles, soit dispositifs medicaux hors de prix" (implique aucun concurrent) | Nommer K-Scan, BECON/Samsung, FotoFinder, ARAMO, CareOS, HiMirror ; differenciation par integration verticale |
| docs/PROJET-MVP.md | 11, 71-78, 85-91 | "Ninyoon 4K USB UVC", "Capture Python V4L2", "Microscope USB -> stream.py" | Microscope WiFi TCP 8080 JHCMD, ffmpeg H.264->MJPEG :9100 |
| docs/PROJET-MVP.md | 44, 47, 227-228, 295 | "Cache/Queues Redis 7", "Laravel Reverb" en stack actuelle | Retirer du tableau actuel ; conserver en Post-MVP uniquement |
| docs/PROJET-MVP.md | 34 | Ecran "Bienvenue" inexistant | Aligner sur fichiers reels (Accueil + Home distincts) |
| docs/PROJET-MVP.md | 59, 243 | "GitHub Models API" | OpenRouter (cible) ; IA = mock en MVP |
| CDC_DreamTech.md | 47, 557, 563, 643, 651 | "aucun concurrent / first-mover advantage" | Differenciation par integration verticale + tableau concurrents |
| CDC_DreamTech.md | 408-413, 428 | "Cloud datacenter europeen", "chiffrement au repos" | Snapshots envoyes hors UE (OpenRouter US) -> Chapitre V ; chiffrement photos non tenu (en clair sync.service.ts:61), P0 |
| docs/livrables/05-uml-diagrammes.md | 73, 84, 107, 118, 125, 134 | "Proxy microscope (USB UVC)", "USB UVC par defaut (conforme au code)" | WiFi TCP 8080 JHCMD -> ffmpeg MJPEG ; retirer "conforme au code" associe a l'USB (inverse la realite) |
| docs/livrables/02-veille-concurrentielle.md (+ pestel, swot, gestion, devis) | 35, 36, 44, 50 | "USB UVC par defaut (conforme au code)" | V1 = WiFi (proxy.js) ; USB UVC = option non implementee |
| docs/livrables/01-swot-kbeauty.md (+ pestel, devis) | 16, 33 | "sandbox desactive (index.ts:51)", "CSP absente" | DEJA corriges : sandbox:true (index.ts:51), CSP prod (index.ts:121-143) |
| docs/livrables/03bis-devis-budget-tco.md (+ gestion, swot) | 21, 109 | "manquent CI, coverage, playwright.config, ESLint flat" | CI, playwright.config et coverage EXISTENT ; ne garder que verif npm run lint + audit bloquant |
| docs/FACT-CHECK-RNCP.md | 63, 64, 132, 208, 211 | "sandbox:false", "Aucune CSP" REFUTE | Addendum date : sandbox:true et CSP prod desormais en place ; conserver REFUTE pour photos chiffrees/concurrents/H.264/Redis/stack obsolete |
| docs/DOSSIER-CONNAISSANCE-RNCP.md | 127, 134, 137-138, 199 | "sandbox:false, CSP absente", "3 services sur 9", "~35 cas" | Retirer sandbox/CSP des gaps ; harmoniser "34 unitaires, 3/8 services" |
| smart_mirror_specs_techniques.md | 66, 94, 191-216, 223, 350-359, 423-438 | "H.264 hardware", "USB 3.0 /dev/video* UVC", "Supabase Storage", stack Bun/Hono/Supabase | En-tete "partiellement obsolete" ; corriger codec (HEVC hardware seul sur Pi 5), pipeline WiFi MJPEG, supprimer Supabase |

### 5.4 Encart canonique "Etat reel (MVP) vs Cible (roadmap)"

A placer en tete de README et referencer depuis les autres docs. Faits verifies :

- BACKEND REALISE = mock Express server.js (API metier :8100, IA mock :3001) + PostgreSQL 15-alpine, SQL brut via pg ; zero Laravel/Sanctum/Redis/ORM.
- IA REALISEE = MOCKEE (server.js:514-545 scores Math.random + commentaire en dur, modele cosmetique 'google/gemini-flash-1.5', aucun appel OpenRouter reel).
- MICROSCOPE REALISE = WiFi/TCP 192.168.34.1:8080, handshake JHCMD, H.264 transcode ffmpeg -> MJPEG localhost:9100 (proxy.js) ; USB/UVC/V4L2 = vestiges morts.
- SYNC REALISE = fichier JSON /var/smart-mirror/sync-queue.json poll 30s, heartbeat 60s ; pas de broker.
- CHIFFREMENT REALISE = uniquement device.token via safeStorage AVEC fallback plaintext (config.service.ts:116-123,167-173) ; photos EN CLAIR (sync.service.ts:61) ; token CRM en clair.
- SECURITE REALISEE = sandbox:true (index.ts:51) + CSP en prod (index.ts:121-143).
- TESTS REALISES = 34 unit Vitest (3 fichiers) + 136 e2e Playwright = 170 cas ; 3/8 services main couverts ; crm-sync.service.ts (372 l) = 0 test.
- CIBLE/ROADMAP (a etiqueter explicitement) : Laravel 13/PHP 8.4 + Sanctum, PostgreSQL 16, Redis 7, IA reelle OpenRouter, Shopify, n8n, audit deps CI bloquant, chiffrement P0 des photos.

### 5.5 Validation (grep transverses)

- `USB UVC|/dev/video|V4L2|stream\.py` : plus aucun hit hors mention explicite "vestige mort" / "option non implementee".
- `Redis 7|:6379|queues Redis|Laravel Reverb` : tout hit en contexte CIBLE/roadmap uniquement.
- `:3002|:8000|PostgreSQL 16|GitHub Models|Llama 3\.2|Phi 3\.5` : zero hit non corrige.
- `photos? (sont )?chiffrees|chiffrees (en local|via safeStorage)` : zero hit affirmant le chiffrement des photos.
- `aucun concurrent|first-mover` : zero hit dans CDC_DreamTech et DEFENSE-JURY.
- `sandbox\s*:?\s*false|sandbox desactive|CSP absente` : zero hit presente comme gap actuel.
- `65\+` : 0 hit ; toutes les mentions disent "34 unit + 136 e2e".
- Valeurs uniques propagees : une seule version Laravel cible (13/PHP 8.4), un seul grossissement/marque microscope, un seul decompte d'ecrans, un seul denominateur tests (3/8 services).

---

## 6. CHANTIER 4 - Nettoyage de l'arborescence et des fichiers .md

### 6.1 Strategie : "archiver plutot que supprimer"

Aucun fichier d'examen ne doit etre perdu. Principe de non-destruction : on cree un dossier d'archive interne `docs/_archive/` qui sort les fichiers de la "vue jury" sans les detruire ; ajoute au .gitignore. La suppression est reservee au vrai dechet strictement reproductible et sans valeur (sorties de tests vides, doublons binaires-identiques d'un fichier conserve ailleurs).

Contexte : 704 fichiers .md au total, dont 666 dans _byan/ et 3 dans _byan-output/ (95 % d'outillage IA, PAS des livrables). Seuls ~35 .md sont specifiques au projet.

### 6.2 Structure d'archive par theme

```
docs/_archive/byan-tooling/     <- _byan/ (666 md) + _byan-output/ (3 md), 6,3 Mo
docs/_archive/figma-raw/        <- figma-full.yaml + figma-chunk-*.yaml racine + 2 PNG lourds
docs/_archive/snapshots-qa/     <- snapshots/ entier (21 Mo de PNG QA)
docs/_archive/brouillons-rncp/  <- DOSSIER-CONNAISSANCE-RNCP.md (apres fusion)
docs/_archive/cdc-fusionnes/    <- smart_mirror_specs_techniques.md (apres fusion)
```

### 6.3 Tableau fichier par fichier (synthese)

| Chemin | Action | Justification |
|--------|--------|---------------|
| README.md | Garder (+ corriger) | Point d'entree ; corriger microscope + "65+ tests" + liens CDC |
| CDC_DreamTech.md | Garder (deplacer dans docs/) | CDCF autoritaire (BC01) |
| CDC_Technique_SmartMirror_Final.md | Garder (recevoir fusion + deplacer dans docs/) | CDCT autoritaire (BC02) |
| smart_mirror_specs_techniques.md | Fusionner -> CDCT Final, puis archiver | 3e doc technique concurrent (Bun/Supabase obsoletes) |
| docs/DEFENSE-JURY.md | Garder (+ corriger) | Prepa orale ; 3 affirmations fausses a corriger |
| docs/DOCUMENT-COMPLET-RNCP.md | Garder (cible de fusion) | Dossier de soutenance principal |
| docs/DOSSIER-CONNAISSANCE-RNCP.md | Fusionner -> DOCUMENT-COMPLET, puis archiver | Brouillon de travail, evite deux dossiers concurrents |
| docs/FACT-CHECK-RNCP.md | Garder | Reference de verite interne (sert a corriger DEFENSE-JURY) |
| docs/PROJET-MVP.md | Garder (+ corriger) | Source [Contexte-MVP] |
| docs/SECURITE-CVE-ET-LANCEMENT.md | Garder | Livrable securite/mise en prod date, aligne BC04 |
| docs/livrables/01-swot ... 05-uml (6 fichiers) | Garder | Piliers RNCP BC01/BC02/BC06 |
| smart-mirror/ (code) | Garder | Produit/MVP reel (node_modules gitignore) |
| smart-mirror/device-setup/*.md (3) | Garder | Matiere BC02/BC04 (deploiement, enclosure) |
| smart-mirror/test-results/ | Supprimer | .last-run.json transitoire (45 o) ; gitignore |
| figma-exports/docs/ (9 ecrans + design system) | Garder | Doc UX lisible |
| figma-exports/figma-full.yaml | Archiver | Source canonique brute, illisible jury |
| figma-exports/figma-chunk-*.yaml (racine) | Archiver | Decoupe partielle (md5 different de full), prudence |
| figma-exports/chunks/ | Supprimer | Doublon binaire-identique a figma-full.yaml (md5 verifie 1941197f...) |
| figma-exports/recherche-client.png, veille.png | Archiver | PNG lourds redondants avec descriptions ecrans |
| snapshots/ | Archiver | 21 Mo de PNG QA ad hoc aux noms non professionnels |
| _byan/ + _byan-output/ | Archiver | Outillage IA ; polluant n1 pour le jury |
| .claude/ | Garder (gitignore) | Config dev ; ne pas exposer au jury |
| .gitignore | Garder (+ completer) | Ajouter _archive/, snapshots/, test-results/, *.last-run.json |

Deux fusions, toujours fusion+verification AVANT archivage du source : (a) smart_mirror_specs_techniques.md -> CDC_Technique_SmartMirror_Final.md ; (b) DOSSIER-CONNAISSANCE-RNCP.md -> DOCUMENT-COMPLET-RNCP.md.

### 6.4 Arborescence cible propre (vue jury)

```
RACINE/
  README.md (corrige)
  smart-mirror/ (code MVP, node_modules gitignore)
  docs/
    CDC_DreamTech.md
    CDC_Technique_SmartMirror_Final.md (+ specs fusionnees)
    DOCUMENT-COMPLET-RNCP.md (dossier unique)
    DEFENSE-JURY.md (corrige)
    FACT-CHECK-RNCP.md
    PROJET-MVP.md
    SECURITE-CVE-ET-LANCEMENT.md
    ARCHITECTURE-MVP-VS-CIBLE.md (CHANTIER 5)
    PLAN-MISE-EN-PLACE-RNCP.md (le present rapport)
    livrables/ (SWOT, PESTEL, veille, devis-TCO, gestion, UML)
    _archive/ (gitignore, rien n'est perdu)
  .gitignore (complete)
  (.claude/ gitignore, hors vue jury)
figma-exports/docs/ (9 ecrans + design system)
smart-mirror/device-setup/ (VM-SETUP, enclosure/SPECS, orientations)
```

Gains : le depot jury passe de 704 .md a ~35 .md pertinents ; suppression du message brouille "projet = BYAN" ; retrait d'environ 32 Mo de bruit de la vue jury, le tout conserve dans _archive/. Seuls 2 artefacts strictement reproductibles sont supprimes (dont 1 doublon binaire prouve).

### 6.5 Ordre d'execution sur

1. Creer docs/_archive/ et sous-dossiers ; 2. fusions + verification ; 3. deplacements CDC + maj des liens ; 4. archivages (mv) ; 5. suppressions du seul vrai dechet ; 6. maj .gitignore ; 7. corrections de contenu (renvoyees au CHANTIER 3). Aucune commande rm avant qu'une copie ne soit confirmee dans _archive ou qu'un doublon binaire-identique ne soit prouve.

---

## 7. CHANTIER 5 - Roadmap stack cible (documentee, non codee)

### 7.1 Objectif

Produire une documentation honnete et credible qui separe le MVP REELLEMENT realise de la CIBLE roadmap, justifie techniquement CHAQUE techno cible (Redis en tete, ancre sur des jobs reels), decrit le chemin de migration mock -> Laravel, et corrige les contre-verites. But : le jury voit une vision d'architecture maitrisee (BC02) et une strategie d'evolution argumentee (BC05), sans qu'aucune affirmation ne soit invalidee par une lecture du code. Approche documentaire pure : zero code Laravel ecrit.

### 7.2 Document pivot

Creer `docs/ARCHITECTURE-MVP-VS-CIBLE.md`, declare source de verite stack, avec un tableau maitre tri-etat (REALISE / EN COURS / CIBLE) par brique, chaque ligne REALISE portant une reference fichier:ligne et chaque ligne CIBLE l'etiquette `[CIBLE ROADMAP - non implemente]` + horizon.

| Brique | REALISE (preuve) | CIBLE |
|--------|------------------|-------|
| Frontend/Device | Electron 33 + React 19 | inchange |
| Backend | mock Express :8100 + IA mock :3001 (server.js) | Laravel 13 / PHP 8.4 :8000 |
| DB | PostgreSQL 15-alpine (docker-compose) | PostgreSQL 16 |
| Cache/Queue | fichier JSON poll 30s (sync.service.ts) | Redis 7 |
| Auth | echange MAC+token_device -> Bearer (crm-sync) | Sanctum tokens revocables |
| IA | Math.random (server.js:514-545) | OpenRouter LLM vision |
| Microscope | WiFi/TCP 192.168.34.1:8080 JHCMD -> ffmpeg -> MJPEG :9100 | inchange |
| Workflows | PDF synchrone pdfkit | n8n + Laravel Queue |
| Integrations | CRM generique | Shopify |
| Chiffrement | token safeStorage + fallback plaintext ; photos en clair | chiffrement applicatif P0 (EN COURS) |

### 7.3 Justification de chaque techno cible (triptyque probleme -> limite -> solution)

- LARAVEL 13/PHP 8.4 : probleme = logique metier en SQL brut (pool.query) sans ORM ni migrations versionnees (server.js ~550 l) ; cible = Eloquent + migrations + validation ; alternative ecartee = rester en Express (pas de Sanctum/queues/migrations natifs).
- SANCTUM : probleme = echange MAC+token artisanal, token non revocable proprement ; cible = tokens revocables par device avec abilities/scopes par miroir ; alternative ecartee = JWT (irrevocable, risque sur device vole).
- POSTGRESQL 16 : probleme = PG15 sans colonnes chiffrees (aucun pgcrypto) ; cible = PG16 + chiffrement applicatif.
- SHOPIFY : probleme = CRM generique sans lien catalogue/diagnostic ; cible = recommandations e-commerce issues du diagnostic.
- N8N : probleme = server.js:198 commente "In production, this triggers n8n webhook" alors que la generation PDF est SYNCHRONE in-process ; cible = orchestration webhook fin de seance.
- OPENROUTER : probleme = IA mockee Math.random ; cible = vrai LLM vision avec score de confiance + benchmark.

### 7.4 Pourquoi Redis = backing store des queues de jobs (8 jobs reels)

Redis sur 4 roles : (1) backing store Laravel Queue/Horizon, (2) cache (sessions, reponses CRM, recherche cliente cross-miroir), (3) rate limiting, (4) locks de synchronisation. Chaque job candidat ancre sur un point de douleur synchrone/fragile present dans le code :

| # | Job asynchrone candidat | Point de douleur actuel (code) |
|---|--------------------------|--------------------------------|
| 1 | Generation PDF de seance | Synchrone pdfkit in-process (GET /api/seances/:id/rapport, /tmp/rapports) bloque la requete |
| 2 | Generation + envoi QR code + lien rapport | Chaine apres PDF (server.js:394-409), envoi differe email/SMS |
| 3 | Push CRM/Shopify de la seance + dependances | Boucle synchrone poll 30s (crm-sync syncAll/syncSessionNow) ; le flag booleen syncing ne survit pas a un crash -> cible jobs idempotents + backoff + dedupe + lock Redis |
| 4 | Analyse IA differee OpenRouter | Mock setTimeout aleatoire (server.js:514-545) -> cible upload + LLM + persistance diagnostic_ia/modele_ia/latence_ms avec retry/timeout |
| 5 | Sync offline -> online catch-up | File JSON locale (sync.service.ts processQueue) -> cible reconciliation en masse avec ordonnancement FK |
| 6 | Upload photos vers stockage backend | Multipart synchrone timeout 30s (crm-sync pushPhotoCrm) -> cible job upload + chiffrement + miniatures |
| 7 | Envoi rapport client (email/SMS) + notifications | Non implemente -> cible job post-PDF (n8n/mailer) avec retry |
| 8 | Purge photos expirees (retention 30j) + purge RGPD | setInterval local (cleanupExpiredPhotos) -> cible job planifie scheduler + queue |

Conclusion : un seul service Redis couvre queue + cache + rate-limit + locks, ce qui justifie son ajout au docker-compose cible (absent aujourd'hui).

### 7.5 Schema de migration mock Express -> Laravel (strangler-fig)

Bascule progressive : le mock reste le contrat d'API que Laravel reimplante endpoint par endpoint ; le frontend Electron ne change pas.

- (A) Endpoints : les routes /miroir/* deja appelees par crm-sync (auth, heartbeat, clientes, consentements, seances, seances/:id/fin, seances/:id/rapport, photos) + les routes metier mock (:8100) -> controllers/routes Laravel versionnees iso-contrat.
- (B) Donnees : les 9 tables de init.sql (boutiques, clientes, consentements, miroirs, seances, photos, produits, medias, config_miroir) -> migrations Eloquent + modeles, en conservant la contrainte RGPD FK consentement_id NOT NULL (init.sql:59, server.js:166-177) repliquee en validation + FK.
- (C) Mecanismes : auth MAC+token -> Sanctum ; file JSON poll 30s -> Laravel Queue/Horizon sur Redis ; PDF synchrone -> job + DomPDF/n8n ; IA mock -> proxy Express conserve mais branche OpenRouter.
- Ordre de bascule par criticite : auth d'abord, puis lecture, puis ecriture, puis jobs. Strategie de coexistence : mock et Laravel servent le meme contrat pendant la transition.
- Diff infra docker-compose : de [postgres:15-alpine, mock-api, adminer] vers [laravel-app, postgres:16, redis:7, worker Horizon, n8n] (etiquete CIBLE).

### 7.6 Discours "MVP vs cible" pour le jury

Phrase-cadre : "Le MVP demontre la chaine de bout en bout avec un backend mock Express/PG15 fonctionnel et teste ; la cible Laravel 13/PG16/Redis 7 est documentee en roadmap, et je justifie chaque choix par un point de douleur observe dans le MVP."

Argumentaire "pourquoi ne pas avoir code Laravel" : maitrise du contrat d'API d'abord (le mock fige le contrat), priorisation P0 securite/chiffrement avant reecriture backend, eviter un big-bang risque - decision d'architecte assumee. Lien explicite vers BC02 (choix d'archi cible) et BC05 (strategie d'evolution).

---

## 8. Plan d'execution sequence (checklist cochable)

### 8.1 Ordre recommande des chantiers et dependances

Le sequencement respecte les dependances dures : (1) le chiffrement doit exister AVANT ses tests anti-regression ; (2) la CI ne devient bloquante qu'APRES nettoyage du code (npm audit fix) ; (3) la fusion documentaire precede l'archivage des sources ; (4) le document pivot d'architecture sert de reference aux corrections de coherence.

Sequence macro recommandee :

```
CHANTIER 5 (doc pivot) ---> CHANTIER 3 (coherence) ---> CHANTIER 4 (nettoyage)
        |                                                       
CHANTIER 1 (chiffrement) ---> CHANTIER 2 (tests + CI bloquante)
```

Le document pivot (CHANTIER 5, etape 1) est produit tot car il alimente CHANTIER 3. Le chiffrement (CHANTIER 1) et ses tests (CHANTIER 2, vague P0 etape 3) sont couples. La CI bloquante (CHANTIER 2, etapes 4-5) vient apres le fix des CVE.

### 8.2 Checklist detaillee

#### Phase A - Cadrage documentaire (CHANTIER 5 partiel + CHANTIER 3)

- [ ] A1. Creer docs/ARCHITECTURE-MVP-VS-CIBLE.md (tableau tri-etat, source de verite)
- [ ] A2. Rediger la section justification techno (triptyque par techno)
- [ ] A3. Rediger la section Redis (8 jobs ancres sur le code)
- [ ] A4. Rediger le schema de migration strangler-fig + diff docker-compose
- [ ] A5. Rediger le discours MVP vs cible + questions pieges
- [ ] A6. Creer l'encart canonique "Etat reel vs Cible" en tete de README
- [ ] A7. Corriger README (microscope WiFi, ports 8100/3001, PG15, "65+" -> chiffres reels, Laravel/Redis = cible)
- [ ] A8. Reecrire DEFENSE-JURY (microscope, photos en clair, Redis cible, concurrents reels, Sanctum cible)
- [ ] A9. Harmoniser PROJET-MVP (microscope, Redis hors tableau actuel, IA OpenRouter, ports, ecrans)
- [ ] A10. Corriger l'incoherence "USB UVC par defaut (conforme au code)" dans UML/veille/PESTEL/devis/gestion
- [ ] A11. Mettre a jour les gaps securite perimes (sandbox:true, CSP prod, CI/playwright/eslint presents)
- [ ] A12. Eliminer "aucun concurrent / first-mover" du CDC_DreamTech + encadrer transfert OpenRouter
- [ ] A13. En-tete "obsolete" sur smart_mirror_specs_techniques + addendum date sur FACT-CHECK
- [ ] A14. Passe de coherence : trancher valeurs uniques (Laravel 13, microscope, ecrans, tests) + grep transverses verts

#### Phase B - Chiffrement P0 (CHANTIER 1)

- [ ] B1. Creer crypto-vault.service.ts (AES-256-GCM, cle via systemd-creds/keyfile, throw si absente)
- [ ] B2. Chiffrer les photos au repos (savePhotoLocally, .jpg.enc, dechiffrement dans pushPhotoCrm)
- [ ] B3. Chiffrer les tokens + supprimer la branche plaintext (config.service.ts:170-173)
- [ ] B4. Chiffrer la file de synchronisation (saveQueue/getQueue + chemin de migration)
- [ ] B5. WiFi : execFile au lieu de exec ; retirer le hotspot en dur
- [ ] B6. Backend : securiser le PDF (auth), hacher device_token, sortir les secrets vers .env
- [ ] B7. pgcrypto sur email/telephone/date_naissance + shopify_access_token (trancher le compromis UNIQUE)
- [ ] B8. Documenter cles, runbook LUKS/systemd-creds, retention RGPD, encadrement OpenRouter/HDS

#### Phase C - Tests et CI bloquante (CHANTIER 2)

- [ ] C1. Tests unitaires crm-sync.service.ts (7 chemins critiques, nominal + erreur + 401)
- [ ] C2. Tests d'integration backend mock-api (regle RGPD consentement verrouillee)
- [ ] C3. Tests anti-regression chiffrement (pas de FFD8, branche safeStorage chiffree) - DEPEND de Phase B
- [ ] C4. crypto-vault.service.test.ts (round-trip, tag altere, IV unique, throw)
- [ ] C5. npm audit fix PUIS rendre l'etape audit (SCA) bloquante
- [ ] C6. Semgrep bloquant (regles critiques) + scan de secrets bloquant (gitleaks)
- [ ] C7. Seuils de couverture (coverage.thresholds) APRES C1/C3
- [ ] C8. Tests des 4 services main (microscope en priorite, wifi, media-cache, updater)
- [ ] C9. Tests renderer jsdom (session.store, ConsentScreen) + projet vitest distinct
- [ ] C10. Tests IPC handlers.ts + extension coverage.include
- [ ] C11. Job e2e-smoke xvfb + etiquetage des e2e VM/CDP comme manuels
- [ ] C12. Cabler le job d'integration backend en CI (postgres/pg-mem)
- [ ] C13. Scan d'image conteneur (Trivy/Grype) + DAST ZAP baseline
- [ ] C14. Correction honnete du decompte de tests dans la doc
- [ ] C15. Protection de branche main (required status checks)

#### Phase D - Nettoyage arborescence (CHANTIER 4)

- [ ] D1. Creer docs/_archive/ et sous-dossiers
- [ ] D2. Fusion smart_mirror_specs_techniques -> CDCT Final (+ verification)
- [ ] D3. Fusion DOSSIER-CONNAISSANCE -> DOCUMENT-COMPLET (+ verification)
- [ ] D4. Deplacer les 2 CDC dans docs/ + mettre a jour les liens
- [ ] D5. Archiver _byan/, _byan-output/, snapshots/, figma yaml/PNG bruts, brouillons fusionnes
- [ ] D6. Supprimer figma-exports/chunks/ (doublon binaire) et smart-mirror/test-results/
- [ ] D7. Completer .gitignore (_archive/, snapshots/, test-results/, *.last-run.json)

> Note de sequencement : la Phase D (nettoyage) se realise apres les fusions documentaires des Phases A et qu'aucune source utile ne reste non integree. La Phase B precede C3/C4. La Phase A peut demarrer en parallele de la Phase B (chantiers independants : doc vs code).

---

## 9. Risques et points de vigilance transverses

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Rendre npm audit bloquant AVANT npm audit fix | CI rouge sur CVE preexistantes, blocage de tout le travail | Ordre strict : fix d'abord, bascule ensuite (Phase C5) ; valider chaque bump majeur |
| Gestion de cle = maillon faible (pas de fTPM sur Pi 5) | Cle lisible par root / hors-ligne | Documenter le compromis (keyfile 0600 vs HAT TPM) ; ne jamais pretendre une protection parfaite |
| Reutilisation d'IV en AES-GCM | Perte totale de securite | randomBytes(12) par message imperatif ; test d'unicite d'IV |
| Migration des donnees deja en clair | Perte de la file de sync / token illisible apres MAJ | Chemin de migration (relire en clair une fois, reecrire chiffre) |
| pgcrypto et UNIQUE(email, boutique_id) | Regression sur la recherche cliente | Trancher hash deterministe vs chiffrement avant d'appliquer |
| Retrait du static /api/rapports | Casse d'appels existants et e2e | Verifier les 136 e2e, adapter les attentes |
| Semgrep/coverage thresholds trop stricts trop tot | CI rouge permanente, demotivation | Montee progressive ; .semgrepignore documente ; seuil de depart realiste |
| e2e sous xvfb flaky | CI rouge intermittente | Garder un smoke minimal ; isoler les e2e VM/CDP en manuel |
| Confondre correction doc et modif code (CHANTIER 3) | Doc qui ne colle plus au code | C'est le doc qui colle au code verifie, jamais l'inverse |
| Sur-correction documentaire (MVP parait plus pauvre) | Credibilite jury affaiblie | Valoriser explicitement ce qui EST realise ; l'honnetete sur la dette renforce la credibilite |
| Credibilite inverse (exposer IA mockee, photos en clair) | Impression de manque | Cadrer en decisions d'architecte assumees ; le bluff est de toute facon detectable a la lecture du code |
| Incoherence de version Laravel residuelle (11 vs 13) | Contradiction reperee par le jury | Figer Laravel 13/PHP 8.4/PG16 partout |
| Doc pivot non realignee avec les autres docs | N-ieme version contradictoire | Passe de coherence transverse obligatoire (A14, C5 doc) |
| Suppression accidentelle de fichier d'examen | Perte irreversible | Strategie archive-first ; aucun rm avant copie confirmee ou doublon binaire prouve |

---

## 10. Annexe - Questions/reponses pieges pour l'oral

Banque de reponses honnetes pre-redigees, opposables a un jury qui lit le code. Chaque reponse distingue REALISE (verifiable) et CIBLE (roadmap).

| Question du jury | Reponse honnete |
|------------------|-----------------|
| "Votre IA fonctionne reellement ?" | "Non, elle est mockee aujourd'hui (server.js:514-545, scores Math.random + commentaire en dur). OpenRouter est la cible roadmap. Le mock suffit a valider le flux de bout en bout et le contrat d'API ; brancher un vrai LLM vision est un job asynchrone identifie." |
| "Le microscope est-il en USB ?" | "Non, il est en WiFi/TCP (192.168.34.1:8080, protocole JHCMD) : le flux H.264 est transcode par ffmpeg en MJPEG servi sur localhost:9100 (proxy.js). La doc qui disait USB/UVC etait une erreur que j'ai corrigee ; il subsiste des vestiges UVC/V4L2 morts dans le repo." |
| "Avez-vous des queues Redis ?" | "Pas encore. La file actuelle est un simple fichier JSON poll a 30s (sync.service.ts). Je sais exactement quels 8 jobs y migreront (PDF, QR, push CRM, IA, sync catch-up, upload photos, notifications, purge) et pourquoi : chacun a un point de douleur synchrone ou fragile dans le code." |
| "Les photos de cuir chevelu sont-elles chiffrees ?" | "Pas encore au repos (sync.service.ts:61 ecrit le JPEG brut). C'est mon chantier P0 en cours : chiffrement applicatif AES-256-GCM, cle geree par systemd-creds, plus LUKS en couche de base. Je peux montrer l'etat reel et la cible, ainsi que les implications RGPD/HDS." |
| "Combien de tests ?" | "34 tests unitaires Vitest et 136 cas e2e Playwright, soit 170 cas, et non 65. Le service crm-sync.service.ts (372 lignes) est a 0 test : c'est le plus gros trou que je renforce en BC04, avec une CI rendue bloquante." |
| "Tournez-vous Laravel ?" | "Non, le backend realise est un mock Express + PostgreSQL 15 (server.js, docker-compose), pas de composer.json ni d'artisan. Laravel 13/PHP 8.4 est la cible roadmap. J'ai fige le contrat d'API avec le mock pour pouvoir basculer en strangler-fig endpoint par endpoint, sans big-bang." |
| "Pourquoi Electron et pas une webapp ?" | "Kiosque natif tactile pour Raspberry Pi, mode offline-first, persistance locale et stockage de secrets via safeStorage. L'argument 'le navigateur ne peut pas lire l'USB' n'est plus valable puisque le microscope est en WiFi/MJPEG HTTP local : je ne le defends donc pas." |
| "Le sandbox Electron et la CSP sont-ils en place ?" | "Oui : sandbox:true (index.ts:51) et CSP appliquee en production (index.ts:121-143, if !is.dev). Certains de mes anciens livrables les listaient encore comme gaps : c'est corrige." |
| "La regle RGPD du consentement est-elle verrouillee ?" | "Oui cote schema (init.sql FK consentement_id NOT NULL) et cote serveur (server.js:166-177 refuse une seance sans consentement valide). Je la verrouille en plus par un test d'integration backend, dont la mutation (retirer le garde-fou) fait passer un test au rouge." |
| "Vos donnees IA sortent-elles de l'UE ?" | "En cible, oui : OpenRouter route vers des fournisseurs US. C'est un transfert hors UE de donnee potentiellement sensible, que j'encadre (Zero Data Retention, routage EU in-region, SCC) ou que je minimise (recadrage/features au lieu de l'image brute). Si les photos sont qualifiees donnees de sante, l'hebergement HDS UE/EEE est requis." |

---

*Fin du rapport. Ce document est la feuille de route de reference pour la sequence de travaux et constitue une piece de gestion de projet (planification, sequencement, gestion des risques, tracabilite des decisions) exploitable devant le jury RNCP 37046.*
