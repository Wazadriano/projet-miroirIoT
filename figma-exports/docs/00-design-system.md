# Design System - Figma DreamTech

## Composants Figma

### Button - Liquid Glass - Text
- Border-radius : 1000px (pill)
- Background : glass-bg rgba(245, 245, 245, 0.08) + backdrop-filter blur(10px)
- Box-shadow : inset 0px 0px 10px 0px rgba(212, 163, 142, 1)
- Font : Montserrat Bold 700, 16px (4vw)
- Text-transform : uppercase
- Couleur texte : #FFFFFF
- Padding : 6px 20px (1.5vw 5vw)
- Variante "Tinted=False" : sans teinte supplementaire

### Liquid Glass - Regular - Small
- Border-radius : 296px
- Background : glass fill + shadow
- Effet : box-shadow 0px 8px 40px rgba(0,0,0,0.12)
- Utilise pour les barres (header, promo)

### Liquid Glass - Regular - Medium
- Border-radius : 34px (cartes), 50px (glass effect)
- Opacity : 0.59
- Box-shadow : inset 0px 0px 50px 0px rgba(212, 163, 142, 1)
- Utilise pour les cartes produits

### Group 3 / Group 4 (SideNav)
- Barre laterale droite
- 3 icones empiles : home, user, settings/camera
- Box-shadow : inset 0px 0px 2px 0px rgba(212, 163, 142, 1)
- Chaque icone : cercle ~45px

## Typographie

| Usage | Font | Weight | Taille Figma | Taille VW |
|-------|------|--------|-------------|-----------|
| Titre XL | Playfair Display | 400 | 32px | 8vw |
| Titre LG (header) | Playfair Display | 500 | 24px | 6vw |
| Titre MD | Playfair Display | 500 | 20px | 5vw |
| Titre SM (sous-titre) | Playfair Display | 500 | 15px | 3.75vw |
| Boutons | Montserrat | 700 | 16px | 4vw |
| Corps MD | Montserrat | 500 | 14px | 3.5vw |
| Corps SM | Montserrat | 400 | 12px | 3vw |
| Labels | Montserrat | 200 | 12px | 3vw |
| Details produits | Inter | 400 | 11px | 2.75vw |
| Bandeau promo | Playfair Display | 400 | 15px | 3.75vw |

## Couleurs

| Variable | Valeur | Usage |
|----------|--------|-------|
| --color-text | #FFFFFF | Tout le texte |
| --color-accent | #E8C9B5 | Icones, accents, highlights |
| --color-shadow-gold | rgba(212, 163, 142, 1) | Box-shadow inset principal |
| --color-shadow-gold-light | rgba(232, 201, 181, 1) | Box-shadow externe images |
| --color-glass-bg | rgba(245, 245, 245, 0.08) | Fond des composants glass |
| --color-glass-fill | rgba(0, 0, 0, 0.35) | Fill shadow sombre |
| --color-bg | #0F0F1A | Fond de l'app |

## Background
- Image : background-golden-1874d7.png (712x1263, formes organiques dorees/cuivrees)
- Animation : bgPulse (scale 1 → 1.05 → 1, 20s ease-in-out infinite)
- Overlay : rgba(0, 0, 0, 0.25) par dessus l'image
- Position : fixed, cover, z-index 0

## Dimensions de reference
- Artboard Figma : 399x708 (portrait 9:16)
- Ecran cible : 1080x1920 (32" Full HD portrait)
- Ratio de conversion : 1px Figma = 2.707vw ecran
- Formule : taille_vw = (taille_figma_px / 399) * 100

## Clavier virtuel
- Visible dans les variantes Figma RC4 et RC5 (Inscription)
- AZERTY, prend ~40% bas de l'ecran
- Apparait quand un champ input est focus
- En prod : gere par Onboard/Squeekboard (setup-keyboard.sh)
- En dev : clavier physique du PC
