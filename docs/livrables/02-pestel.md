# Analyse PESTEL — Smart Mirror KBEAUTY

> Projet : miroir connecte de diagnostic capillaire/cutane pour institut K-beauty premium.
> Perimetre MVP de soutenance : 1 boutique / 1 tenant. Cible commerciale : 6 miroirs / 3 boutiques (Nice, Lyon, Cannes).
> Client : KBEAUTY / K Beauty Cosmetics (cosmetiques coreens, e-commerce Shopify, mailing Klaviyo, service premium "Bubble Hair Spa").
> Chef de projet unique : Adriano. Methodologie : Merise Agile + TDD.

---

## P — Politique

| Facteur | Impact | Implication projet |
|---------|--------|--------------------|
| Souverainete numerique / "Cloud de confiance" promu par l'Etat FR et l'UE | Menace | L'IA passe par OpenRouter (datacenter US) : tension avec la doctrine "Cloud au centre" de la commande publique et la pression croissante des grands comptes sur l'hebergement EU. Argument de vente fragilise face a un institut soucieux d'image. |
| Tensions commerciales UE-US (suite Schrems II, avenir du DPF) | Menace | Une invalidation du Data Privacy Framework rendrait le transfert des snapshots JPEG hors UE non conforme du jour au lendemain. Mitigation : roadmap CV on-device (OpenCV) prevue mais non implementee en V1. |
| Soutien public a la relocalisation electronique / IA souveraine | Opportunite | La trajectoire "snapshots traites on-device, seuls des scores anonymises sortent" s'aligne sur les aides et labels souverainete (argument differenciant a moyen terme). |

---

## E — Economique

