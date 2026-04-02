# Ecran Historique - id: 68:2467 + 95:811 + 95:943 + 128:1050

## Description
Timeline des seances precedentes du client. Affiche les dates et permet de revoir les diagnostics. 4 variantes montrent differents etats.

## Variantes
- **68:2467 (Historique)** : Timeline avec 3 dates + "Voir plus" + "TERMINER"
- **95:811 (Historique 3)** : Variante timeline
- **95:943 (Histtorique 4)** : Variante avec AVANT/APRES, CONSEIL, VEILLE
- **128:1050 (Historque 2)** : Variante

## Elements visuels

### Header
- "KBEAUTY - BUBBLE HAIR SPA" + barre "Historique"

### Timeline (centre)
- 3 entrees avec dates :
  - 12/03/2026
  - 12/01/2026
  - 12/11/2025
- Chaque entree : card glass avec miniature + date
- Disposition verticale

### Bouton "Voir plus"
- Sous la timeline
- Glass button
- Pour charger d'autres seances

### Bouton TERMINER (bas)
- Glass button : "TERMINER"
- Retour a l'ecran de veille

### SideNav + Group 4
- Barre laterale droite avec icones
- Inclut le composant Group 4 (nav interne)

### Variante 95:943 (Histtorique 4)
- 3 boutons d'action : "AVANT / APRES", "CONSEIL", "VEILLE"
- C'est une vue detaillee d'une seance dans l'historique

## Navigation
- Voir plus → Charger plus de seances
- TERMINER → Retour Veille
- Clic entree timeline → Detail seance

## Etat actuel app vs Figma
| Element | Figma | App | Statut |
|---------|-------|-----|--------|
| Ecran dedie | Historique | NON IMPLEMENTE | MANQUANT |
| Header | OK | N/A | N/A |
| Timeline dates | 3 entrees | N/A | N/A |
| Voir plus | Bouton | N/A | N/A |
| TERMINER | Bouton | N/A | N/A |

## Note architecturale
L'audit Winston a recommande de NE PAS implementer l'Historique sur le miroir (c'est une fonction CRM, pas miroir). Le CDC ne prevoit pas cet ecran sur le miroir. Si on l'implemente, c'est un ajout hors-CDC.
