# Benchmarks techniques et IA - Justification des choix

> Smart Mirror KBEAUTY - Raspberry Pi 5 (BCM2712, ARM64, Debian 12)
> Document de soutenance RNCP 37046 - Partie 5 CDCT / BC02 (justification des choix)
> Date de consultation des sources : 2026-06-29

---

## 1. Methode et avertissement

Ce document consolide six recherches de benchmark conduites sous protocole fact-check (preuve demonstrable, quantifiable, reproductible). Deux regles ont gouverne la redaction.

**Le domaine performance exige une preuve de niveau LEVEL-2 minimum.** Toute affirmation de performance non sourcee ou reposant sur un blog non scientifique est signalee comme telle et ne doit pas etre presentee au jury comme un fait.

**Distinction systematique entre deux familles de preuve :**

| Marqueur | Signification | Valeur en soutenance |
|---|---|---|
| [PUBLIE] | Chiffre tire d'une source externe (spec officielle, benchmark reproductible, model card) | A citer avec sa source et sa date |
| [A MESURER] | Pas de chiffre publie applicable a CE materiel - protocole reproductible fourni | A executer sur le Pi 5 reel avant la soutenance |

Niveaux de confiance utilises : L1 (spec officielle, 95 %), L2 (benchmark reproductible / docs produit, 80 %), L3 (article ou livre technique, 65 %), L4 (consensus communaute / blog, 50 %), L5 (opinion, 20 %).

**Avertissement transversal majeur.** Aucun benchmark public ne mesure ces technologies directement sur Raspberry Pi 5. La quasi-totalite des chiffres runtime publies provient de machines desktop x86 (Windows / macOS / Ubuntu). Ils donnent des ordres de grandeur, pas la verite Pi. Le seul chiffre qui vaut pour la soutenance doit etre mesure sur le Pi 5 cible via les protocoles de la section 4. C'est ce qui transforme un argumentaire de blog en preuve LEVEL-2 reproductible.

---

## 2. Section STACKS - choix techniques

### 2.1 Runtime applicatif : Electron 33 vs Tauri 2

| Critere | Electron 33 | Tauri 2 | Source / confiance |
|---|---|---|---|
| RAM idle (mesure honnete PSS, Ubuntu) | 207 Mo (PSS) | 185 Mo (PSS) | tauri-apps #5889, L2 |
| RAM idle (USS) | 118 Mo | 125 Mo (Tauri plus !) | tauri-apps #5889, L2 |
| RAM idle (blog, Windows, RSS) | ~120 Mo | ~80 Mo | levminer.com, L4 |
| Taille installeur | ~85 Mo | ~2,5 Mo | levminer.com, L4 (ecart robuste) |
| Taille bundle (du -h, macOS) | 244 Mio | 8,6 Mio | gethopp.app, L3 |
| Temps de demarrage | ~4 s | ~2 s | levminer.com, L4 |
| Build initial | 15,8 s | 80,9 s (compile Rust) | gethopp.app, L3 |
| Moteur de rendu | Chromium 130 embarque, identique partout | WebKitGTK 4.1 du systeme | electronjs.org L1 / tauri v2 L2 |
| Accel. GPU/video sur Pi | pipeline Chromium mur sur Pi | compositing on-demand, forcer peut corrompre l'affichage | listes webkit-gtk, L3/L4 |
| Binaires Linux ARM64 | publies officiellement (arm64 + armv7l) | cross-compilation requise (aarch64, Docker) | L2 / L2 |
| Stack equipe | deja en place (React 19 + TS + Zustand) | reecriture du shell + Rust a apprendre | code projet |

