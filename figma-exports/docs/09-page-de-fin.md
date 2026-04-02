# Ecran Page de fin (QR Code) - id: 68:2653

## Description
Dernier ecran de la seance. Affiche le QR code pour que le client recupere son rapport PDF sur son telephone. Propose 3 actions : retour veille, revoir la comparaison, voir les conseils.

## Elements visuels

### Background
- Meme fond dore anime
- Pas de header "KBEAUTY" sur cet ecran

### Titre (centre haut)
- Texte : "Retrouvez votre bilan"
- Font : Playfair Display, grande taille
- Centre

### QR Code (centre)
- Grand QR code : minimum 200x200 Figma = 50vw
- Fond blanc, border-radius 25px
- Box-shadow doree
- Pointe vers l'URL du rapport PDF
- Scannable par le telephone du client

### 3 Boutons d'action (sous le QR)
- **VEILLE** : retour a l'ecran de veille (reset session)
- **AVANT / APRES** : revoir la comparaison avant/apres
- **CONSEIL** : voir les produits recommandes
- Style : Glass buttons, pleine largeur (max ~62.5vw)
- Disposition : colonne, gap entre les boutons

### SideNav + Group 4
- Barre laterale droite visible
- Navigation interne

### Countdown (non visible dans Figma mais prevu)
- Timer auto-retour a la veille (30s)
- Texte : "Retour automatique dans Xs"

## Navigation
- VEILLE → Reset session → Home
- AVANT / APRES → ComparisonScreen
- CONSEIL → (produits recommandes, non implemente)
- Auto-timeout → Reset session → Home

## Etat actuel app vs Figma
| Element | Figma | App | Statut |
|---------|-------|-----|--------|
| Titre | "Retrouvez votre bilan" | OK | OK |
| QR Code | Vrai QR scannable | PLACEHOLDER SVG | MANQUANT |
| Bouton VEILLE | Glass button | OK | OK |
| Bouton AVANT/APRES | Glass button | OK | OK |
| Bouton CONSEIL | Glass button | OK (handler vide) | PARTIEL |
| Countdown | Non dans Figma | OK (30s) | EXTRA |
| SideNav | Visible | MANQUANT | MANQUANT |

## Fonctionnel manquant
- Generation PDF (backend n8n/mock)
- Generation QR code (lib qrcode)
- Endpoint scan QR → telechargement PDF
- Envoi PDF au CRM
