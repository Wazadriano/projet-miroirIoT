# Ecran Notes Praticien - id: 140:1078 + 144:2045

## Description
Ecran pour que la praticienne saisisse des notes sur le client. Affiche avant ou apres la session selon le flow. Le Figma montre 2 variantes.

## Variantes
- **140:1078** : Etat initial avec champs vides
- **144:2045** : Etat avec "..." dans le champ note (saisie en cours)

## Elements visuels

### Header
- "KBEAUTY - BUBBLE HAIR SPA" + barre "Notes Praticien"

### Champs (centre)
- "Prenom" : champ glass input
- "Adresse mail" : champ glass input
- "Note" : textarea glass, plus grand, pour saisie libre

### Glass cards de fond
- 2 cartes Liquid Glass Medium en arriere-plan (opacity 0.59)
- Decoration visuelle

## Navigation
- Non explicite dans le Figma
- En theorie : apres le Bilan, avant la Page de fin

## Etat actuel app vs Figma
| Element | Figma | App | Statut |
|---------|-------|-----|--------|
| Ecran dedie | Notes Praticien | Integre dans ComparisonScreen (Bilan) | DIFFERENT |
| Header + barre | OK | N/A (pas d'ecran dedie) | N/A |
| Champ Prenom | Glass input | N/A | N/A |
| Champ Mail | Glass input | N/A | N/A |
| Champ Note | Textarea glass | Textarea dans le Bilan | PARTIEL |

## Note architecturale
L'audit Winston a recommande de NE PAS creer un ecran separe Notes Praticien sur le miroir (c'est une fonction CRM). La note de seance est integree dans l'ecran Bilan (ComparisonScreen). Le Figma montre un ecran dedie que le CDC ne prevoit pas.
