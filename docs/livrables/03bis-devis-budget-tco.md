# Devis en tiroirs, budget et TCO 3 ans — Miroir connecte KBEAUTY

> Responsable chiffrage : Adriano (chef de projet unique).
> Methodologie : Merise Agile + TDD. Les agents BYAN sont un outillage IA d'assistance, jamais une equipe humaine.
> Perimetre MVP soutenance : 1 boutique / 1 tenant. Cible commerciale : 6 miroirs / 3 boutiques (Nice, Lyon, Cannes).
> Editeur / prestataire : [A COMPLETER : identite et activite d'OHADJA, statut juridique, SIRET].

---

## 1. Decoupage de l'effort en 8 tiroirs (jours-homme)

Estimation ascendante, justifiee par la complexite reelle mesuree dans le code (volume de lignes, nombre de services, gaps a combler). Le chiffrage couvre la mise au niveau production du MVP existant, pas une reecriture.

| # | Tiroir | Perimetre observe dans le code | J/H | Justification |
|---|--------|-------------------------------|-----|----------------|
| 1 | **Device / Electron** | Electron 33 + React 19 + TS 5.7 + Zustand 5 ; 9 ecrans (Accueil, Home, Consent, NewClient, SearchClient, Session, Comparison, QRCode, Provisioning), 10 composants, ~2 400 LOC renderer ; IPC contextBridge (handlers 371 LOC, preload 93 LOC) | **22** | Coeur applicatif deja avance ; effort = stabilisation UI tactile 32", gestion clavier virtuel, MediaPlayer, durcissement IPC |
| 2 | **Backend Laravel + DB** | Mock local Express + PostgreSQL 15 (server.js 550 LOC) a remplacer par integration CRM Laravel/Sanctum distant (api-kbeauth.a3n.fr) ; PAS de Redis | **18** | Le mock simule le backend ; effort reel = contrat d'API ferme, auth Sanctum, mapping clients/sessions, idempotence, pagination |
| 3 | **Service IA / proxy** | Proxy IA port 3001, 100 % cloud via OpenRouter (datacenter US) ; ~0,002 EUR/analyse | **10** | Proxy fin mais sensible : gestion cles, file d'attente, retry, timeouts, masquage erreurs, journalisation conforme |
| 4 | **Microscope / proxy video** | microscope.service.ts (115 LOC), USB UVC par defaut (conforme au code) ; WiFi en option, double-WiFi NON implemente (wifi.service.ts ne gere que wlan0) | **12** | Capture flux UVC, snapshot JPEG, latence ; codec a documenter (cf. encadre Pi5) |
| 5 | **UX / Figma** | 9 ecrans + design system verre (GlassCard, GlassButton, AnimatedBackground) | **14** | Maquettes Figma normees, parcours tactile institut, accessibilite, etats vides/erreurs |
| 6 | **Tests / CI / securite** | 170 cas reels (34 unitaires Vitest + 136 E2E Playwright sur 4 specs) ; 3/8 services couverts ; crm-sync.service.ts (372 LOC) a **0 test** ; manquent CI .github/workflows, config couverture, playwright.config.ts, ESLint 9 flat (lint casse) ; gaps : JPEG en clair (sync.service.ts:61), sandbox:false (index.ts:51), CSP absente, tokens CRM en clair, config:getAll expose le store | **26** | Tiroir le plus lourd : combler les gaps securite + couvrir crm-sync + mettre en place la chaine CI/lint/coverage. npm audit (2 CVE) a re-verifier la veille de l'oral |
| 7 | **Provisioning / boitier 3D** | ProvisioningScreen + QRCodeScreen ; boitier PETG imprime profil SLIM (-28 % d'epaisseur, HAT NVMe supprime) | **9** | Flow d'enrolement, QR, impression 3D iteree, montage/cablage |
| 8 | **Gestion de projet** | Pilotage, Merise Agile, redaction livrables, recette client, coordination | **14** | ~12 % de l'effort technique, conforme a un projet de cette taille |
| | **TOTAL** | | **125 J/H** | |

> **Note d'arrondi** : repartition 125 J/H. Marge de gestion incluse dans le tiroir 8. Aucune contingence supplementaire chiffree ici ; en ajouter 10-15 % si engagement au forfait.

---

## 2. Cout de developpement (CapEx logiciel)

TJM en parametre. **[A COMPLETER : TJM d'OHADJA / Adriano, ex. 350-500 EUR/j].**

| Total J/H | TJM bas (350 EUR) | TJM median (425 EUR) | TJM haut (500 EUR) |
|-----------|-------------------|----------------------|--------------------|
| 125 | **43 750 EUR** | **53 125 EUR** | **62 500 EUR** |

Formule : `Cout dev = 125 J/H x TJM`. Le devis ferme retiendra une seule ligne TJM validee par Adriano.

---

## 3. BOM materiel par miroir (CapEx materiel)

Prix unitaires corriges (contexte crise RAM juin 2026). Fourchettes basse/haute.

| Composant | Specification | Prix bas (EUR) | Prix haut (EUR) |
|-----------|---------------|----------------|-----------------|
| Carte | Raspberry Pi 5 4 Go (decision conditionnee a mesure 48h) | 150 | 200 |
| Alimentation | 27 W officielle | 12 | 12 |
| Refroidissement | Refroidisseur actif | 8 | 8 |
| Stockage | microSD | 15 | 15 |
| Boitier | PETG imprime, profil SLIM | 5 | 5 |
| Microscope | USB UVC | 45 | 45 |
| **Ecran** | **Shineworld 32" (INCERTITUDE majeure)** | **700** | **900** |
| Connectique | Dongle / cables | 25 | 25 |
| **Sous-total / miroir** | | **960 EUR** | **1 210 EUR** |

> **Decision RAM (a presenter comme ingenierie, pas comme fait)** : le footprint mesure dans le code est ~1,3-2,2 Go avec Docker on-device. 4 Go est retenu pour le MVP ; 8 Go serait sur-dimensionne. Decision a **confirmer par une mesure 48h** (`free -m` + VmRSS) avant commande de parc.

### Total parc (6 miroirs)

| | Prix bas | Prix haut |
|---|---------|-----------|
| 6 x miroir | 5 760 EUR | 7 260 EUR |

> **ALERTE CHIFFRAGE** : l'ecran Shineworld 32" represente ~73-74 % du BOM unitaire. C'est **la vraie incertitude du TCO**. Une variation de 200 EUR/ecran fait bouger le parc de 1 200 EUR. **A chiffrer par devis ferme fournisseur** avant tout engagement budgetaire. Tout le reste du BOM est stable.

---

## 4. OpEx mensuel (parc cible)

| Poste | Detail | Mensuel bas (EUR) | Mensuel haut (EUR) |
|-------|--------|-------------------|--------------------|
| VPS | Scaleway (backend / proxy) | 45 | 70 |
| Stockage | Volume + objets | 5 | 12 |
| Sauvegarde | Backup gere | 5 | 10 |
| IA | OpenRouter (~0,002 EUR/analyse) | 15 | 40 |
| Domaine | Nom de domaine (lisse) | 1 | 2 |
| **Total OpEx / mois** | | **71 EUR** | **134 EUR** |

> L'IA reste cloud US en V1 : conformite RGPD Chapitre V requise (DPA art.28 + clauses de transfert DPF/SCC art.46 + TIA Schrems II ; consentement explicite art.9(2)(a) si donnees de sante traitees). La roadmap (non implementee) prevoit une analyse CV on-device (OpenCV) ne faisant sortir que des scores anonymises, ce qui reduirait l'OpEx IA et le risque de transfert.

---

## 5. TCO 3 ans

`TCO = CapEx (dev + materiel parc 6 miroirs) + OpEx x 36`

Scenario median retenu : TJM 425 EUR, prix materiel et OpEx milieu de fourchette (parc 6 510 EUR, OpEx ~102 EUR/mois).

| Poste | Bas | Median | Haut |
|-------|-----|--------|------|
| CapEx dev (125 J/H) | 43 750 | 53 125 | 62 500 |
| CapEx materiel (6 miroirs) | 5 760 | 6 510 | 7 260 |
| **Total CapEx** | **49 510** | **59 635** | **69 760** |
| OpEx x 36 mois | 2 556 | 3 690 | 4 824 |
| **TCO 3 ans** | **52 066 EUR** | **63 325 EUR** | **74 584 EUR** |

Detail OpEx : bas = 71 x 36 = 2 556 ; median ~102,5 x 36 = 3 690 ; haut = 134 x 36 = 4 824.

> **Lecture** : le developpement (CapEx dev) pese 84-89 % du TCO. Le materiel pese ~10 %, l'OpEx ~5-6 %. La sensibilite la plus forte cote materiel reste **l'ecran 32"** ; cote global, c'est le **TJM** qui pilote le TCO. Les deux variables a verrouiller avant signature sont donc le **TJM** (devis interne) et le **prix ecran ferme** (devis fournisseur).

---

## 6. Reserves et conditions

- **Ecran** : seul poste materiel a chiffrer fermement ; toute valeur ci-dessus est indicative tant que le devis Shineworld n'est pas signe.
- **RAM 4 Go** : decision d'ingenierie conditionnee a une mesure 48h, pas un fait acquis.
- **Securite** : le chiffrage du tiroir 6 suppose la fermeture des gaps reels (JPEG en clair, sandbox:false, CSP absente, tokens en clair, config:getAll). Les fondations sont correctes (contextIsolation true, nodeIntegration false, preload contextBridge, IPC). 2 CVE a re-verifier via `npm audit` la veille de l'oral.
- **Conformite** : MDR exclu (finalite cosmetique, aucune allegation therapeutique) — solide. RGPD art.9 : position **fragile** (donnee deductible, CJUE C-184/20) → approche par precaution. HDS : decision **provisoire** sous reserve d'avis DPO. RED art.3.3 applicable (depuis 01/08/2025). CRA : signalement vuln 11/09/2026, SBOM 11/12/2027.
- **Codec video** : le Pi 5 (BCM2712) decode HEVC/H.265 4K60 en hardware uniquement ; H.264, VP9 et AV1 sont en logiciel/CPU ; aucun encodeur hardware. A integrer dans la conception du flux microscope (tiroir 4).
- **Marche** : differenciation = integration verticale (microscope bas cout + IA + CRM Shopify) en institut K-beauty premium. Concurrents reels : L'Oreal/Kerastase K-Scan, BECON (Samsung), FotoFinder, Aram Huvis ARAMO, CareOS Poseidon, HiMirror. Ne pas affirmer "aucun concurrent".
- **Stack** : la stack Bun/Supabase/Budibase/Vercel mentionnee dans smart_mirror_specs_techniques.md est obsolete/abandonnee. Stack reelle : Electron 33 + React 19 + TS 5.7 + Zustand 5 (electron-vite, electron-builder arm64+x64) cote device ; Node 20 + Express + PostgreSQL 15 cote mock ; CRM Laravel/Sanctum distant ; proxy IA port 3001 ; pas de Redis.

---

*Devis a finaliser une fois le TJM arrete par Adriano et le devis ecran obtenu. Remerciements et parcours : [A COMPLETER].*
