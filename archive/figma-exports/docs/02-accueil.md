# Ecran Accueil - id: 90:1182

## Description
Page de bienvenue apres la veille. Le client ou la praticienne choisit entre se connecter (client existant) ou s'inscrire (nouveau client). Distinct de la Veille.

## Elements visuels

### Background
- Meme image doree animee que la Veille
- Pas de header "KBEAUTY - BUBBLE HAIR SPA" sur cet ecran

### Titre (centre)
- Texte multiline : "Vivez l'experience / Bubble Hair Spa / Coreen"
- Font : Playfair Display 400, 32px (8vw)
- Couleur : blanc
- Max-width : ~82vw
- Position : centre vertical

### Boutons d'action (sous le titre)
- "CONNEXION" : Liquid Glass button pill, 190x50 Figma = 47.5vw
  - Navigation → Recherche client
- "INSCRIPTION" : meme style, en dessous
  - Navigation → Nouveau client (inscription)
- Gap entre les 2 boutons : ~3vh

### Barre navigation laterale (SideNav droite)
- Position fixe a droite, centree verticalement
- 3 icones empiles :
  1. Home (icone maison, blanc)
  2. User (icone personne, dore #E8C9B5)
  3. Settings/camera (icone, dore)
- Chaque bouton : cercle ~44px (11vw)
- Fond : glass effect, border-radius gauche

### Image profil boutique (bas gauche)
- Image cercle 58x58 Figma = 14.5vw
- Photo du salon/boutique

### Lien Instagram (bas gauche)
- Texte "Instagram", Montserrat Bold 16px
- Opacity 0.6
- Position : absolute bottom 4vh, left 5vw

## Navigation
- CONNEXION → Ecran Recherche client
- INSCRIPTION → Ecran Nouveau client

## Etat actuel app vs Figma
| Element | Figma | App | Statut |
|---------|-------|-----|--------|
| Titre multiline | Playfair 32px | OK | OK |
| CONNEXION | Glass pill | OK | OK |
| INSCRIPTION | Glass pill | OK | OK |
| SideNav 3 icones | Home/User/Camera | OK (3 icones) | OK |
| Image profil | Cercle 58px | MANQUANT | MANQUANT |
| Instagram | Texte bas gauche | OK | OK |
