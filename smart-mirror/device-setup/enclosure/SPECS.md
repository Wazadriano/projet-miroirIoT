# Boitier Smart Mirror SLIM — Specifications et decisions de conception

Ce document explique **comment** le boitier est concu et **pourquoi** chaque choix a ete fait.
Il sert de reference pour comprendre `case.scad` et pour valider les cotes avant impression.

---

## Vue d'ensemble

Boitier imprime 3D (PETG) pour Raspberry Pi 5 + Active Cooler, fixe au dos d'un miroir
Shineworld 32" via entretoises VESA. Kiosk 24/7 en salon de coiffure K-Beauty.

**Profil SLIM retenu** (pas de NVMe HAT — justification section 3).

```
Dimensions boitier  : 95 x 66 x 29.3 mm
Entretoises VESA    : 18 mm (entrefer thermique ecran-boitier)
Total dos ecran     : 47.3 mm
Imprimante max      : 256 x 256 x 256 mm → OK
```

**3 pieces a imprimer** : base, capot, 4 entretoises VESA.

## Architecture physique

```
    ┌─────────────────────┐
    │   Ecran 32" tactile │  arriere 35-50 °C (mesurer avec IR)
    └──────────┬──────────┘
               │
        ┌──────┴──────┐
        │ Entretoises │  18 mm — air ambiant de la piece circule
        │ VESA (x4)   │  entre l'ecran et le boitier
        └──────┬──────┘
               │
    ┌──────────┴──────────┐
    │ Capot (face ecran)  │  grille hex exhaust (air chaud)
    ├─────────────────────┤
    │ Air gap (6 mm)      │
    │ Active Cooler       │  13.7 mm, ventilo PWM
    │ Pi 5 PCB (1.6 mm)  │
    │ Standoffs (4 mm)    │
    ├─────────────────────┤
    │ Plancher (2 mm)     │  grille hex intake (air frais)
    │                     │  logo KBEAUTY grave
    └─────────────────────┘  ← face visible
```

Flux thermique : air frais de la piece entre par la grille plancher (intake) →
traverse le Pi → Active Cooler expulse l'air chaud vers la grille capot (exhaust) →
l'air chaud s'evacue dans l'entrefer entre le boitier et l'ecran.

## 1. Pourquoi le profil SLIM (Active Cooler sans NVMe)

Decision issue de l'audit thermique Orion [PERF] + fact-check Skeptic.

### Profils evalues

| Profil | Hauteur | Verdict | Justification sourcee |
|--------|---------|---------|----------------------|
| Ultra-slim 22mm (passif) | 22 mm | **ELIMINE** | Throttle confirme [CLAIM L2, 90%]. Heatsink passif plat atteint 74-80 °C en boitier ferme a 30 °C ambiant (benchmarks Flirc/EDATEC, CNX Software). Marge nulle si ambiant >30 °C derriere ecran. |
| **SLIM 29mm (Active Cooler)** | **29.3 mm** | **RETENU** | Active Cooler stabilise a 59-63 °C en air libre, 74 °C en boitier ferme (blog officiel RPi). Avec entrefer 18mm, ambiant boitier ~25-30 °C → SoC ~65-75 °C, marge 5-15 °C vs throttle. |
| Complet 41mm (Active Cooler + NVMe) | 40.7 mm | **ELIMINE** | M.2 HAT+ limite a 50 °C ambiant (product brief p.3). Derriere ecran LCD potentiellement >50 °C. Non fiable. |

### Sources thermiques cles

| Donnee | Valeur | Source |
|--------|--------|--------|
| Consommation Pi 5 sous Electron + video | 5.7 - 6.8 W | CNX Software, wattmetre |
| Throttle soft Pi 5 | 80 °C | Blog officiel RPi |
| Throttle hard Pi 5 | 85 °C | Documentation officielle RPi |
| Active Cooler air libre sous charge | 59-63 °C | Tom's Hardware + blog RPi |
| Active Cooler boitier ferme (test court) | 74 °C | Blog officiel RPi |
| Active Cooler boitier ferme (prolonge) | >80 °C throttle | Forum RPi (rapports utilisateurs) |
| Temperature arriere ecran LCD | 35-50 °C | IEEE + consensus industriel [HYPOTHESIS 55%] |
| Paliers fan Active Cooler | 50/60/67.5/75 °C | Blog officiel RPi (firmware) |

## 2. Pourquoi l'entrefer de 18 mm

Le boitier ne doit **jamais** etre plaque contre l'arriere de l'ecran.

Sans entrefer : l'ambiant du boitier = temperature arriere ecran (35-50 °C).
Active Cooler a 40 °C ambiant → SoC projete 78-88 °C → **throttle**.

Avec entrefer 18 mm : l'air de la piece (22-26 °C) circule entre l'ecran et le boitier.
L'ambiant du boitier redescend a ~25-30 °C → SoC 65-75 °C → **marge de 5-15 °C**.

L'entrefer est assure par 4 entretoises cylindriques imprimees (Ø12 mm, trou M4, hauteur 18 mm)
qui traversent le capot et se fixent au support VESA du miroir.

**Action avant deploiement** : mesurer la temperature arriere de l'ecran Shineworld avec un
thermometre IR apres 1h de fonctionnement. Si >45 °C, augmenter SPACER_HEIGHT a 25 mm.

## 3. Pourquoi pas de NVMe HAT

