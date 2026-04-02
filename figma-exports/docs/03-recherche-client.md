# Ecran Recherche Client - id: 68:2273 + 125:1904

## Description
La praticienne cherche un client existant par nom. Affiche les resultats rapides (clients recents) en grille 2x2 avec photos du cuir chevelu.

## Variantes
- **68:2273** : Etat initial avec grille de resultats rapides
- **125:1904** : Etat avec champs de saisie (Prenom, Adresse mail, Valider, Inscription)

## Elements visuels

### Header (haut)
- "KBEAUTY - BUBBLE HAIR SPA" : Playfair Display 500, 24px (6vw)
- Barre glass sous le titre : pleine largeur, 30px (4.2vh)
- Sous-titre dans la barre : "Recherche Client" (Playfair Display 500, 15px / 3.75vw)

### Barre de recherche
- Input glass avec placeholder "Rechercher"
- Icone loupe a gauche : couleur #E8C9B5 (doree)
- Font dans input : Playfair Display 400, 15px
- Largeur : ~63vw dans le Figma (253px/399)

### "Resultats Rapides" (sous la barre)
- Texte : Playfair Display 500, 15px
- Centre

### Grille clients 2x2
- 4 cellules (2 colonnes, 2 lignes)
- Chaque cellule :
  - Photo cuir chevelu : rectangle, border-radius 25px (6.25vw), box-shadow doree 4px 3px
  - Dimensions photo : ~113x141 Figma = ~28vw x 20vh
  - Nom client : Playfair Display 500, 15px (centre sous la photo)
  - Date derniere seance : Montserrat 400, 12px (centre, opacity moindre)
- Noms dans le Figma : Lea Martin, Nathan Girard, Clara Bernard, Sarah Marchand
- Dates : 08/04/26, 26/03/26, 10/03/26, 26/02/26

### Icone calendrier (haut droite)
- Glass circle ~71x69 Figma
- Icone calendrier doree a l'interieur
- Position : droite de la barre de recherche
- MANQUANT dans l'app actuelle

### Bouton fleche (bas droite)
- Cercle glass ~46x46 Figma = 11.5vw
- Icone fleche droite doree
- Navigation → Nouveau client

### Variante 125:1904 (saisie)
- Champs supplementaires sous la barre de recherche :
  - "Prenom" (input)
  - "Adresse mail" (input)
  - "Valider" (bouton)
  - "Inscription" (bouton)
- C'est un etat alternatif quand la recherche ne donne pas de resultats

## Navigation
- Clic sur un client → Ecran Consentement (ou skip si consent recent)
- Bouton fleche → Nouveau client
- Bouton Inscription (variante) → Nouveau client

## Etat actuel app vs Figma
| Element | Figma | App | Statut |
|---------|-------|-----|--------|
| Header + barre | OK | OK | OK |
| Barre recherche + loupe | Loupe doree | OK (SVG loupe) | OK |
| Resultats Rapides | Playfair 15px | OK | OK |
| Grille 2x2 | Photos + noms + dates | OK (placeholder photos) | PARTIEL |
| Icone calendrier | Glass circle | MANQUANT | MANQUANT |
| Bouton fleche | Cercle 46px | OK | OK |
| Variante saisie | Prenom/Mail/Valider | NON IMPLEMENTE | MANQUANT |
