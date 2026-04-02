# Ecran Veille (Home) - id: 68:1930

## Description
Ecran d'accueil principal, affiche en boucle quand le miroir est en attente. Le client voit cet ecran en arrivant dans le salon. C'est le point d'entree de l'experience.

## Elements visuels

### Background
- Image doree plein ecran (formes organiques cuivrees sur fond sombre)
- Animation CSS pulse (scale 1 → 1.05, 20s)
- Overlay sombre semi-transparent

### Logo (haut centre)
- "K BEAUTY" en Playfair Display ~28px (8vw)
- "COSMETICS" en dessous, plus petit, espacement large
- Caracteres coreens (manquants dans l'app actuelle)
- Un pictogramme/icone a gauche du logo (SVG)

### Carrousel produits (milieu)
- 3 cartes Liquid Glass cote a cote
- Chaque carte : opacity 0.59, border-radius 10px, inset box-shadow dore 50px
- Dimensions Figma : 119x262 par carte = ~30vw x 37vh
- Contenu de chaque carte :
  - Image produit detouree (hauteur ~20vh)
  - Texte description (Inter 11px / 2.75vw, centre)
- Produits :
  1. SKIN1004 Centella Light Cleansing Oil
  2. COSRX Good Morning Low pH Cleanser
  3. Numbuzin Toner 3 Super Glowing

### Indicateurs carrousel (sous les cartes)
- 3 points : 1er actif (blanc), 2 inactifs (blanc 30% opacity)
- Gap 2vw entre les points

### Bouton COMMENCER (centre bas)
- Texte : "COMMENCER" en Montserrat Bold 16px (4vw)
- Style : Liquid Glass button, border-radius pill (1000px)
- Dimensions : 190x50 Figma = 47.5vw x ~7vh
- Shadow : inset dore 10px

### Bandeau promo (bas pleine largeur)
- Texte : "PROMOTION EXEPTIONNELLE -20%"
- Font : Playfair Display 15px (3.75vw)
- Style : barre glass pleine largeur, hauteur 30px (4.2vh)
- Position : absolute bottom 0

## Navigation
- Clic COMMENCER → Ecran Accueil

## Etat actuel app vs Figma
| Element | Figma | App | Statut |
|---------|-------|-----|--------|
| Logo K BEAUTY | Avec icone + coreens | Texte seul sans coreens | DIFFERENT |
| Cartes produits | 3 cartes glass | OK | OK |
| Images produits | Detourees | OK (assets telecharges) | OK |
| Descriptions | Inter 11px | OK (detail class) | OK |
| Dots carrousel | 3 points | OK | OK |
| Bouton COMMENCER | Glass pill | OK | OK |
| Bandeau promo | Playfair 15px | OK | OK |
| Animation fond | Pulse scale | Classe bg-animate-img | A VERIFIER |
