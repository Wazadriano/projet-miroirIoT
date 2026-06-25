<!-- Genere par analyse multi-agents le 2026-06-15. Brouillon de travail : a relire et a re-accentuer avant integration au docx/PPT. -->

# DOSSIER DE CONNAISSANCE — Soutenance RNCP 37046
## Smart Mirror KBEAUTY / Bubble Hair Spa — Equipe DreamTech

> **Avertissement de l'examinateur (a lire avant tout).** Ce dossier distingue strictement (a) ce qui est *prouve dans le repo*, (b) ce qui *manque* pour le docx/PPT, (c) mes *recommandations*. Plusieurs piliers attendus par le RNCP (SWOT, PESTEL, veille, devis J/H) **n'existent dans aucun fichier du depot** — je le dis sans le romancer. A l'inverse, l'incident de fuite de secrets est une **vraie matiere defensive** que vous sous-exploitez aujourd'hui. Convention de sourcing : `[CDCF]`, `[CDCT]`, `[Contexte-MVP]`, `[Code-device]`, `[Tests-CI]`, `[Backend-DB]`, `[Hardware]`, `[UX]`, `[Audit-secu]` + verifications git que j'ai faites moi-meme (notees `[git verifie]`).

> **Contradiction majeure a trancher AVANT l'oral.** Le projet existe en **deux narratifs techniques incompatibles** :
> - **Narratif A (autoritaire, code reel)** : IA **100% cloud** via OpenRouter ; pas de Hailo/NPU ; Electron+React ; Laravel/PostgreSQL. Source : `[CDCT]` (v5.0 faisant autorite), `[Code-device]`, `[Backend-DB]`.
> - **Narratif B (cible de l'audit)** : IA **CV on-device** (OpenCV/CPU), photo qui ne sort jamais, migration Hailo, Python vision, proxy Rust. Source : `[Audit-secu]`.
>
> **Le code livre = Narratif A.** L'audit decrit un Narratif B *souhaite* (P1/P2/P3 non implementes). Si vous melangez les deux a l'oral, le jury vous prendra en flagrant delit d'incoherence. **Choisissez votre histoire** : soit "MVP cloud assume, migration on-device documentee comme roadmap", soit vous implementez le CV on-device avant la soutenance. Je recommande la premiere (honnete, factuelle).

---

## PARTIE 1 — Presentation perso & pro (KBEAUTY & OHADJA) + SWOT KBEAUTY

### (a) Ce qui existe deja
- **Client KBEAUTY (K Beauty Cosmetics)** : enseigne de cosmetiques coreens, **3 boutiques France (Nice, Lyon, Cannes)**, service premium **"Bubble Hair Spa"**, e-commerce **Shopify** (kbeauty-cosmetics.com), mailing **Klaviyo**, base clients existante. Aujourd'hui les praticiens travaillent sur **tablette** (a remplacer par le miroir). Source : `[CDCF]` 1.1-1.4.
- **Equipe de realisation = "DreamTech"** (developpement + deploiement). Source : `[CDCF]` 12.4, `[Contexte-MVP]`.
- **Cibles utilisateurs definies** (font office de mini-personas) : Praticien, Client final, Administrateur/siege. Source : `[CDCF]` 1.4.

### (b) Ce qui manque (a produire pour le docx/PPT)
- **OHADJA : totalement absent du depot.** Aucun fichier ne mentionne ce nom. Si OHADJA est *votre entreprise* (ESN/structure qui porte le projet face au client KBEAUTY), c'est **a vous de l'ecrire** : raison sociale, activite, positionnement, votre role exact dedans. **Rien dans le repo ne le fournit.**
- **ACADENICE (ecole) : absent.** A ajouter pour le cadre RNCP.
- **Votre presentation perso/pro** (parcours, role precis "Chef de projet en solutions logicielles IoT") : **absent**. Le CDCF ne nomme aucun etudiant ni role individuel ; il parle d'"equipe DreamTech" et d'un "developpeur dedie" (`[CDCF]` 4.3).
- **SWOT KBEAUTY formel : n'existe nulle part** (pas de matrice). Elements epars seulement.

### (c) Recommandations examinateur
- **Clarifiez le triangle OHADJA / DreamTech / KBEAUTY des la slide 1.** Aujourd'hui le depot dit "DreamTech", votre plan dit "OHADJA". Le jury *exigera* de savoir qui est qui. Proposition coherente : OHADJA = votre entreprise (prestataire), DreamTech = nom de marque/equipe projet, KBEAUTY = client. **Decidez et tenez la ligne partout** (docx, PPT, oral).
- **Construisez la SWOT vous-meme**, en vous appuyant sur la matiere reelle :
  - **Forces** : positionnement premium, CRM Shopify deja en place, IA differenciante, architecture offline-first robuste.
  - **Faiblesses** : dependance fournisseur IA (OpenRouter), MVP mono-boutique, equipe reduite, dette technique de securite (voir Partie 5/Section B).
  - **Opportunites** : first-mover revendique, modele franchise/B2B instituts (`[CDCF]` 12).
  - **Menaces** : qualification "dispositif medical" si glissement de vocabulaire (RGPD art. 9 / MDR), transfert de donnees hors UE via OpenRouter, copie facile par un concurrent.
- **Piege** : la SWOT doit etre celle de **KBEAUTY** (le client), pas de votre produit. Ne confondez pas.

---

## PARTIE 2 — Projet : PESTEL, veille concurrentielle, contexte

### (a) Ce qui existe deja
- **Contexte** : solide et factuel (cf. Partie 1). Vision produit claire, positionnement *"Votre cuir chevelu, analyse par IA. Votre soin, revele par K Beauty Cosmetics."* Source : `[CDCF]` 1.2, 11, 12.1.
- **Cadre reglementaire (matiere PESTEL-Legal)** : RGPD (consentement art. 7, minimisation, retention), debat **donnees de sante / HDS**, **DPA OpenRouter requis**, vocabulaire medical banni, cadres **RED art. 3.3 / CRA (SBOM)**, **MDR evite**. Source : `[CDCF]` 8, `[CDCT]` §15, `[Audit-secu]` §5.

### (b) Ce qui manque
- **PESTEL : absent du depot.** Aucune analyse Politique/Economique/Social/Technologique/Environnemental/Legal structuree.
- **Veille concurrentielle : inexistante en tant qu'analyse.** Le CDCF repete *"aucun concurrent identifie — first-mover advantage"* (`[CDCF]` 1.3, 12) **sans aucune source**. C'est un **claim non demontre** — danger en l'etat.

### (c) Recommandations examinateur
- **Le "first-mover, aucun concurrent" est votre plus gros risque oral.** Un jury cite immediatement : miroirs connectes (HiMirror, Care OS Poseidon), apps de trichoscopie (TrichoLab, FotoFinder en medical), diagnostics capillaires IA (L'Oreal SkinConsult, Haircare AI de marques). **Reformulez** : *"pas de concurrent direct sur le couplage microscope WiFi + IA + CRM en institut K-Beauty ; concurrents adjacents existent en cosmetique grand public et en dermatologie medicale, dont nous nous differencions par X."* Sourcez au moins 3 acteurs.
- **Construisez le PESTEL** en reutilisant la matiere legale deja presente (c'est le L le plus fourni). Le **E (Environnemental)** peut s'appuyer sur vos chiffres conso (5.7-6.8 W, `[Hardware]`) — bonus d'optimisation.
- **Piege fact-check** (cf. vos regles BYAN) : tout claim "le meilleur / aucun / toujours" doit etre source niveau L2+. "First-mover" sans preuve = `[HYPOTHESIS]`, pas `[CLAIM]`. Annoncez-le comme hypothese.

---

## PARTIE 3 — CDCF (problematique, besoin, contrainte, solution)

### (a) Ce qui existe deja — **C'est votre partie la plus solide.**
- **Problematique metier** : aucun outil dedie au soin capillaire (tablette), besoin de centraliser les donnees, suivi longitudinal, IA comme avantage, alimentation CRM, MVP en vue franchise. Source : `[CDCF]` 1.2-1.3, 12.
- **Besoins fonctionnels exhaustifs** : app miroir (flux microscope, captures, analyse IA, consentement RGPD horodate, workflow seance), back-office (fiches clients, controle miroir, produits via Shopify, export CRM, multi-boutique), IA (5-15 photos/seance, 1 appel/photo, JSON, 7 categories), QR + PDF A4. Source : `[CDCF]` 3-6.
- **Contraintes** : Debian 12 / Pi 5 8 Go ARM64, double WiFi, Electron kiosk, materiel (Shineworld 32" 400 nits, microscope Jiusion ~45 EUR, 6 miroirs), RGPD, **flux video local ne transitant pas par le cloud**. Source : `[CDCF]` 3,7,8,9.
- **Solution** : 2 briques (miroir + back-office), design sombre futuriste K-Beauty. Source : `[CDCF]` 2.1, 11.

### (b) Ce qui manque
- **Energie : aucune contrainte chiffree dans le CDCF** (seule l'alimentation ecran est citee). Les chiffres conso viennent de `[Hardware]`, pas du CDCF.
- **Delais de developpement : absents** (seul un calendrier *marketing* existe, `[CDCF]` 12.2).
- **Personas detailles** : seulement 3 cibles, pas de personas riches.

### (c) Recommandations examinateur
- **Mettez en avant la tracabilite besoin -> regle de gestion -> test.** Vous avez RG-001 a RG-010 (`[Contexte-MVP]`) et TC-01 a TC-06. Montrez la chaine : *besoin consentement -> RG-001/005 -> TC-02 (erreur 422 sans consentement_id)*. C'est exactement ce qu'un jury RNCP veut voir (BC01).
- **Attention contradiction de perimetre** : le CDCF parle de **6 miroirs / 3 boutiques** ; le MVP cible **1 boutique, 1 tenant** (`[Contexte-MVP]`). Annoncez : *"cible commerciale 6 miroirs, perimetre MVP de soutenance = 1 boutique."*
- **Piege** : la contrainte "flux local, ne transite pas par le cloud" (`[CDCF]`) contredit le fait que **les photos partent vers OpenRouter** pour analyse (`[Audit-secu]` C2). Le *flux video live* reste local, mais les *snapshots* sortent. Distinguez explicitement les deux, sinon le jury releve le mensonge.

---

## PARTIE 3bis — Devis : estimation temps, budget, J/H en tiroir

### (a) Ce qui existe deja
- **Couts materiels unitaires** (deux sources, **chiffres divergents** — a reconcilier) :
  - `[CDCF]` 12.4 : miroir Shineworld ~800 EUR + boitier Pi5 ~165 EUR + microscope ~45 + dongle ~15 + HDMI ~10 = **~1 035 EUR/unite** (somme deduite, non ecrite).
  - `[CDCT]` §17 : materiel ~**180 EUR/miroir hors ecran** (Pi5 ~90, boitier PETG ~5, microscope ~45, dongle ~15, microSD ~15).
- **Cout recurrent (OpEx)** : `[CDCT]` ~**55-115 EUR/mois** (VPS Scaleway 30-35, stockage 5-15, backup 2-5, OpenRouter 15-40 pour ~3 300 appels/mois, domaine 1, SMTP 0-5). HDS ecarte = -150 a -400 EUR/mois.
- **Cout IA a l'analyse** : ~**0,002 EUR/analyse**, ~0,20 EUR/mois/miroir a 100 analyses (`[Audit-secu]` §6).
- **Couts d'evolution chiffres** : CNN Hailo-8L ~190-220 EUR ; VLM AI HAT+2 ~120 EUR (`[Audit-secu]` §6).

### (b) Ce qui manque — **CRITIQUE**
- **Aucun devis formel, aucune estimation J/H, aucun planning de sprints date** n'existe dans tout le depot. Confirme par `[CDCF]`, `[CDCT]`, `[Contexte-MVP]` (les trois le disent explicitement).
- **Budget projet global (cout de developpement) : absent.**
- **Decomposition "en tiroir"** (par lot/sprint/fonctionnalite) : **a produire entierement.**

### (c) Recommandations examinateur
- **Vous devez fabriquer le devis vous-meme.** Methode defendable : partez des **6 processus metier** (`[Contexte-MVP]` : workflow seance, provisioning, analyse IA, PDF, sync medias, export Shopify) + 4 briques + 9 ecrans, estimez en J/H par lot, appliquez un TJM, ajoutez le materiel.
- **Tiroirs proposes** : (1) Device/Electron, (2) Backend Laravel + DB, (3) Service IA, (4) Microscope/proxy, (5) UX/Figma, (6) Tests/CI/securite, (7) Provisioning/boitier 3D, (8) Gestion projet. Chiffrez chaque tiroir en J/H.
- **Argument fort** : reconciliez les deux chiffrages materiel. Le ~1 035 EUR du CDCF inclut l'ecran (~800), le ~180 du CDCT est **hors ecran** : **les deux sont coherents** (1 035 ~= 800 + 235). **Dites-le** — ca montre que vous maitrisez vos chiffres et non que vous vous contredisez.
- **Piege** : annoncez un cout total de possession (TCO) sur 3 ans = CapEx materiel + OpEx*36 mois. Un jury "solution logicielle pour l'IoT" adore le TCO.

---

## PARTIE 4 — Gestion de projet (methodologie justifiee)

### (a) Ce qui existe deja
- **Methode = Merise Agile + TDD** (cadre BYAN, 64 mantras), justifiee dans `DEFENSE-JURY.md` : Merise = modelisation rigoureuse donnees (MCD) + traitements (MCT) avant de coder ; agile = enrichissement incremental. Source : `[Contexte-MVP]` §2.
- **Cycle 5 phases** : Document Project -> Analyse -> Planning -> Solutioning -> Implementation.
- **Acteurs/roles** : Praticien, Client, Gerant, Collaborateur, Super admin, No-codeur + acteurs systeme (`[Contexte-MVP]` §4). Agents BYAN simulant une equipe (Orion device, Nadia backend, Iris IA, Amelia panel, Winston archi, Bob SM, Quinn/Murat QA).
- **Niveaux de test** : Unit > Integration > E2E, API first-class ; valeur prouvee lors de la migration mock-API -> CRM reel.

### (b) Ce qui manque
- **Aucun decoupage en sprints dates, aucun backlog chiffre (story points), aucun jalon calendaire, aucune affectation de personnes physiques.** Les "agents BYAN" ne sont **pas une vraie equipe** — c'est de l'outillage IA. Confirme par `[Contexte-MVP]` §4-5.
- **Contradiction de preuve** : `[Audit-secu]` F8 signalait "commit unique, aucun historique" contredisant le recit des 65+ tests. **[git verifie]** : il y a **36 commits** apres reecriture d'historique — donc l'historique existe bel et bien aujourd'hui. **A jour, F8 est partiellement obsolete** (mais l'historique a ete *reecrit*, donc les dates ne refletent plus le developpement reel — soyez transparent la-dessus).

### (c) Recommandations examinateur
- **Justifiez Merise Agile, mais anticipez la contre-attaque.** Un jury demandera : *"Merise c'est du cycle en V, pas de l'agile — comment conciliez-vous ?"* Reponse modele : *"Merise pour la rigueur du modele de donnees (MCD/MCT), iteration agile pour l'enrichir sprint par sprint ; Sprint 0 = MCD squelettique, enrichi ensuite."* C'est exactement votre narratif `[Contexte-MVP]` §2 — tenez-le.
- **N'invoquez JAMAIS "les agents BYAN" comme une equipe humaine.** Si le jury comprend que Orion/Nadia/Iris sont des personas IA, votre "gestion d'equipe" s'effondre. Presentez-les comme **un outil d'assistance**, et vous comme le **chef de projet unique** qui orchestre.
- **Produisez un backlog retrospectif** : meme reconstitue, un tableau "epic -> stories -> J/H -> statut" credibilise BC06.
- **Assumez la reecriture d'historique** (voir Section B) : c'est une force, pas une faute, *si vous l'expliquez*.

---

## PARTIE 5 — CDCT : benchmark, UML, securite, SemGrep, tests, versioning, audit

### (a) Ce qui existe deja
**Stack reelle (code livre)** — `[Code-device]`, `[Backend-DB]` :
- Device : **Electron ^33.2.0 + React ^19 + TypeScript ^5.7 + Zustand ^5**, electron-vite, electron-builder (deb + AppImage, **arm64 ET x64**), electron-updater (rollback apres 3 crashes), electron-store + safeStorage.
- Backend mock : **Node 20 + Express ^4.21 + PostgreSQL 15** (9 tables, UUID, JSONB `diagnostic_ia`, RLS multi-tenant `boutique_id`, requetes parametrees anti-injection).
- IA : proxy Express port 3001, header `X-Mirror-Token`, OpenRouter (cloud).
- Microscope : proxy Node, TCP 192.168.34.1:8080, handshake `JHCMD`, transcodage **H.264 -> MJPEG via ffmpeg `-r 15 -q:v 5`**, SSE bouton physique (`[Hardware]`).

**Benchmarks technologiques documentes** — `[CDCT]` §3, `[Audit-secu]` §3 :
- Electron vs Chromium kiosk (Chromium economise 300-500 Mo RAM) ; Electron vs Tauri (Tauri superieur 2-10 Mo footprint mais risque UI glassmorphism sur WebKitGTK -> Electron retenu, gate RAM, migration documentee) ; Laravel vs Node ; PostgreSQL vs MySQL/SQLite ; Scaleway vs Hetzner (RGPD) ; modeles IA (Gemini Flash 1.5 / GPT-4o mini / Claude 3.5 Haiku) ; codecs (H.264 preview vs JPEG/MJPEG analyse, AV1/H.266 rejetes).

**Securite (etat reel)** — `[Code-device]` §5, `[Audit-secu]` :
- **BON** : `contextIsolation: true`, `nodeIntegration: false`, contextBridge propre, `setWindowOpenHandler` deny, durcissement kiosk, safeStorage pour device token, requetes SQL parametrees.
- **GAPS** : `sandbox: false` (F6), **CSP absente** (F2, **[git verifie]** : confirme), `crmBearerToken` en clair (F3/C3), **photos JPEG ecrites en clair** (C1, contredit le claim "chiffrees"), transfert hors UE via OpenRouter (C2), 2 CVE hautes (Electron + fast-uri, F1), remote debug CDP 9222 sur 0.0.0.0 si flag.

**Tests** — `[Tests-CI]` :
- Unitaires : Vitest 2, **~35 cas / 3 services testes sur 9** (config, api-client, sync). Non testes : crm-sync (le plus gros), media-cache, microscope, updater, wifi, + 0% renderer/ipc/preload.
- E2E : Playwright 1.59, 4 specs (~50+ cas dans qa-complete), dont 2 via CDP sur VM Debian 12.
- 6 tests critiques TC-01 a TC-06 (isolation tenant, consentement 422, sync offline, auth, IA malformee, fallback email).

**Versioning** : Git, migrations Laravel versionnees, schema-changelog. **[git verifie]** : 36 commits, historique reecrit, email unique propre.

### (b) Ce qui manque — **plusieurs points bloquants pour un jury**
- **UML : AUCUN diagramme formel** (cas d'usage, sequence, classes, deploiement). `[CDCT]` §7 le confirme. Il n'y a que du MCD/MCT textuel (Merise) + schemas ASCII. **Le plan parle de "diagramme UML" — il n'existe pas.**
- **SemGrep : ABSENT** (grep = 0). Cite dans l'audit comme *a faire*, jamais versionne (`[Tests-CI]` §5, `[Audit-secu]` F5).
- **CI/CD : ABSENT** — aucun `.github/workflows`, GitLab CI, Jenkins. Tests/lint/build/scan 100% manuels (`[Tests-CI]` §5).
- **npm audit / SBOM / Snyk / Dependabot : ABSENTS** (`[Tests-CI]`, `[Audit-secu]` F4).
- **ESLint 9 non fonctionnel** : flat config `eslint.config.js` manquante -> `npm run lint` echoue (`[Tests-CI]` §3).
- **playwright.config.ts : absent** -> E2E non executable en CI, URLs hardcodees.
- **Tests de penetration : non realises** (exiges par BC04, `[Audit-secu]`).
- **CVE-IDs formels : non cites** (2 CVE decrites sans numero).

### (c) Recommandations examinateur
- **UML : produisez au minimum 3 diagrammes avant la soutenance.** (1) Cas d'usage (Praticien/Client/Admin), (2) Sequence "workflow seance" (du consentement au QR), (3) Deploiement (Pi5, double WiFi, proxy, backend local, CRM distant). Vous pouvez les deriver directement du MCD existant et du parcours `[Code-device]` §3. **Ne dites pas "j'ai de l'UML" si vous montrez du Merise** — assumez Merise et ajoutez les 3 UML demandes par le referentiel.
- **SemGrep + CI : le quick-win le plus rentable.** Un seul workflow GitHub Actions (typecheck + `vitest --coverage` + `npm audit` + job Semgrep + build arm64) transforme 4 gaps en 1 preuve BC04/BC05. Faisable en 1 jour. **Faites-le, meme minimal.**
- **CSP** : ajoutez `session.defaultSession.webRequest.onHeadersReceived` avec `default-src 'self'` + sources explicites du flux microscope/medias. C'est 10 lignes, ferme F2.
- **Reconciliez les divergences de specs** (Laravel 11/PHP 8.3/PG15 du YAML vs Laravel 13/PHP 8.4/PG16 du README ; port IA 3001 vs 3002 ; Jiusion vs Ninyoon ; stack Bun/Supabase obsolete du complement). **Le jury lira vos docs** : un seul chiffre faux et il tire le fil. Declarez `[CDCT]` v5.0 comme autoritaire et marquez le complement "obsolete".
- **Piege classique** : *"Vous annoncez 65+ tests, j'en compte ~35 unitaires."* Reponse : *"35 unitaires + 50+ scenarios E2E Playwright = 85+, mais 3 services sur 9 seulement en unitaire ; je connais ma dette et voici le plan."* L'honnetete sur la couverture (~30%, non mesuree faute de `--coverage`) vaut mieux qu'un chiffre gonfle.

---

## PARTIE 6 — Bilan (ameliorations, bilan personnel, remerciements)

### (a) Ce qui existe deja
- **Backlog d'ameliorations chiffre et priorise** : P0-P3 dans `[Audit-secu]` §6 (chiffrer photos+token, npm audit fix+CSP, CV on-device, SBOM+CI, proxy Rust, spike Tauri, CNN Hailo, VLM AI HAT+2).
- **Hors-scope post-MVP documente** : workflows n8n etendus, Redis/Horizon, temps reel Reverb, scaling load-balancer, multi-region, monitoring par tenant (`[Contexte-MVP]`).
- **Recommandations ingenieur hardware** : supprimer `stream.py` redondant, consolider button-listener dans le proxy, reconcilier microscope USB/WiFi, valider SPACER_HEIGHT par mesure IR (`[Hardware]` §6).

### (b) Ce qui manque
- **Bilan personnel** (ce que vous avez appris, difficultes, montee en competence) : **absent** — c'est intrinsequement a vous.
- **Remerciements** : **absents** — a rediger.
- **Bilan projet quantifie** (objectifs atteints vs cibles : MVP 1 boutique, IA >=80%, isolation tenant) : a formaliser depuis les criteres de succes `[Contexte-MVP]`.

### (c) Recommandations examinateur
- **Le meilleur bilan personnel possible = l'incident de securite.** Racontez : "j'ai decouvert pendant la prep que le depot public fuyait 2 secrets reels, j'ai conduit la remediation complete, et j'ai compris la difference entre revoquer et nettoyer." C'est la preuve la plus forte de maturite (voir Section B). **C'est votre histoire de bilan.**
- **Distinguez ameliorations "souhaitables" et "necessaires".** Le on-device CV / Hailo est *souhaitable* ; CSP / SBOM / CI / revocation des secrets sont *necessaires* et certains *deja faits*. Montrez que vous savez prioriser (Rasoir d'Ockham).
- **Piege** : ne presentez pas la roadmap Hailo/Rust comme "fait". C'est P2/P3 non implemente.

---

# SECTIONS TRANSVERSES

## A) MAPPING RNCP 37046 — BC01 a BC06

> Aligne sur `[Audit-secu]` §5 + preuves repo. Pour chaque bloc : preuves a mettre en avant + ce qui manque.

| Bloc | Preuves concretes a montrer | Manques a combler |
|---|---|---|
| **BC01 — Specifier / cadrer** | CDCF complet (problematique, besoins exhaustifs 3-6, contraintes, 3 cibles, parcours seance) ; finalite **cosmetique** explicite (hors MDR) ; 10 regles de gestion RG-001..010 ; cadre RGPD. Source `[CDCF]`, `[Contexte-MVP]`. | SWOT, PESTEL, veille concurrentielle (Parties 1-2). Personas detailles. |
| **BC02 — Concevoir l'architecture** | Architecture 4 briques ; **MCD 9 tables** (`[Backend-DB]`) ; choix techno justifies + benchmarks (`[CDCT]` §3) ; offline-first/local-first ; multi-tenant RLS ; anticipation RGPD (chiffrement LUKS, retention, HDS debattu) ; double WiFi. | **Diagrammes UML** (cas d'usage/sequence/deploiement). Decision finale cloud vs on-device (contradiction A/B). |
| **BC03 — Developper** | Code device structure (8 services main, IPC typee, contextBridge) ; backend Express+PG ; pipeline microscope ffmpeg ; QR+PDF (qrcode, pdfkit) ; boitier 3D PETG parametrique (OpenSCAD) ; **versioning Git 36 commits [git verifie]** ; migrations versionnees. | Couverture reelle des services (3/9). Code propre mais CSP/sandbox a durcir. |
| **BC04 — Tester / mettre en prod** | 65+ tests (Vitest+Playwright), 6 TC critiques bloquants, systemd durci (`ProtectSystem=strict`, `NoNewPrivileges`), kiosk durci, electron-builder cross-arch, OTA avec rollback. **Remediation secrets = test de securite vecu.** | **CI/CD, SemGrep, SBOM, tests de penetration, playwright.config, ESLint flat config.** CSP, sandbox, chiffrement photos. |
| **BC05 — Maintenir / faire evoluer** | Veille CVE (2 CVE hautes identifiees) ; roadmap P0-P3 chiffree ; OTA electron-updater ; **incident secrets -> process de revocation/rotation** ; cadre CRA (SBOM a venir). | SBOM CycloneDX, Dependabot/npm audit en CI, CVE-IDs formels, DPA OpenRouter signe. |
| **BC06 — Piloter** | Methodo Merise Agile + TDD justifiee ; 5 phases ; **gestion d'incident securite documentee (backup, filter-repo, force-push)** ; priorisation P0-P3 ; hygiene repo. | Backlog date/chiffre, sprints, jalons. Nettoyage `_byan/`+`.claude/` du repo produit (F9). |

## B) POSTURE SECURITE (a presenter comme une FORCE — BC04 + BC05)

**Etat reel verifie dans le code** :
- **Isolation Electron** : `contextIsolation:true`, `nodeIntegration:false`, contextBridge propre, window.open deny. **Mais `sandbox:false`** (F6) et **CSP absente** (`[git verifie]` : confirme, aucune meta ni header). `[Code-device]` §5.
- **Secrets / chiffrement** : device token chiffre via safeStorage (bon) ; **mais `crmBearerToken` et photos JPEG en clair** (C1/C3). `[Audit-secu]`.
- **RGPD** : consentement obligatoire cote API (422 sans `consentement_id`), retention 30j, vocabulaire medical banni, multi-tenant RLS. **Faille de tracabilite** : claim "photos chiffrees" / "pas de partage tiers" **faux** car OpenRouter (US) est dans la boucle (C1/C2).
- **CVE** : 2 hautes (Electron window.open + injection switch ; fast-uri path traversal), **sans CVE-ID** -> a numeroter. `[Audit-secu]` F1.

**L'INCIDENT DE FUITE DE SECRETS — votre meilleur atout oral** (verifie par moi) :
- **Constat** : depot public contenant **2 secrets reels** : (S1) un **PAT GitHub `ghp_...`** present dans le champ email auteur de **31 commits** ; (S2) un **token Bearer CRM en dur dans `smart-mirror/start.sh`**.
- **Remediation conduite** : backup bundle -> reecriture complete de l'historique avec **git filter-repo** (purge du token CRM de tous les blobs + correction des 31 emails + suppression de 2 fichiers au nom illegal Windows avec deux-points) -> durcissement `start.sh` (token charge depuis `.env`/env, `.env.example` ajoute, `.gitignore` corrige) -> **force-push**.
- **Reste a faire (a annoncer comme tel)** : **revocation du PAT GitHub** et **rotation du token CRM** cote fournisseur.
- **[git verifie] — la remediation tient** : `git rev-list --all` = **36 commits**, **un seul email auteur** `adriano.palamara19@gmail.com`, **zero occurrence `ghp_`** dans les emails de tout l'historique, **zero `Bearer` token dans start.sh** des blobs, `.env.example` documente explicitement la fuite et la revocation, `.gitignore` exclut `.env`/`.env.*` (sauf `.env.example`).

**Le message pedagogique cle (a dire mot pour mot au jury)** :
> *"Reecrire l'historique avec git filter-repo, c'est de l'**hygiene** : ca empeche un nouveau visiteur de trouver le secret. Mais tout fork ou clone anterieur le possede encore. La **vraie remediation, c'est la revocation** : un PAT revoque et un token CRM rotates sont inutilisables, peu importe ou la chaine de caracteres traine encore. J'ai fait les deux : nettoyage pour l'hygiene, revocation/rotation pour la securite reelle."*

C'est exactement la nuance qui separe un junior d'un chef de projet IoT senior. **Exploitez-la.**

**Tests de penetration** : non realises. A annoncer comme prochain jalon BC04, ou a faire a minima un `npm audit` + Semgrep + un scan OWASP ZAP sur le backend avant l'oral.

## C) OPTIMISATION (signature examinateur) — donnees, energie, materiel, budget

**Energie** :
- Pi 5 sous Electron + video = **5.7-6.8 W** (`[Hardware]` SPECS.md:69). Levier : ffmpeg `-r 15 -q:v 5` plafonne le decode ; passer a `-r 10` baisserait CPU/conso/temperature.
- Pas de DPMS (kiosk 24/7) -> **le backlight ecran domine le bilan energetique, hors SBC**. Arbitrage assume : disponibilite > economie d'energie de veille.
- SoC 65-75 C, marge 5-15 C avant throttle (80 C) avec Active Cooler.

**Place / pertinence materielle** :
- Boitier **29.3 mm** (profil SLIM) vs 40.7 mm avec NVMe HAT = **-28% d'epaisseur** en supprimant le M.2 HAT+, sans perte thermique. microSD au lieu de SSD = zero volume additionnel. `[Hardware]` SPECS.md:59-63.
- **Arbitrage Hailo** : le HAT IA occupe le slot PCIe/M.2 -> **incompatible SSD NVMe simultane** + necessite un dataset trichoscopique labellise (projet a part entiere). D'ou IA cloud en MVP. `[Audit-secu]` §6.
- Microscope WiFi mutualise **capture video + bouton physique sur une seule interface** -> pas de GPIO, pas de cablage, BOM simplifie.

**Donnees** :
- Retention : photos serveur 365j, photos locales 30j post-sync, QR 30j, logs 90j (`[CDCT]` §9). Minimisation RGPD.
- Sync **incrementale par checksum SHA-256**, cache medias <2 Go, lecture cache local (jamais CDN direct). 
- RAM miroir **<6 Go sur 8** (contrainte tendue) -> gate non negociable Electron (sinon bascule Chromium kiosk, -300/500 Mo).
- Codec : H.264 inter-frame pour preview fluide, JPEG/MJPEG intra-frame plein resolution pour l'analyse IA (nettete). AV1/H.266 rejetes (Pi5 sans decodage materiel AV1).

**Budget** (arbitrages chiffres) :
- Materiel **~1 035 EUR/unite** (avec ecran) = ~800 ecran + ~235 le reste (= ~180 hors ecran du CDCT + ~55). **Les deux sources concordent une fois l'ecran isole.**
- OpEx **55-115 EUR/mois** ; **HDS ecarte = -150 a -400 EUR/mois** (arbitrage : finalite cosmetique, pas de donnees de sante au sens MDR).
- IA cloud **~0,002 EUR/analyse** : honnetete budgetaire de l'audit -> **le cloud gagne au cout** ; l'on-device se justifierait par souverainete/reproductibilite/independance, **pas par le prix**. Dites-le : c'est un arbitrage assume, pas un oubli.

**Phrase signature pour le jury** : *"Chaque choix materiel est un arbitrage chiffre : -28% d'epaisseur en sacrifiant le NVMe, IA cloud a 0,002 EUR plutot qu'un Hailo a 220 EUR non amorti sur un MVP mono-boutique, et HDS ecarte pour -150 a -400 EUR/mois grace au cadrage cosmetique strict."*

## D) PREPARATION ORALE

### 12 questions de jury difficiles + reponses modeles

1. **"Vous dites que les photos ne sortent pas du local, mais l'IA est sur OpenRouter (US). Expliquez."**
 -> *"Le flux video live reste 100% local. Seuls des snapshots JPEG partent vers OpenRouter pour analyse — c'est un transfert hors UE que j'encadre par DPA + consentement explicite. La suppression totale du transfert passe par le CV on-device (OpenCV), que j'ai documente en roadmap P1."*

2. **"Vous affirmez que les photos sont chiffrees localement. Montrez la ligne de code."**
 -> *"Soyons exacts : le device token est chiffre via safeStorage, mais les photos sont aujourd'hui ecrites en clair (writeFileSync) et le crmBearerToken aussi. C'est un finding que j'ai identifie moi-meme dans mon audit ; le correctif P0 est de leur appliquer le meme pattern safeStorage/LUKS."*

3. **"C'est un diagnostic capillaire : donc un dispositif medical ?"**
 -> *"Non. Finalite strictement cosmetique, aucune allegation therapeutique, vocabulaire medical banni cote code (RG-010 : alopecie/inflammation/pathologie interdits), seuil 'non concluant' si confiance <60%. On reste hors MDR et hors RGPD art.9."*

4. **"npm audit renvoie 2 CVE hautes. Quel est votre process de veille ?"**
 -> *"Electron (window.open + injection switch) et fast-uri (path traversal). Remediation : npm audit fix + montee Electron 33->34. Pour industrialiser : CI avec npm audit + Semgrep + SBOM CycloneDX, conformement au CRA. Aujourd'hui c'est manuel, c'est ma priorite P1."*

5. **"Pourquoi Electron et pas Tauri, techniquement superieur ?"**
 -> *"Tauri 2 est meilleur sur le footprint (2-10 Mo vs centaines) et la RAM. Mais Rust + WebKitGTK pose un risque sur le glassmorphism (backdrop-filter) et sur le delai. J'ai retenu Electron avec une gate RAM non negociable (<6 Go sur Pi5) et documente Tauri comme voie de migration mesuree au Sprint 1."*

6. **"Vous annoncez 65+ tests : votre couverture reelle ?"**
 -> *"~35 unitaires sur 3 services parmi 9, plus 50+ scenarios E2E Playwright. La couverture unitaire est donc partielle (~30%, non mesuree faute de --coverage). Je connais cette dette : crm-sync, microscope, wifi et updater ne sont pas couverts. Mon plan : --coverage avec seuil en CI."*

7. **"Pas de CI/CD, pas de SemGrep : comment garantissez-vous la qualite avant merge ?"**
 -> *"Aujourd'hui c'est 100% manuel — c'est ma plus grosse dette d'industrialisation. Quick-win planifie : un workflow GitHub Actions unique (typecheck + vitest --coverage + npm audit + Semgrep + build arm64) qui ferme d'un coup 4 gaps : CI, SAST, SCA et build cross-arch."*

8. **"Que se passe-t-il si le WiFi ou le CRM tombe en pleine seance ?"**
 -> *"L'architecture est offline-first. La photo est ecrite sur disque immediatement, la seance bufferisee avec synced=false, et une file rejoue l'upload toutes les 30s, la sync CRM toutes les 60s. Le miroir parle a un backend Laravel local, jamais directement a la DB distante. La seance se termine meme totalement hors ligne."*

9. **"Vous parlez de diagramme UML : montrez-le."**
 -> *"J'ai modelise en Merise (MCD 9 tables, MCT) car ma methodo est Merise Agile. Pour le referentiel, j'ai ajoute trois diagrammes UML : cas d'usage, sequence du workflow seance, et deploiement. Les voici."* (NE dites ceci que si vous les avez produits — sinon, voir Partie 5b.)

10. **"Vous revendiquez first-mover, aucun concurrent. Vraiment ?"**
 -> *"Pas de concurrent direct sur le couplage microscope WiFi + IA + CRM en institut K-Beauty. Des acteurs adjacents existent : HiMirror/Care OS cote miroir, FotoFinder cote trichoscopie medicale, SkinConsult cote diagnostic cosmetique IA. Notre differenciation : le suivi longitudinal en boutique relie au CRM Shopify."*

11. **"Votre depot a fuite des secrets. Qu'avez-vous fait, et est-ce suffisant ?"**
 -> *"Deux secrets reels : un PAT GitHub dans l'email de 31 commits, et un token CRM en dur dans start.sh. J'ai backupe, reecrit l'historique avec git filter-repo, durci start.sh (.env + .gitignore), force-pushe. Mais nettoyer l'historique n'est que de l'hygiene : la vraie remediation, c'est la revocation du PAT et la rotation du token CRM, que je realise cote fournisseur. Le nettoyage protege les nouveaux visiteurs, la revocation neutralise les clones existants."*

12. **"Scaling a 100 salons : votre archi tient ?"**
 -> *"Le MVP cible 1 boutique, 1 tenant. L'isolation multi-tenant par boutique_id + RLS PostgreSQL est en place des le depart. Le scaling horizontal (load-balancer, replicas PG, CDN, Redis/Horizon, monitoring par tenant) est explicitement hors-scope MVP et documente en post-MVP. Le modele economique SaaS B2B par boutique finance cette montee en charge."*

### Minutage indicatif des 40 minutes

| Bloc | Minutes | Justification |
|---|---|---|
| Intro + presentation perso/pro (OHADJA/vous) + SWOT KBEAUTY | **4 min** | Cadre rapide, ne pas s'attarder |
| Partie 2 — contexte, PESTEL, veille | **4 min** | Poser le "pourquoi", desamorcer le first-mover |
| Partie 3 — CDCF (problematique/besoin/contrainte/solution) | **6 min** | Votre socle le plus solide, valorisez la tracabilite besoin->RG->test |
| Partie 3bis — devis / J/H / budget | **3 min** | Court mais chiffre (TCO, tiroirs) |
| Partie 4 — gestion de projet | **3 min** | Merise Agile justifiee, vous = chef de projet unique |
| Partie 5 — CDCT (archi, benchmarks, UML, securite, tests) | **12 min** | **Le coeur technique** : demo archi, MCD, benchmarks Electron/Tauri, securite |
| Section B — incident securite (integre dans P5/P6) | **3 min** | Votre moment fort, racontez l'histoire revocation vs hygiene |
| Section C — optimisation (chiffres) | **2 min** | Signature : 3 arbitrages chiffres max |
| Partie 6 — bilan, ameliorations, remerciements | **3 min** | Cloture, roadmap P0-P3, bilan perso = l'incident |
| **Demo live / marge** | **garder ~5 min de marge** sur les 40 + reserver le Q&A separement |

**Conseil de minutage** : si vous montrez une **demo du workflow seance** (Veille -> Consentement -> Session microscope -> Bilan -> QR), placez-la dans la Partie 5 et comptez 3-4 min ; reduisez d'autant les Parties 1-2.

---

## Synthese des contradictions/manques a NE PAS cacher au jury

1. **Cloud (code) vs on-device (audit)** : narratifs incompatibles — choisir.
2. **OHADJA absent** du depot — entreprise a presenter par vous seul.
3. **SWOT, PESTEL, veille, devis J/H, UML, planning sprints** : **tous absents** du repo — a produire.
4. **Divergences de specs** : Laravel 11/13, PHP 8.3/8.4, PG15/16, port IA 3001/3002, Jiusion/Ninyoon, microscope USB/WiFi, stack Bun/Supabase obsolete.
5. **CI/CD, SemGrep, SBOM, npm audit, pentest, playwright.config, ESLint flat config** : absents.
6. **Claims faux a corriger** : "photos chiffrees" (en clair), "pas de partage tiers / local only" (OpenRouter US).
7. **"65+ tests"** vs ~35 unitaires reels (3/9 services).
8. **Reecriture d'historique** : 36 commits aujourd'hui, dates non representatives du dev reel — assumer.

Fichiers sources cles (chemins absolus) : `C:\Users\adria\Documents\Projets\PROJET\projet-miroirIoT\CDC_DreamTech.md`, `...\CDC_Technique_SmartMirror_Final.md`, `...\smart_mirror_specs_techniques.md`, `...\README.md`, `...\docs\DEFENSE-JURY.md`, `...\docs\PROJET-MVP.md`, `...\smart-mirror\start.sh`, `...\smart-mirror\.env.example`, `...\.gitignore`, `...\smart-mirror\mirror-app\src\main\index.ts`, `...\smart-mirror\mock-api\{server.js,init.sql}`, `...\smart-mirror\enclosure\SPECS.md`, `...\figma-exports\docs\*.md`, `C:\Users\adria\Documents\Projets\PROJET\AUDIT_DECISIONS_SmartMirror_KBEAUTY.md`.