**Mise au point sur le mythe RAM.** Le "Electron = 2x la RAM de Tauri" repose sur du RSS naif, qui compte plusieurs fois la memoire partagee read-only de Chromium. Mesure correctement (PSS/USS, source officielle Tauri #5889), l'ecart reel sur Linux est de 10 a 20 %, pas un facteur 5, et Tauri peut meme consommer plus en USS. Le facteur 5 est un artefact macOS/Windows ou de mesure RSS : a ne pas citer en soutenance.

**VERDICT : Electron 33, choix retenu et rationnel pour ce projet.**
1. L'avantage RAM de Tauri sur Linux est modeste (100 a 150 Mo) et ne justifie pas une reecriture.
2. Le vrai risque de Tauri sur Pi est WebKitGTK (accel GPU on-demand, video/canvas/WebGL en difficulte, upstream recommande WPEWebKit). Le produit est video-centric (microscope MJPEG) plus animations : Chromium embarque par Electron supprime ce risque. Argument decisif.
3. Maturite ARM64 et time-to-demo : binaires arm64 officiels et stack deja fonctionnelle.

Conditions : 8 Go = recommande sans reserve ; 4 Go = defendable mais a valider par mesure PSS sous charge (section 4), mode kiosk, surveiller le swap. Tauri ne redeviendrait pertinent que sur cible tres contrainte (<= 2 Go), UI peu animee sans video lourde - aucun de ces cas n'est celui de KBEAUTY.

### 2.2 Pipeline video preview : MJPEG vs MSE/H.264 vs WebRTC

Contexte verifie dans le code ([FACT USER-VERIFIED 2026-06-29], proxy.js + microscope.service.ts) : entree H.264 TCP du microscope WiFi, transcodage ffmpeg `-f h264 -i pipe:0 -f mjpeg -q:v 5 -r 15`, sortie MJPEG multipart sur port 9100, affichage dans une `<img>`, reconnexion auto codee.

**Fait fondateur (CLAIM L2, 80 %, forum officiel RPi - ingenieurs jamesh et 6by9) :** le Pi 5 (BCM2712) n'a plus de decodage H.264 materiel (supprime vs Pi 4), seul HEVC 4K60 est materiel. Le microscope emet du H.264 : toute approche devra donc decoder en logiciel sur les 4 coeurs Cortex-A76. L'argument "decodage materiel" ne discrimine aucune des trois options.

| Critere | MJPEG (img multipart) | MSE / H.264 (fMP4) | WebRTC |
|---|---|---|---|
| Latence affichage | faible (pas de buffer inter-image) | moyenne (buffering fMP4) | faible-moyenne (jitter buffer) |
| Latence publiee | non normalisee (a mesurer) | ~secondes si segmente | 200-500 ms glass-to-glass (L4, flux reseau) |
| Decode navigateur | JPEG (trivial) | H.264 logiciel dans Chromium | H.264 logiciel + pile WebRTC |
| Charge CPU producteur | decode H264 + encode JPEG | remux -c copy possible | encode/repaquet RTP |
| Isolation CPU | decode lourd isole dans process ffmpeg | decode H264 ramene DANS Chromium | le plus lourd |
| Complexite | triviale (deja en place) | elevee (fMP4, API MSE) | tres elevee (signaling, SDP, ICE) |
| Bande passante | elevee, mais non contraignant en loopback | faible (benefice nul en loopback) | faible (benefice nul en loopback) |
| Robustesse | tres haute (stateless) | moyenne | plus fragile |

Sources latence WebRTC : videosdk / nanocosmos / Mux, L4 - chiffres reseau, non transposables au loopback meme-appareil. Aucun benchmark publie ne couvre "MJPEG transcode ffmpeg Pi 5 dans img" : tout chiffre de latence pour ce cas doit etre mesure (section 4).

**VERDICT : MJPEG, choix retenu et justifie.**
1. Aucune option ne beneficie du decode materiel (H.264, pas HEVC) : l'argument qui ferait pencher vers MSE/WebRTC tombe.
2. Simplicite maximale (Rasoir d'Ockham) : `<img src>`, zero player, zero signaling, support Chromium natif.
3. Les defauts de MJPEG sont neutralises (forte bande passante sans effet en loopback/LAN).
4. Latence structurellement basse (pas de buffer inter-image), adequat pour du cadrage/preview.
5. Isolation CPU : le decode H264 lourd reste hors du process de rendu React/Electron.

A reconsiderer (MSE remux -c copy) seulement si la mesure montre ffmpeg saturant un coeur. WebRTC non recommande (surcout ingenierie injustifie en loopback).

### 2.3 Base de donnees et framework backend

#### Base de donnees : PostgreSQL (serveur) vs SQLite (device)

Fait fondateur LEVEL-1 (95 %, doc officielle sqlite.org/whentouse.html) : SQLite "supports an unlimited number of simultaneous readers, but it will only allow one writer at any instant in time" et "competes with fopen()". PostgreSQL utilise MVCC + verrou ligne (doc officielle).

| Scenario (bench andrecasal, M2 Pro, L2 70 %) | SQLite | PostgreSQL | Ecart |
|---|---|---|---|
| Inserts sequentiels, 1 connexion | 23 403 ops/s | 7 740 ops/s | SQLite x3,0 |
| Mixte 80/20, 1 connexion | 96 051 ops/s | 11 824 ops/s | SQLite x8,1 |
| Pic ecriture, 16 connexions | ~23 000 ops/s | ~35 000 ops/s | PostgreSQL gagne |

Le croisement (~8-16 writers) est exactement la frontiere device mono-process vs serveur multi-clients. Reserve : un seul materiel teste (pas un RPi5). Source intuitem 2026 = L4 (1 run, n faible), a citer seulement comme illustration.

**VERDICT :**
- PostgreSQL cote serveur : OUI (90 %). Multi-acces (plusieurs miroirs + back-office + IA serveur) = ecritures concurrentes -> MVCC requis, conforme a la recommandation officielle SQLite elle-meme.
- Absence de SQLite cote device : defendable (80 %). Device mono-process, mono-utilisateur, sans concurrence d'ecriture. JSON chiffre + electron-store se justifie par simplicite + chiffrement at-rest integre, PAS par la performance. Nuance a assumer : SQLite aurait ete techniquement valide sur le device ; ne pas pretendre qu'il serait "trop lent".

#### Framework : Express/Node (MVP mock) vs Laravel/PHP (cible)

| Framework (ordres de grandeur, L4 40-50 %) | req/s | Latence | Condition |
|---|---|---|---|
| Express (Node) | ~6 000-10 000 | ~50 ms @200 conns | autocannon hello world |
| Fastify (ref haute Node) | ~14 000-45 000 | - | meme test |
| Laravel PHP-FPM (sans Octane) | ~28-35 | ~1,27 s @200 conns | wrk, blog |
| Laravel Octane (Swoole) | p50 6,4 ms (vs Node 2,2 ms) | proche Node | LogRocket, L3/L4 55 % |

TechEmpower Round 22 (2023-11-15) = autorite methodologique, mais ne pas avancer un chiffre precis de memoire. Lecture critique : "Laravel = 35 req/s" est la verite sur Laravel-FPM non optimise, pas sur Laravel. Le comparatif moderne est Octane (app en memoire) : l'ecart tombe a un facteur ~2-3 sur la latence.

**VERDICT :**
- MVP mock Express/Node : OUI (85 %). Endpoints simples, meme langage que le front (TS/React), coherence de stack, time-to-market. La perf n'est pas le critere decisif.
- Cible Laravel : OUI sous conditions (70 %). Justifie par ecosysteme (Eloquent, auth, admin, RGPD outille, profil equipe PHP), PAS par la performance. Neutraliser le contre-argument perf en annoncant Octane en prod. Arbitrage velocite developpeur vs debit machine, legitime a assumer.

### 2.4 Frontend : React 19 + Zustand

Donnees dures Bundlephobia (2026-06-29, L2 reproductible, min+gzip) :

| Runtime framework | Gzip | | State management | Gzip |
|---|---|---|---|---|
| React + react-dom 19 | ~45 Ko | | Zustand 5.0.14 | 0,49 Ko |
| Vue 3.5.39 | 45,8 Ko | | React Context | 0 Ko |
| Svelte 5 (runtime) | 10,75 Ko | | react-redux 9.3.0 | 3,77 Ko |
| SolidJS 1.9.13 | 8,3 Ko | | Redux Toolkit complet | ~17,3 Ko |

Perf de rendu (js-framework-benchmark, geomean slowdown vs VanillaJS, desktop x86, MEDIUM - a relire current.html le jour J avec date + version Chrome) : Solid ~1,03-1,06 ; Svelte 5 ~1,06-1,12 ; Vue 3 ~1,20-1,30 ; React 19 ~1,45-1,60.

**Le facteur qui change tout : Electron/Chromium.**
1. Le bundle size est presque non pertinent en Electron (assets charges depuis le disque local, l'ecart 45 vs 8 Ko = quelques dizaines de ms de parse une fois au boot).
2. Un process Chromium vide consomme ~150-300 Mo RAM : l'ecart de framework (1 a 8 Mo) est du bruit. Avec 4-8 Go, la RAM n'est pas le facteur limitant du choix de framework.
3. Le goulot reel d'une UI kiosk + video sur Pi 5 = compositing GPU et flux video, pas le diff DOM. L'UI miroir a peu de composants et peu de maj/s : l'avantage Solid/Svelte ne se materialise pas.

**VERDICT : React 19 + Zustand, choix retenu et defendable.** Sur Pi 5 en Electron, l'avantage mesurable de Svelte/Solid s'evapore. Zustand (0,49 Ko, selecteurs anti-re-render) est meme un meilleur choix que Redux (surdimensionne) ou Context seul (re-renders en cascade). Argument non-perf decisif : ecosysteme, tooling, maintenabilite, employabilite. A confirmer par les mesures FPS et RAM sur le Pi.

---

## 3. Section IA

### 3.1 Modeles vision cloud : GitHub Models vs Mistral

Qualite vision publiee (L2 80 % sauf indication ; taux 1 USD ~ 0,92 EUR, HYPOTHESIS) :

| Modele | MMMU | DocVQA | Cout/analyse (EUR)* | Souverainete | Source / confiance |
|---|---|---|---|---|---|
| gpt-4o-mini (GitHub Models) | 59,4 | n.c. | ~0,00038 | US (Azure, Cloud Act) | OpenAI 2024-07, L2 |
| Llama-3.2-11B-Vision (GitHub Models) | 50,7 | 88,4 | 0 en free tier | US | Meta/NVIDIA model card, L2 |
| Phi-3.5-vision (GitHub Models) | 43,0 | n.c. (MMBench 81,9) | 0 en free tier | US | MS HF card, L2 |
| Mistral Large 3 | non publie | non publie | ~0,0011 | UE par defaut + ZDR | mistral.ai/news, L4 vision |
| Mistral Medium 3.5 | non publie | non publie | ~0,0041 | UE par defaut + ZDR | mistral pricing, L1 prix |
| Ministral 3 (3B) | non publie | non publie | ~0,00017 | UE par defaut + ZDR | mistral pricing, L1 prix |

(*) Hypothese 1 500 tokens input + 300 output, REASONING 55 %. gpt-4o-mini facture les images avec un facteur multiplicateur eleve : le cout reel par image peut etre 2 a 10x superieur. A mesurer (section 4).

Faiblesse honnete de l'option souveraine : Mistral ne publie AUCUN score MMMU/DocVQA chiffre pour ses modeles courants. Les seuls chiffres vision Mistral solides concernent Pixtral Large, qui est deprecie. Limite transversale : aucun de ces benchmarks ne mesure l'analyse capillaire/cosmetique - la correlation benchmark -> performance capillaire est une HYPOTHESIS non demontree.

Souverainete (L2 80 %) : GitHub Models heberge en tenant Azure US par defaut, retention ~28 jours, Cloud Act applicable. Mistral route en UE par defaut, retention 30 jours glissants, GDPR natif, ZDR disponible (plan Scale). Sur des photos de cuir chevelu/visage de client (donnee potentiellement sensible), le routage UE + ZDR de Mistral est un argument GDPR nettement plus solide.

**VERDICTS modeles vision :**
- Meilleur pour la qualite prouvee : gpt-4o-mini (seul MMMU 59,4 publie). Correlation au capillaire a confirmer (section 4).
- Meilleur pour la souverainete/GDPR : Mistral Large 3 (UE par defaut + ZDR, vision native, 0,50/1,50 USD/M).
- Meilleur pour le cout : Ministral 3-3B (~0,17 EUR / 1000 analyses) ou GitHub Models free tier (0 EUR dans le quota).
- Recommandation consolidee (REASONING 60 %) : MVP/demo = GitHub Models free tier (gpt-4o-mini, deja cable) ; cible production = Mistral Large 3 (souverainete UE decisive sur donnees clients), sous reserve de validation qualite par le protocole capillaire. Eviter Pixtral (deprecie) et Medium 3.5 (10x le prix de Large 3 sans benefice vision prouve).

### 3.2 IA edge 100 % locale : Hailo-8 vs petits VLM CPU vs Hailo-10H

| Voie 100 % locale | FPS / debit | Latence | Conso | Cout | Realiste ? | Source |
|---|---|---|---|---|---|---|
| Hailo-8 classification (ResNet-50) | 1371 FPS (hw pur) | 3,38 ms | 3,96-4,06 W | ~70 USD (AI HAT+) | OUI, recommande | Hackster 12/06/2026, L2 |
| Hailo-8 detection (YOLOv8n pipeline reel) | 40-45 FPS | - | ~4 W | ~70 USD | OUI | Hailo Community #18305, L4 |
| VLM sur CPU Pi 5 (moondream2 1,9B) | ~5-10 tok/s, TTFT plusieurs s | elevee | ~10 W | 0 (CPU) | POSSIBLE mais lent | extrapolation, L4/rouge |
| VLM sur CPU Pi 5 (Qwen2.5-VL 3B) | ~2-5 tok/s | elevee | ~10 W | 0 (CPU) | MVP seulement | extrapolation, rouge |
| Hailo-10H decode LLM (1,5B) | 5,9-8,1 tok/s (CPU souvent plus rapide) | TTFT 320 ms | 7,2-7,6 W | 130 USD | EMERGENT | CNX 20/01/2026, L2 |

Piege methodologique a expliquer au jury : ecart de 10 a 25x entre FPS "hw_only" (`hailortcli benchmark`, marketing, ex. YOLOv8n ~1036 FPS) et FPS pipeline reel (capture + pre/post-traitement CPU, ~40-45 FPS). Cause : le Pi 5 limite le PCIe a Gen3 x1, alors que le Model Zoo Hailo mesure en Gen3 x2 (Hailo Community #18873). Seul le FPS pipeline compte, et 40+ FPS reste tres au-dessus du besoin capillaire.

Fact-check Hailo-10H : le claim "10-25x plus rapide que le CPU" est trompeur. Mesures independantes (CNX 20/01/2026) : sur le debit decode, le CPU du Pi 5 est souvent PLUS rapide (ex. Qwen2.5 1.5B : 6,74 vs 11,73 tok/s en faveur du CPU). Le Hailo-10H gagne reellement sur le TTFT (320 ms vs 2039 ms, 6,4x), la conso (~30 % de moins) et le fait de liberer les 4 coeurs CPU + 8 Go dedies. Hailo-8 ne fait PAS de VLM generatif (architecture vision, pas de KV-cache transformer).

**VERDICTS IA edge :**
- Meilleur pour offline temps reel + basse conso : classification/detection CNN sur Hailo-8 (sortie deterministe labels + scores). Contrainte : entrainer + compiler un modele capillaire custom (HEF via Hailo Dataflow Compiler).
- Meilleur pour du generatif local immediat : VLM sur CPU Pi 5 (moondream2/Qwen2.5-VL 3B), acceptable pour un MVP, pas pour du temps reel.
- Hailo-10H : pertinent pour la reactivite (TTFT) et liberer le CPU, pas pour le debit brut ; ecosysteme jeune (janvier 2026).
- Recommandation : pour une analyse capillaire 100 % locale, Hailo-8 classification ; le VLM generatif reste pertinent cote serveur (architecture GitHub Models actuelle).

---

## 4. Section PROTOCOLES REPRODUCTIBLES (a executer sur le Pi 5)

Ces mesures transforment les ordres de grandeur en faits [FACT USER-VERIFIED]. A executer sur le Raspberry Pi 5 cible, app en charge (video + IA active).

### 4.1 RAM reelle d'Electron (PSS, pas RSS)

```bash
# PSS agrege de TOUS les process Electron (le chiffre honnete)
for pid in $(pgrep -f electron); do
  awk '/^Pss:/ {sum+=$2} END {print sum}' /proc/$pid/smaps_rollup
done | awk '{t+=$1} END {printf "PSS total Electron: %.1f Mo\n", t/1024}'

# RSS naif (gonfle) pour comparaison
ps -o pid,rss,comm -C electron

# Vue temps reel par cgroup si lance via systemd (kiosk)
systemd-cgtop

# Delta RAM systeme avant/apres lancement
free -m

# Surveillance swap sous charge (doit rester a 0 sur 4 Go)
vmstat 1   # colonnes si/so
```
Cible 8 Go : PSS app < ~600 Mo en charge. Cible 4 Go : mesurer le PSS sous charge IA+video, swap a 0.

### 4.2 Latence video bout-en-bout (glass-to-glass)

Methode camera (seule fiable, le multipart ne declenche pas d'event onload par image) :
1. Afficher un chrono milliseconde plein ecran sur un 2e ecran (ex. time.is).
2. Pointer le microscope dessus, le miroir affiche le flux MJPEG (port 9100).
3. Filmer simultanement le chrono source ET l'ecran du miroir en slow-motion 240 fps.
4. Latence = (chrono reel) - (chrono affiche). Repeter >= 10 mesures, reporter mediane + min/max.

```bash
# Debit de decode H.264 logiciel pur sur ce Pi
ffmpeg -benchmark -f h264 -i sample.h264 -f null -

# CPU du transcode MJPEG en conditions reelles
pidstat -p $(pgrep -f 'ffmpeg.*mjpeg') 1 60
top -H -p $(pgrep -d, -f electron)

# Throttling thermique (doit rester 0x0)
vcgencmd measure_temp ; vcgencmd get_throttled ; vcgencmd measure_clock arm
```

### 4.3 Throughput base de donnees

```bash
# PostgreSQL cote serveur (pgbench, livre avec PostgreSQL)
pgbench -i -s 50 kbeauty                 # init dataset
pgbench -c 16 -j 4 -T 60 kbeauty         # 16 clients, lecture+ecriture
pgbench -c 16 -j 4 -T 60 -S kbeauty      # lecture seule
# Sortie cle : tps et latency average

# Framework : Express vs Laravel a armes egales
npx autocannon -c 100 -d 30 -p 10 http://localhost:9100/api/analyse
wrk -t4 -c100 -d30s --latency http://localhost:8000/api/analyse
# Laravel : mesurer les DEUX -> php artisan serve/FPM ET php artisan octane:start --server=swoole
```

### 4.4 FPS et RAM du frontend dans Electron

```bash
# Taille bundle reelle (gzip)
npm run build
find dist -name '*.js' -exec gzip -c {} \; | wc -c

# RSS process Electron
ps -o rss= -C electron | awk '{s+=$1} END {print s/1024 " Mo"}'
```
FPS via DevTools (Ctrl+Shift+I sur le Pi en VNC/HDMI) : Rendering > Frame Rendering Stats, ou requestAnimationFrame programmatique. Cible kiosk tactile : >= 30 FPS soutenu avec flux video actif. RAM par process via `process.getProcessMemoryInfo()` et `app.getAppMetrics()` ; comparer au repos vs flux MJPEG actif pour isoler le cout video.

### 4.5 Latence et cout des modeles IA cloud

```bash
# Latence bout-en-bout par requete depuis le Pi 5
for i in $(seq 1 20); do
  curl -o /dev/null -s -w "%{time_total}\n" \
    -X POST "$API_URL" -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" -d @payload_image.json
done | awk '{s+=$1} END{print "moy="s/NR"s n="NR}'
# Rapporter p50 / p95 sur >= 20 requetes, par modele
```
Cout reel : logger `usage.prompt_tokens` / `completion_tokens` reellement renvoyes par chaque API (resout l'incertitude images). Qualite capillaire : 30-50 photos annotees (double annotation praticienne), accord modele/praticienne via Cohen's kappa + % accord exact. Criteres suggeres : kappa >= 0,6, p95 latence <= 4 s, cout <= 0,005 EUR/analyse.

### 4.6 FPS et debit IA edge (Hailo + VLM CPU)

```bash
# Hailo : FPS "hardware pur" sur modele compile .hef
hailortcli benchmark resnet_v1_50.hef
hailortcli benchmark yolov8s.hef

# Hailo : FPS PIPELINE REEL (le seul qui compte)
git clone https://github.com/hailo-ai/hailo-rpi5-examples
# lancer detection.py -> FPS affiche
# Conso : wattmetre USB-C externe inline (le PMIC du Pi ne mesure pas la carte HAT)

# VLM/LLM sur CPU : tok/s + TTFT
ollama run moondream --verbose          # prompt eval rate = prefill, eval rate = decode
llama-bench -m moondream2-q4_k_m.gguf -p 512 -n 128   # pp = prefill, tg = generation
/usr/bin/time -v ollama run qwen2.5vl:3b "decris cette image"   # Maximum resident set size
```
Mesurer chaque VLM candidat avec une vraie image de cheveux : le TTFT depend de la resolution d'entree de la vision tower.

---

## 5. Tableau de synthese final

| Choix retenu | Alternative ecartee | Raison chiffree de l'ecart |
|---|---|---|
| Electron 33 | Tauri 2 | Gain RAM reel de Tauri = 10-20 % (PSS, #5889), pas un facteur 5 ; et WebKitGTK rame sur video/GPU Pi alors que Chromium est mur. ~100-150 Mo economises ne paient pas la reecriture + risque de rendu. |
| Video MJPEG | MSE/H.264, WebRTC | Pi 5 sans decode H.264 materiel (forum RPi) : aucune option n'a d'avantage HW. MJPEG = `<img src>` trivial vs signaling/SDP/ICE de WebRTC, sans gain de latence en loopback. |
| PostgreSQL (serveur) | SQLite (serveur) | SQLite plafonne a 1 writer ; au-dela de ~8-16 connexions concurrentes PostgreSQL passe de 7 740 a ~35 000 ops/s et depasse SQLite. Doc SQLite recommande elle-meme un SGBD serveur en multi-acces. |
| JSON chiffre + electron-store (device) | SQLite (device) | Device mono-process : le besoin de SQLite (ACID multi-tables) n'existe pas. JSON chiffre apporte le chiffrement at-rest natif (SQLCipher = dependance lourde). Choix de simplicite, pas de performance. |
| Express/Node (MVP) | Laravel/PHP (MVP) | Coherence de stack (meme langage que le front) ; Express ~6 000-10 000 req/s vs Laravel-FPM ~35 req/s. Perf non decisive ici, mais coherence et time-to-market oui. |
| Laravel (cible) | Express/Node (cible) | Ecosysteme (Eloquent, auth, RGPD outille). Contre-argument perf neutralise par Octane (latence ramenee a un facteur ~2-3 du Node, vs ~30x en FPM nu). |
| React 19 + Zustand | Svelte/Solid + Redux/Context | En Electron sur Pi, l'avantage runtime de Svelte/Solid (geomean ~1,05 vs React ~1,5, bundle ~8 vs 45 Ko) est domine par Chromium (~150-300 Mo). Zustand = 0,49 Ko avec selecteurs vs Redux ~17 Ko. |
| gpt-4o-mini (qualite MVP) | Mistral (qualite) | gpt-4o-mini MMMU 59,4 publie ; Mistral ne publie aucun score vision pour ses modeles courants. |
| Mistral Large 3 (cible souverainete) | GitHub Models (cible) | Routage UE par defaut + ZDR vs Azure US (Cloud Act) sur photos clients sensibles ; 0,50/1,50 USD/M, vision native. |
| Hailo-8 classification (offline) | VLM sur CPU Pi 5 | Centaines a 40+ FPS pipeline a ~4 W et latence < 4 ms, sortie deterministe, vs ~2-10 tok/s et TTFT de plusieurs secondes pour un VLM CPU generaliste. |

---

## 6. Sources (consultees le 2026-06-29) et points a reverifier

### Sources principales

Runtime : tauri-apps/tauri issue #5889 (PSS/USS, L2) ; electronjs.org/blog/electron-33-0 (L1) ; levminer.com et gethopp.app (L4) ; listes webkit-gtk (L3/L4) ; v2.tauri.app/reference/webview-versions (L2).

Video : forums.raspberrypi.com viewtopic t=357870 et t=391283 (ingenieurs RPi, L2) ; videosdk.live, nanocosmos.net, mux.com (L4) ; code projet proxy.js et microscope.service.ts.

BDD / framework : sqlite.org/whentouse.html (L1) ; github.com/andrecasal/sqlite-vs-postgres-benchmark (L2) ; intuitem.com PostgreSQL vs SQLite 2026 (L4) ; techempower.com/benchmarks Round 22 (methodo L2) ; blog.logrocket.com Laravel Octane vs Node (L3/L4) ; github.com/mcollina/autocannon.

Frontend : bundlephobia.com API (L2) ; krausest.github.io/js-framework-benchmark/current.html (methodo L2, chiffres MEDIUM).

IA cloud : openai.com gpt-4o-mini ; model cards Meta/NVIDIA Llama-3.2-11B-Vision et Microsoft Phi-3.5-vision ; mistral.ai/pricing et /news ; help.mistral.ai (ZDR) ; github.blog changelog 2025-06-24 et docs.github.com (GitHub Models).

IA edge : hackster.io Edge AI Power Benchmarking Part 1 (12/06/2026) ; community.hailo.ai #18873, #18305 ; wiki.seeedstudio.com (17/07/2024) ; stratosphereips.org (27/05/2025) ; arXiv 2511.07425 ; cnx-software.com AI HAT+ 2 review (20/01/2026) et annonce (15/01/2026) ; hailo.ai/blog (19/02/2026) ; raspberrypi.com news AI HAT+ 2.

### Points a reverifier soi-meme avant la soutenance

1. RAM reelle de l'app (PSS, section 4.1) - tous les chiffres RAM publies sont x86 et majoritairement RSS.
2. Latence et CPU du pipeline video MJPEG (section 4.2) - aucun chiffre publie applicable a ce pipeline.
3. tps PostgreSQL et req/s Express vs Laravel Octane (section 4.3) - remplacer les chiffres L4 par vos mesures.
4. FPS et RAM frontend dans Electron sur le Pi (section 4.4) - relire js-framework-benchmark/current.html le jour J avec date + version Chrome.
5. Latence, cout token reel et accord capillaire (kappa) des modeles cloud (section 4.5) - le classement qualite repose sur des benchmarks generiques non representatifs du capillaire.
6. FPS pipeline Hailo et tok/s VLM exacts sur Pi 5 (section 4.6) - aucun benchmark VLM publie fiable sur Pi 5 ; chiffres Hailo officiels mesures en PCIe x2 (Pi 5 = x1).
7. Taux de change USD/EUR (1 USD ~ 0,92 EUR) - a reactualiser.

Le seul chiffre defendable sans filet est la taille binaire (Electron vs Tauri, consequence d'architecture). Tous les chiffres de performance doivent etre accompagnes de la mesure correspondante sur le Pi 5 reel pour atteindre le LEVEL-2 reproductible attendu par le jury RNCP 37046.