Le M.2 HAT+ Standard a une limite operationnelle de **50 °C ambiant** (product brief p.3).
Derriere un ecran LCD, meme avec entrefer, l'ambiant peut ponctuellement approcher ou depasser
cette limite (bords de l'ecran, hot spots backlight).

**Alternative stockage** : microSD pour le MVP. Si la fiabilite microSD pose probleme en production,
utiliser un **SSD USB-C externe** (hors boitier, pas de contrainte thermique).

Le toggle `INCLUDE_NVME_HAT = true` dans case.scad reste disponible si les conditions changent
(Beelink x86 avec stockage interne, ou tests thermiques favorables).

## 4. Ventilation

Deux grilles hex larges pour maximiser le debit en profil slim :

| Grille | Taille | Trou | Position | Role |
|--------|--------|------|----------|------|
| Plancher (base) | 50 x 40 mm | Ø5 mm, pas 7 mm | Face visible (exterieure) | Intake air frais de la piece |
| Capot | 56 x 40 mm | Ø5.5 mm, pas 7.5 mm | Face ecran (cachee) | Exhaust air chaud du cooler |

Les grilles sont en hex (`$fn=6`) pour minimiser la geometrie OpenSCAD.

Le ventilateur Active Cooler (PWM, 8000 RPM max) cree une depression qui aspire l'air
par la grille plancher et l'expulse par la grille capot. L'airflow gap de 6 mm suffit
car les grilles sont larges et le ventilateur est actif.

## 5. Logo KBEAUTY

Le texte "KBEAUTY" est **grave** (pas embossé) dans le plancher, face exterieure.
Profondeur : 0.8 mm. Police : Liberation Sans Bold (incluse OpenSCAD).

La gravure est visible quand quelqu'un regarde derriere le miroir.
Pour personnaliser : modifier `LOGO_TEXT`, `LOGO_SIZE`, `LOGO_DEPTH` dans case.scad.

Pour utiliser la police Montserrat (charte K Beauty) :
1. Installer Montserrat sur le systeme
2. Changer `font="Liberation Sans:style=Bold"` → `font="Montserrat:style=Bold"` dans case.scad

## 6. Acces connecteurs

| Face | Connecteurs | Usage |
|------|-------------|-------|
| Nord (bord court) | USB-C, micro-HDMI 0, micro-HDMI 1 | Alim + sortie video vers ecran miroir |
| Est (bord long) | 2x paire USB-A, RJ45 | USB touch ecran (HID) + dongle WiFi + debug Ethernet (microscope en WiFi, pas USB) |
| Sud (bord court) | Slot microSD | Re-image SAV |
| Ouest (bord long) | Rien | GPIO accessible par demontage capot |

Les 4 ports USB-A sont accessibles. Le microscope etant en WiFi/TCP (`192.168.34.1:8080`, JHCMD), il n'occupe aucun port USB. Attribution recommandee :
- USB-A pair 1 (position 27mm) : retour tactile ecran (HID) + libre
- USB-A pair 2 (position 45mm) : dongle WiFi USB (acces internet en parallele du hotspot microscope) + libre

## 7. Fixation

4 trous M4 traversent la base et le capot, aux positions (`MOUNT_PITCH_X` x `MOUNT_PITCH_Y` =
70 x 46 mm, centre sur le boitier). Les entretoises VESA se vissent a travers ces trous.

L'autre extremite des entretoises se fixe au support VESA du miroir Shineworld (75x75 ou 100x100)
via un adaptateur metallique standard (~5 EUR). Le boitier "pend" sous les entretoises.

## 8. Contrainte imprimante

Volume max : **256 x 256 x 256 mm**. Le boitier fait 95 x 66 x 29.3 mm — aucune contrainte.
Les 4 entretoises tiennent aussi largement (plaque de 29 x 29 mm sur le plateau).

Materiau : PETG (Tg ~80 °C). Pas de PLA (Tg ~55 °C — risque de fluage derriere ecran).
Layer height recommande : 0.2 mm.

## 9. Cotes sourcees vs non sourcees

| Constante | Valeur | Source | Fiabilite |
|-----------|--------|--------|-----------|
| PI_LENGTH, PI_WIDTH | 85 x 56 mm | Drawing officiel RPi | Officiel |
| PI_HOLE_OFFSET, PITCH | 3.5 / 58 x 49 mm | Drawing officiel RPi | Officiel |
| COOLER dimensions | 63.5 x 42.5 x 13.7 mm | Drawing officiel Active Cooler | Officiel |
| USBC_Y, HDMI0_Y, HDMI1_Y | 11.2 / 25.8 / 39.2 mm | Drawing officiel RPi | Officiel |
| Positions USB-A pair 1/2 | 27 / 45 mm | Layout Pi estime | **A mesurer sur Pi reel** |
| Position RJ45 | 65 mm | Layout Pi estime | **A mesurer sur Pi reel** |
| SPACER_HEIGHT | 18 mm | Derive de l'analyse thermique | **A ajuster apres mesure IR ecran** |

## 10. Utilisation OpenSCAD

```
RENDER = "preview"   → vue montee (OPEN/CLOSED)
RENDER = "base"      → piece 1 : base seule (export STL)
RENDER = "lid"       → piece 2 : capot seul (export STL)
RENDER = "spacers"   → piece 3 : 4 entretoises (export STL)
RENDER = "all"       → les 3 pieces cote a cote

OPEN = true          → sans capot, vue interieure
OPEN = false         → boite fermee avec entretoises montees
SHOW_COMPONENTS      → Pi/cooler en transparence
INCLUDE_NVME_HAT     → toggle profil complet (41mm) si besoin
```
