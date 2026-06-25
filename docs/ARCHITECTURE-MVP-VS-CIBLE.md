# ARCHITECTURE - MVP REALISE vs CIBLE ROADMAP

## Source de verite de la stack technique (DreamTech Smart Mirror)

> Document pivot d'architecture, declare SOURCE DE VERITE unique de la stack du projet.
> Toute autre documentation (README, DEFENSE-JURY, PROJET-MVP, livrables) doit etre alignee sur ce fichier en cas de divergence.
>
> Date de redaction : 2026-06-25
> Candidat : Adriano (B3, preparation au titre RNCP 37046)
> Titre vise : RNCP 37046 - Chef de projet en solutions logicielles pour l'internet des objets (IoT) (niveau 6)
> Blocs principalement servis : BC02 (conception d'architecture), BC05 (maintenir et faire evoluer)
> Statut : approche documentaire pure - AUCUN code Laravel ecrit a ce stade.

---

## Regle de lecture transverse (convention typographique)

Chaque brique de la stack est classee dans l'un des trois etats suivants, sans ambiguite :

| Etat | Definition | Exigence de preuve |
|------|------------|--------------------|
| **REALISE** | Code present, executable et verifie dans le depot | Reference `fichier:ligne` obligatoire |
| **EN COURS** | Chantier actif, partiellement implemente | Reference `fichier:ligne` de l'existant + ecart restant |
| **CIBLE** | Decision d'architecture documentee, non encore codee | Etiquette explicite `[CIBLE ROADMAP - non implemente]` + horizon |

Principe d'honnetete : une CIBLE n'est JAMAIS presentee comme realisee. Un jury qui lit le code ne doit trouver aucune affirmation invalidee par une lecture du depot.

---

## 1. Tableau maitre tri-etat par brique

Le tableau ci-dessous est la reference canonique. Chaque ligne REALISE porte une preuve `fichier:ligne` ; chaque ligne CIBLE porte l'etiquette d'horizon.

| Brique | REALISE (preuve fichier:ligne) | EN COURS | CIBLE (horizon) |
|--------|--------------------------------|----------|-----------------|
| **Frontend / Device** | Electron 33 + React 19, kiosque tactile Raspberry Pi ; sandbox actif (`index.ts:51`), CSP en production (`index.ts:121-143`, garde `if !is.dev`) | - | Inchange (pas de reecriture prevue) |
| **Backend** | Mock Express : API metier port 8100 + proxy IA mock port 3001 (`server.js`, `docker-compose.yml`) ; SQL brut via `pg` (`pool.query`), aucun ORM | - | `[CIBLE ROADMAP - non implemente]` Laravel 13 / PHP 8.4, port 8000, Eloquent + migrations versionnees (horizon : refonte backend post-MVP) |
| **Base de donnees** | PostgreSQL 15-alpine conteneurise (`docker-compose.yml`), 9 tables, SQL brut (`init.sql`) | - | `[CIBLE ROADMAP - non implemente]` PostgreSQL 16 + pgcrypto sur colonnes sensibles (horizon : alignee sur la bascule Laravel) |
| **Cache / Queue** | Fichier JSON local `/var/smart-mirror/sync-queue.json`, polling 30s, heartbeat 60s (`sync.service.ts`) ; aucun broker | - | `[CIBLE ROADMAP - non implemente]` Redis 7 (Laravel Queue/Horizon + cache + rate-limit + locks) ; absent du `docker-compose` actuel (horizon : avec Laravel) |
| **Auth** | Echange MAC + token_device -> Bearer artisanal (`crm-sync.service.ts`) ; device.token persiste chiffre au repos en AES-256-GCM via cryptoVault (`config.service.ts`, `crypto-vault.service.ts`) ; plus de fallback plaintext, safeStorage retire | - | `[CIBLE ROADMAP - non implemente]` Laravel Sanctum, tokens revocables par device, abilities/scopes par miroir (horizon : avec Laravel) |
| **IA / Vision** | MOCKEE : scores `Math.random` + commentaire en dur (`server.js:514-545`), modele cosmetique `'google/gemini-flash-1.5'`, aucun appel reseau reel | - | `[CIBLE ROADMAP - non implemente]` OpenRouter, vrai LLM vision avec score de confiance + benchmark modeles (horizon : post-MVP, encadrement RGPD/HDS requis) |
| **Microscope** | WiFi / TCP `192.168.34.1:8080`, handshake protocole JHCMD, flux H.264 transcode par ffmpeg en MJPEG sur `localhost:9100` (`proxy.js`) ; USB/UVC/V4L2 = vestiges morts | - | Inchange (le materiel et le protocole restent en WiFi) |
| **Workflows** | Generation PDF de seance SYNCHRONE in-process via pdfkit (`server.js:308-388`) ; commentaire `In production, this triggers n8n webhook` (`server.js:198`) non branche | - | `[CIBLE ROADMAP - non implemente]` n8n + Laravel Queue (orchestration webhook fin de seance) (horizon : avec Redis/Laravel) |
| **Integrations** | CRM generique (echange Bearer, push clientes/consentements/seances/photos via `crm-sync.service.ts`) | - | `[CIBLE ROADMAP - non implemente]` Shopify (catalogue + recommandations issues du diagnostic) (horizon : post-MVP) |
| **Chiffrement** | Sur le device : photos cuir chevelu, file de synchronisation et tokens (device.token, crmToken, crmBearerToken) CHIFFRES AU REPOS en AES-256-GCM via cryptoVault (`crypto-vault.service.ts`, ecriture `.jpg.enc` dans `sync.service.ts` `savePhotoLocally`, dechiffrement avant push CRM dans `crm-sync.service.ts` `pushPhotoCrm`, secrets dans `config.service.ts`) ; cle maitre par priorite env -> systemd-creds (TPM) -> keyfile -> fallback dev, THROW explicite en prod sans cle | Backend mock encore a securiser (PDF de seance servi sans protection, secrets en dur, device_token non hache) ; audit deps CI non bloquant (`ci.yml` `continue-on-error`) -> a rendre bloquant apres `npm audit fix` | `[CIBLE ROADMAP - non implemente]` pgcrypto sur colonnes sensibles, object storage chiffre, chiffrement de volume hebergeur, HDS UE/EEE |
| **Tests** | 42 tests unitaires Vitest (dont `crypto-vault.service.test.ts` = 7 tests, avec les preuves "le JPEG ecrit sur disque ne commence pas par FF D8" et "le store ne contient pas le token en clair") + 136 cas e2e Playwright (4 fichiers) = 178 cas ; 4/9 services main couverts ; `crm-sync.service.ts` (372 l) = 0 test | Renforcement BC04 : tests crm-sync, integration backend ; audit deps CI a rendre bloquant apres `npm audit fix` | `[CIBLE ROADMAP - non implemente]` CI bloquante (audit SCA, Semgrep, scan secrets), seuils de couverture, scan image conteneur (horizon : vague de durcissement BC04) |
| **Securite plateforme** | sandbox actif (`index.ts:51`), CSP en production (`index.ts:121-143`), CI GitHub Actions (`ci.yml`), ESLint flat config, `playwright.config` | Audit deps CI non encore bloquant (`ci.yml` `continue-on-error`) -> bascule bloquante apres `npm audit fix` | `[CIBLE ROADMAP - non implemente]` protection de branche, DAST, scan conteneur (horizon : durcissement BC04) |
| **Consentement RGPD** | Verrouille cote schema (`init.sql` FK `consentement_id NOT NULL`) ET cote serveur (`server.js:166-177` refuse une seance sans consentement valide) | Verrouillage additionnel par test d'integration backend | Inchange (regle deja en place) |

---

## 2. Justification de chaque techno cible (triptyque probleme -> limite -> solution)

Chaque techno cible est justifiee par un point de douleur OBSERVE dans le code MVP, et non par une preference abstraite. Le format est : probleme constate -> limite de l'existant -> solution cible (+ alternative ecartee quand pertinent).

### 2.1 Laravel 13 / PHP 8.4 `[CIBLE ROADMAP - non implemente]`

- **Probleme** : la logique metier est ecrite en SQL brut via `pool.query` dans un seul fichier (`server.js`, ~550 lignes), sans ORM, sans migrations versionnees, sans couche de validation structuree.
- **Limite** : impossible de versionner proprement le schema, de tester unitairement les modeles, de tracer l'evolution de la base ; toute evolution de schema est manuelle et risquee.
- **Solution** : Eloquent (modeles + relations), migrations versionnees, FormRequest pour la validation, structure MVC testable.
- **Alternative ecartee** : rester en Express. Ecartee car Express n'offre nativement ni Sanctum, ni systeme de queues integre, ni migrations, ce qui imposerait d'assembler et maintenir un patchwork de bibliotheques.

### 2.2 Laravel Sanctum `[CIBLE ROADMAP - non implemente]`

- **Probleme** : l'authentification actuelle est un echange artisanal MAC + token_device produisant un Bearer (`crm-sync.service.ts`), le token n'etant pas revocable proprement.
- **Limite** : en cas de vol ou de mise au rebut d'un miroir, impossible de revoquer finement l'acces de ce seul device ; pas de gestion de portee (scopes) par miroir.
- **Solution** : Sanctum, tokens revocables par device, abilities/scopes par miroir, revocation individuelle immediate.
- **Alternative ecartee** : JWT. Ecartee car un JWT est irrevocable avant expiration, ce qui est inacceptable pour un parc de devices physiques exposes au vol.

### 2.3 PostgreSQL 16 `[CIBLE ROADMAP - non implemente]`

- **Probleme** : PostgreSQL 15 actuel n'a aucune colonne chiffree (aucun `pgcrypto`) ; les champs sensibles (email, telephone, date de naissance) sont en clair (`init.sql`).
- **Limite** : pas de defense en profondeur cote base ; une fuite de dump expose directement les donnees personnelles.
- **Solution** : PostgreSQL 16 + extension pgcrypto sur les colonnes sensibles, chiffrement applicatif gere cote application (cle hors requete SQL).
- **Note** : la montee 15 -> 16 est mineure en soi ; elle est groupee avec la bascule Laravel et l'introduction du chiffrement colonne.

### 2.4 Redis 7 `[CIBLE ROADMAP - non implemente]`

- **Probleme** : la file de synchronisation est un simple fichier JSON local interroge toutes les 30 secondes (`sync.service.ts`) ; la generation PDF est synchrone et bloque la requete (`server.js:308-388`).
- **Limite** : polling couteux, pas de retry/backoff robuste, le flag booleen `syncing` ne survit pas a un crash, aucun mecanisme de lock ni de deduplication.
- **Solution** : Redis 7 comme backing store unique couvrant quatre roles (queue, cache, rate-limit, locks). Detaille en section 3.
- **Alternative ecartee** : conserver le fichier JSON. Ecartee car il ne resiste pas aux crashs et ne supporte pas l'orchestration de jobs idempotents.

### 2.5 Shopify `[CIBLE ROADMAP - non implemente]`

- **Probleme** : l'integration CRM actuelle est generique, sans lien entre le diagnostic capillaire et un catalogue produit.
- **Limite** : impossible de transformer le diagnostic en recommandation e-commerce actionnable (vente de soins K-Beauty adaptes).
- **Solution** : Shopify, recommandations produits issues directement du diagnostic IA, integration verticale diagnostic -> catalogue -> vente.

### 2.6 n8n `[CIBLE ROADMAP - non implemente]`

- **Probleme** : le code contient un commentaire `In production, this triggers n8n webhook` (`server.js:198`) alors que la generation PDF reste synchrone in-process, sans aucun webhook.
- **Limite** : aucune orchestration des actions post-seance (PDF, QR, envoi rapport, notifications) ; tout est couple a la requete HTTP.
- **Solution** : n8n declenche par webhook en fin de seance, orchestrant la chaine post-seance de maniere decouplee et observable.

### 2.7 OpenRouter `[CIBLE ROADMAP - non implemente]`

- **Probleme** : l'analyse IA est entierement mockee (`server.js:514-545`, scores `Math.random`), aucun appel a un vrai modele.
- **Limite** : aucune valeur de diagnostic reelle ; le score affiche est aleatoire.
- **Solution** : OpenRouter, vrai LLM vision produisant un diagnostic avec score de confiance, persistance de `diagnostic_ia`/`modele_ia`/`latence_ms`, benchmark des modeles.
- **Garde-fou RGPD/HDS** : envoyer une photo de cuir chevelu a OpenRouter (routage possible vers des fournisseurs US) constitue un transfert hors UE de donnee potentiellement de sante (art. 9 RGPD). A encadrer obligatoirement : Zero Data Retention, routage EU in-region, garanties contractuelles (SCC), ou minimisation (recadrage/transmission de features plutot que l'image brute).

---

## 3. Pourquoi Redis : 8 jobs asynchrones candidats

Redis n'est pas ajoute pour suivre une mode mais parce qu'un SEUL service couvre quatre besoins : (1) backing store de Laravel Queue/Horizon, (2) cache (sessions, reponses CRM, recherche cliente cross-miroir), (3) rate limiting, (4) locks de synchronisation. Chaque job candidat est ancre sur un point de douleur present et identifiable dans le code actuel.

| # | Job asynchrone candidat | Point de douleur actuel (code) |
|---|--------------------------|--------------------------------|
| 1 | Generation PDF de seance | Synchrone pdfkit in-process (`GET /api/seances/:id/rapport`, `server.js:308-388`, `/tmp/rapports`) : bloque la requete HTTP |
| 2 | Generation + envoi QR code + lien rapport | Chaine apres PDF (`server.js:394-409`) ; envoi differe email/SMS non orchestre |
| 3 | Push CRM/Shopify de la seance + dependances | Boucle synchrone poll 30s (`crm-sync.service.ts` `syncAll`/`syncSessionNow`) ; le flag booleen `syncing` ne survit pas a un crash -> cible : jobs idempotents + backoff + dedupe + lock Redis |
| 4 | Analyse IA differee OpenRouter | Mock `setTimeout` aleatoire (`server.js:514-545`) -> cible : upload + LLM + persistance `diagnostic_ia`/`modele_ia`/`latence_ms` avec retry/timeout |
| 5 | Sync offline -> online catch-up | File JSON locale (`sync.service.ts` `processQueue`) -> cible : reconciliation en masse avec ordonnancement FK |
| 6 | Upload photos vers stockage backend | Multipart synchrone timeout 30s (`crm-sync.service.ts` `pushPhotoCrm`) -> cible : job upload + chiffrement + miniatures |
| 7 | Envoi rapport client (email/SMS) + notifications | Non implemente -> cible : job post-PDF (n8n/mailer) avec retry |
| 8 | Purge photos expirees (retention 30j) + purge RGPD | `setInterval` local (`cleanupExpiredPhotos`, `sync.service.ts`) -> cible : job planifie scheduler + queue |

**Conclusion** : un unique service Redis 7 couvre queue + cache + rate-limit + locks. Cela justifie son ajout au `docker-compose` cible, alors qu'il est totalement absent du depot aujourd'hui (aucune dependance, aucun conteneur Redis). `[CIBLE ROADMAP - non implemente]`

---

## 4. Schema de migration mock Express -> Laravel (strangler-fig)

La bascule est progressive (strangler-fig) : le mock Express reste le CONTRAT d'API que Laravel reimplante endpoint par endpoint. Le frontend Electron ne change pas ; il continue d'appeler le meme contrat pendant toute la transition.

### 4.1 Les trois axes de la bascule

- **(A) Endpoints** : les routes `/miroir/*` deja appelees par `crm-sync` (auth, heartbeat, clientes, consentements, seances, `seances/:id/fin`, `seances/:id/rapport`, photos) ainsi que les routes metier mock (port 8100) sont reimplantees en controllers/routes Laravel versionnees, iso-contrat (memes URLs, memes payloads, memes codes de retour).
- **(B) Donnees** : les 9 tables de `init.sql` (boutiques, clientes, consentements, miroirs, seances, photos, produits, medias, config_miroir) deviennent des migrations Eloquent + modeles, en conservant la contrainte RGPD FK `consentement_id NOT NULL` (`init.sql:59`, `server.js:166-177`) repliquee a la fois en validation applicative et en cle etrangere.
- **(C) Mecanismes** : auth MAC+token -> Sanctum ; file JSON poll 30s -> Laravel Queue/Horizon sur Redis ; PDF synchrone -> job + DomPDF/n8n ; IA mock -> le proxy Express IA est conserve mais branche sur OpenRouter.

### 4.2 Ordre de bascule par criticite

```
1. Auth        (Sanctum reimplante l'echange MAC+token)
2. Lecture     (GET clientes, consentements, seances)
3. Ecriture    (POST/PUT seances, photos, avec garde-fou consentement)
4. Jobs        (PDF, push CRM, IA, purge -> Queue/Horizon sur Redis)
```

Strategie de coexistence : pendant la transition, le mock Express et Laravel servent le MEME contrat. On bascule un endpoint vers Laravel uniquement quand sa parite est prouvee, ce qui evite tout big-bang.

### 4.3 Diff infrastructure docker-compose

```
ACTUEL (REALISE)                 CIBLE [CIBLE ROADMAP - non implemente]
-----------------                ----------------------------------------
postgres:15-alpine          ->   postgres:16
mock-api (Express :8100)    ->   laravel-app (:8000)
mock-ia  (Express :3001)    ->   mock-ia conserve, branche OpenRouter
adminer                     ->   adminer
(aucun Redis)               ->   redis:7
(aucun worker)              ->   worker Horizon
(aucun n8n)                 ->   n8n
```

---

## 5. Discours "MVP vs cible" pour le jury

### 5.1 Phrase-cadre

> "Le MVP demontre la chaine de bout en bout avec un backend mock Express / PostgreSQL 15 fonctionnel et teste ; la cible Laravel 13 / PostgreSQL 16 / Redis 7 est documentee en roadmap, et je justifie chaque choix par un point de douleur observe dans le MVP."

### 5.2 Argumentaire "pourquoi ne pas avoir code Laravel maintenant"

- **Maitrise du contrat d'abord** : le mock fige le contrat d'API, ce qui permet une bascule endpoint par endpoint sans renegocier l'interface avec le frontend.
- **Priorisation P0** : la securite et le chiffrement des photos de cuir chevelu (donnee potentiellement de sante) passent AVANT une reecriture backend. Reecrire le backend sans avoir chiffre les donnees serait une mauvaise priorisation.
- **Eviter le big-bang** : une reecriture totale en une fois est un risque d'architecte ; le strangler-fig est une decision assumee et tracable.
- **Rattachement aux blocs** : ce raisonnement nourrit BC02 (choix d'architecture cible justifies) et BC05 (strategie d'evolution maitrisee).

### 5.3 Reponses honnetes aux questions pieges (extrait)

| Question du jury | Reponse honnete |
|------------------|-----------------|
| "Votre IA fonctionne reellement ?" | "Non, elle est mockee (`server.js:514-545`, scores `Math.random`). OpenRouter est la cible. Le mock valide le flux et le contrat d'API ; brancher un vrai LLM vision est un job asynchrone identifie." |
| "Le microscope est-il en USB ?" | "Non, en WiFi/TCP (`192.168.34.1:8080`, protocole JHCMD), flux H.264 transcode par ffmpeg en MJPEG sur `localhost:9100`. La doc disant USB etait une erreur corrigee ; il reste des vestiges UVC/V4L2 morts." |
| "Avez-vous des queues Redis ?" | "Pas encore. La file actuelle est un fichier JSON poll a 30s (`sync.service.ts`). Je sais exactement quels 8 jobs y migreront et pourquoi : chacun a un point de douleur synchrone ou fragile dans le code." |
| "Les photos sont-elles chiffrees ?" | "Oui, au repos sur le device : `sync.service.ts` `savePhotoLocally` ecrit un `.jpg.enc` chiffre AES-256-GCM via cryptoVault (`crypto-vault.service.ts`), la file de sync est chiffree aussi, et `crm-sync.service.ts` dechiffre avant le push CRM. La cle maitre vient de systemd-creds (TPM) en prod, avec THROW explicite si absente. Reste a faire : securiser le backend mock, pgcrypto en base, et rendre l'audit deps CI bloquant." |
| "Combien de tests ?" | "42 unitaires Vitest et 136 e2e Playwright, soit 178 cas, et non 65. Le nouveau `crypto-vault.service.test.ts` (7 tests) prouve notamment que le JPEG sur disque ne commence pas par FF D8 et que le store ne contient pas le token en clair. `crm-sync.service.ts` (372 lignes) est encore a 0 test : c'est le trou que je renforce en BC04." |
| "Tournez-vous Laravel ?" | "Non, mock Express + PostgreSQL 15 (`server.js`, `docker-compose`), pas de `composer.json` ni d'`artisan`. Laravel 13/PHP 8.4 est la cible ; j'ai fige le contrat pour basculer en strangler-fig." |

---

## 6. Faits verifies (rappel de coherence)

Cette section recapitule les invariants que toute autre documentation doit respecter. En cas de divergence, ce document fait foi.

- BACKEND REALISE = mock Express `server.js` (API metier port 8100, IA mock port 3001) + PostgreSQL 15-alpine, SQL brut via `pg` ; zero Laravel/Sanctum/Redis/ORM.
- IA REALISEE = MOCKEE (`server.js:514-545`, scores `Math.random`, modele cosmetique `'google/gemini-flash-1.5'`, aucun appel OpenRouter reel).
- MICROSCOPE REALISE = WiFi/TCP `192.168.34.1:8080`, handshake JHCMD, H.264 transcode ffmpeg -> MJPEG `localhost:9100` (`proxy.js`) ; USB/UVC/V4L2 = vestiges morts.
- SYNC REALISE = fichier JSON `/var/smart-mirror/sync-queue.json` poll 30s, heartbeat 60s (`sync.service.ts`) ; pas de broker.
- CHIFFREMENT REALISE = sur le device, photos cuir chevelu (`.jpg.enc`), file de synchronisation et tokens (device.token, crmToken, crmBearerToken) CHIFFRES AU REPOS en AES-256-GCM via cryptoVault (`crypto-vault.service.ts`, `sync.service.ts`, `crm-sync.service.ts`, `config.service.ts`) ; plus de safeStorage ni de branche plaintext ; cle maitre env -> systemd-creds (TPM) -> keyfile -> fallback dev, THROW en prod sans cle. RESTE A FAIRE (EN COURS / CIBLE) : securisation du backend mock (PDF de seance, secrets en dur, device_token non hache), pgcrypto sur colonnes sensibles, audit deps CI bloquant.
- SECURITE REALISEE = sandbox actif (`index.ts:51`) + CSP en production (`index.ts:121-143`) + CI GitHub Actions (`ci.yml`) + ESLint flat config + `playwright.config`.
- CONSENTEMENT RGPD = verrouille (`init.sql` FK `consentement_id NOT NULL` + `server.js:166-177`).
- TESTS REALISES = 42 unitaires Vitest (dont `crypto-vault.service.test.ts` = 7 tests) + 136 e2e Playwright (4 fichiers) = 178 cas ; 4/9 services main couverts ; `crm-sync.service.ts` (372 l) = 0 test. JAMAIS "65+".
- PORTS = API metier 8100, IA mock 3001.
- CIBLE/ROADMAP a etiqueter explicitement : Laravel 13/PHP 8.4 + Sanctum, PostgreSQL 16, Redis 7, IA reelle OpenRouter, Shopify, n8n, audit deps CI bloquant, chiffrement P0 des photos.

---

*Fin du document. Source de verite de la stack DreamTech Smart Mirror. Toute documentation divergente doit etre realignee sur ce fichier (BC02 conception d'architecture, BC05 strategie d'evolution).*