| Facteur | Impact | Implication projet |
|---------|--------|--------------------|
| Crise RAM 2026 (cout Pi5) | Menace | Pi5 ~150-200 EUR (vs prix historique plus bas). Le choix 4 Go (vs 8 Go sur-dimensionne) limite l'exposition au surcout RAM. |
| Cout de l'IA cloud | Opportunite | ~0,002 EUR/analyse : negligeable a l'echelle d'un institut. Le poste IA n'est pas un risque budgetaire en V1. |
| Cout dominant = l'ecran | Menace / incertitude | Ecran Shineworld 32 pouces ~700-900 EUR : c'est la vraie incertitude du TCO. [A COMPLETER : devis ferme Shineworld a obtenir] avant tout chiffrage commercial. |
| TJM / cout de la prestation | — | [A COMPLETER : TJM d'Adriano / OHADJA et modele de facturation] |

BOM materiel indicatif (par miroir, hors ecran a chiffrer fermement) :

| Composant | Cout |
|-----------|------|
| Raspberry Pi 5 (4 Go) | ~150-200 EUR |
| Alimentation 27 W | ~12 EUR |
| Refroidisseur actif | ~8 EUR |
| microSD | ~15 EUR |
| Boitier PETG imprime (profil SLIM, -28% epaisseur, sans HAT NVMe) | ~5 EUR |
| Microscope USB UVC | ~45 EUR |
| Ecran Shineworld 32" | ~700-900 EUR (devis a confirmer) |

A l'echelle cible (6 miroirs), l'ecran represente l'essentiel du capital materiel.

---

## S — Social

| Facteur | Impact | Implication projet |
|---------|--------|--------------------|
| Engouement K-beauty et "skinification" du cheveu | Opportunite | Demande forte pour le diagnostic personnalise premium ; aligne avec le positionnement "Bubble Hair Spa". |
| Defiance vis-a-vis de la captation d'image du visage/cuir chevelu | Menace | Le client doit consentir a la prise de snapshots ; un parcours de consentement clair (art. 9 par precaution) conditionne l'acceptabilite. |
| Attente d'experience "phygitale" en institut | Opportunite | Le miroir cree un moment de conseil valorisant, support de vente (lien CRM/Shopify), pas un simple gadget. |
| Concurrence credibilisant le marche | Neutre/Opportunite | L'Oreal/Kerastase K-Scan, BECON (coreen, soutenu par Samsung), FotoFinder, Aram Huvis ARAMO, CareOS Poseidon, HiMirror. Le marche existe ; la differenciation est l'integration verticale (microscope bas cout + IA + CRM Shopify) en institut K-beauty premium. Ne pas affirmer "aucun concurrent". |

---

## T — Technologique

| Facteur | Impact | Implication projet |
|---------|--------|--------------------|
| Maturite de l'IA de vision | Opportunite | Suffisante via modeles cloud (OpenRouter). Permet une analyse pertinente sans modele entraine en propre. |
| Codecs video Pi5 (BCM2712) | Contrainte | HEVC/H.265 4K60 decode en HARDWARE uniquement. H.264, VP9, AV1 decodes en LOGICIEL/CPU. AUCUN encodeur video hardware. Implication : privilegier HEVC pour toute lecture lourde ; ne jamais coder un pipeline qui suppose une acceleration H.264 ou un encodage materiel. |
| Dependance fournisseur cloud (OpenRouter, US) | Menace | Point unique de defaillance fonctionnel et juridique (cf. section L). Mitigation roadmap : CV on-device (OpenCV) reduisant la dependance et la surface RGPD. |
| Connectique microscope | Decision verrouillee | USB UVC par defaut (conforme au code). Le WiFi est une option ; le double-WiFi N'EST PAS implemente en V1 (`wifi.service.ts` ne gere que `wlan0`). |
| Footprint memoire | Decision d'ingenierie | Mesure code ~1,3-2,2 Go avec Docker on-device. Choix 4 Go a valider par une mesure 48h (`free -m` + `VmRSS`) — a presenter comme decision conditionnee, pas comme fait acquis. |
| Stack | Maitrisee | Device : Electron 33 + React 19 + TypeScript 5.7 + Zustand 5 (electron-vite, electron-builder arm64+x64). Backend mock local : Node 20 + Express + PostgreSQL 15. CRM distant : Laravel/Sanctum (api-kbeauty.a3n.fr). Proxy IA port 3001. PAS de Redis. La stack Bun/Supabase/Budibase/Vercel des anciennes specs est OBSOLETE/abandonnee. |

---

## E — Environnemental

| Facteur | Donnee | Implication projet |
|---------|--------|--------------------|
| Consommation Pi5 | 5,7-6,8 W | Faible en absolu. En mode kiosk 24/7 : ~50-60 kWh/an par miroir (Pi seul, hors ecran qui domine la conso reelle). |
| microSD vs SSD | — | microSD : moins cher, mais endurance ecriture plus faible et risque d'usure en fonctionnement continu. Choix V1 = microSD (cout, profil SLIM sans HAT NVMe). A surveiller : taux d'ecriture des logs/snapshots pour eviter une usure prematuree. |
| Kiosk 24/7 | — | Opportunite d'optimisation : mise en veille ecran hors horaires d'ouverture reduit fortement la conso (l'ecran 32" pese bien plus que le Pi). Recommandation : ordonnancement on/off aligne sur les heures boutique. |
| Parc de 6 miroirs | — | Impact agrege modeste cote Pi (~300-360 kWh/an pour les 6 unites Pi). L'ecran reste le poste energetique dominant : la veille programmee est le principal levier de sobriete. Fin de vie : boitier PETG imprime, recyclabilite a documenter. |

---

## L — Legal (section la plus fournie)

### RGPD

| Exigence | Statut / position | Implication concrete |
|----------|-------------------|----------------------|
| **Consentement** | Requis avant toute capture | Parcours de recueil explicite avant snapshot ; tracabilite du consentement. |
| **Consentement art. 9(2)(a)** (donnees de sante) | **Par precaution** | Position FRAGILE : l'etat capillaire/cutane est une donnee potentiellement deductible de sante (CJUE C-184/20). NE PAS affirmer "l'art. 9 ne s'applique pas" ; adopter une approche par precaution = consentement explicite. |
| **Minimisation** | A appliquer | Ne capturer/transmettre que le strict necessaire au diagnostic. Roadmap on-device : ne faire sortir que des scores anonymises. |
| **Retention** | A definir | Politique de duree de conservation des snapshots et resultats ; suppression automatique. [A COMPLETER : duree retenue avec le DPO]. |
| **Transfert hors UE (art. 44-46)** | **Requis — Schrems II** | Les snapshots JPEG sortent vers OpenRouter (datacenter US). Chapitre V obligatoire : **DPA (art. 28)** + **clauses de transfert DPF ou SCC (art. 46)** + **TIA (Transfer Impact Assessment, Schrems II)**. Sans ces elements, le transfert est non conforme. |

**Securite (gaps assumes, verifies en code) — a presenter en transparence :**

| Gap | Localisation | Risque RGPD (art. 32 — securite) |
|-----|--------------|----------------------------------|
| Photos JPEG en clair | `sync.service.ts:61` | Donnees potentiellement sensibles non chiffrees au repos. |
| Sandbox desactive | `index.ts:51` (`sandbox:false`) | Surface d'attaque renderer accrue. |
| CSP absente | — | Pas de politique de securite du contenu. |
| `crmBearerToken` / `crmToken` en clair | — | Secrets non proteges. |
| `config:getAll` expose tout le store au renderer | — | Fuite de configuration possible. |

Fondations correctes a valoriser : `contextIsolation: true`, `nodeIntegration: false`, preload via `contextBridge`, IPC. **2 CVE a re-verifier via `npm audit` la veille de l'oral.**

### MDR (Reglement dispositifs medicaux) — evite

Finalite **cosmetique**, aucune allegation therapeutique : le projet reste **hors MDR**. Position solide a condition de ne jamais formuler de promesse de diagnostic/traitement medical (ni dans l'UI, ni dans le discours commercial).

### HDS (Hebergement de donnees de sante)

Decision **PROVISOIRE sous reserve d'avis DPO** — ne pas presenter comme tranchee. Si la donnee est qualifiee "de sante" et hebergee, une certification HDS pourrait etre requise pour l'hebergeur. [A COMPLETER : avis DPO].

### RED art. 3.3 (Directive equipements radio)

Applicable **depuis le 01/08/2025**. Exigences de cybersecurite/protection des donnees pour tout equipement radio (le miroir embarque du WiFi). Conformite a documenter pour la mise sur le marche.

### CRA (Cyber Resilience Act)

| Echeance | Obligation |
|----------|------------|
| 11/09/2026 | Signalement des vulnerabilites activement exploitees. |
| 11/12/2027 | SBOM (Software Bill of Materials) et obligations completes. |

Implication : mettre en place des maintenant la tracabilite des dependances (vers un SBOM) et un processus de signalement de vulnerabilites.

---

## Synthese des leviers prioritaires

1. **Juridique** : verrouiller le triptyque transfert hors UE (DPA + SCC/DPF + TIA) et le consentement art. 9 par precaution — c'est le risque legal majeur de la V1.
2. **Technique** : la roadmap CV on-device (OpenCV, scores anonymises) reduit simultanement la dependance cloud (T), l'exposition transfert (L) et l'empreinte (E).
3. **Economique** : securiser le devis ecran (poste dominant du TCO).
4. **Securite** : combler les gaps assumes (chiffrement JPEG, CSP, protection des tokens) et `npm audit` avant soutenance.

> [A COMPLETER : identite/activite d'OHADJA, parcours d'Adriano, remerciements.]
