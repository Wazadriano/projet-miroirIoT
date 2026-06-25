# Ecran Diagnostic (Session) - id: 68:2095 + 82:724

## Description
Ecran principal de la seance : flux video microscope en direct, capture photos, diagnostic IA en temps reel. C'est l'ecran ou la praticienne passe le plus de temps.

## Variantes
- **68:2095 (Diagnostic)** : Etat avec flux live, texte diagnostic, 4 thumbnails, bouton SUIVANT
- **82:724 (Diagnostic 2)** : Etat avec "Note praticien" visible

## Elements visuels

### Header
- "KBEAUTY - BUBBLE HAIR SPA" + barre "Diagnostic en cours"

### Badge Live (sous le header)
- Pill glass : "Live"
- Montserrat 500, 14px (3.5vw)
- Petit pill a cote du header
- Figma montre aussi un petit pill glass supplementaire (opacity 0.68)

### Flux microscope (centre)
- Image en cercle : 280x280 Figma = 70vw
- Border-radius : 200px (cercle parfait)
- Box-shadow doree : 0px 0px 4px 2px #E8C9B5
- Affiche le stream MJPEG en direct

### Bouton capture (overlay sur le cercle)
- Petit cercle glass en bas-droite du cercle microscope
- 40x40 Figma = 10vw
- Icone camera doree a l'interieur
- Aussi accessible via le bouton physique du microscope

### Zone diagnostic (sous le cercle)
- Glass card subtle pleine largeur
- Titre : "Diagnostic :" (Playfair Display 500, 20px / 5vw)
- Texte IA : "Cheveux legerement secs sur les longueurs, racines equilibrees. Un soin hydratant apportera plus de douceur et de brillance."
- Font : Montserrat 500, 12px

### 4 Thumbnails captures (bas)
- 4 images en row : 70x70 Figma = 17.5vw
- Border-radius 25px (6.25vw)
- Box-shadow doree 4px 3px
- Affichent les photos capturees pendant la seance

### Boutons phase
- "Avant ({count})" et "Apres ({count})"
- Glass buttons, toggle actif/inactif
- L'actif a une box-shadow plus intense

### Bouton SUIVANT
- Glass button : "SUIVANT" (Montserrat Bold 16px)
- Dimensions : 132x39 Figma = 33vw x 10vw

### SideNav (droite)
- 3 icones : Home, User, Camera
- Camera = raccourci capture photo
- Visible uniquement apres le consentement

### Variante Diagnostic 2 (82:724)
- Ajoute "Note praticien :" sous le diagnostic
- Champ de saisie notes

## Navigation
- SUIVANT → Ecran Bilan
- Camera SideNav / Bouton physique microscope → Capture photo

## Etat actuel app vs Figma
| Element | Figma | App | Statut |
|---------|-------|-----|--------|
| Header + barre | OK | OK | OK |
| Badge Live | Pill glass | OK (glass-pill) | OK |
| Cercle microscope | 280x280 / 70vw | OK (70vw) | OK |
| Box-shadow cercle | Doree | OK | OK |
| Bouton capture overlay | Cercle glass | OK (10vw) | OK |
| Texte diagnostic | Montserrat 12px | OK | OK |
| 4 thumbnails | 70x70 | OK (17.5vw) | OK |
| Phase Avant/Apres | Toggle buttons | OK | OK |
| SUIVANT | 132x39 | OK (33vw x 10vw) | OK |
| SideNav | 3 icones | OK | OK |
| Note praticien (D2) | Champ sous diagnostic | NON (dans Bilan) | DIFFERENT |
| Bouton reconnecter | Non dans Figma | Ajoute dans app | EXTRA |
