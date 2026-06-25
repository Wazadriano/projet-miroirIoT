# Ecran Inscription Nouveau Client - id: 142:1106 / 142:1728 / 142:2453 / 142:2031 / 142:2243

## Description
Formulaire d'inscription d'un nouveau client. Les 5 variantes (Recherche client 3-7) representent les differents etats du formulaire : vide, en saisie, avec clavier virtuel visible, champs remplis, etc.

## Variantes et leurs etats
- **142:1106 (RC3)** : Formulaire complet rempli (Dupont/Jean/j.dupont@mail.fr/54) + checkboxes
- **142:1728 (RC6)** : Meme contenu, etat different (checkboxes + formulaire)
- **142:2453 (RC7)** : Formulaire avec age "54" saisi
- **142:2031 (RC4)** : Focus sur champ "Nom" (clavier visible en bas)
- **142:2243 (RC5)** : Focus sur champ "Prenom" (clavier visible en bas)

## Elements visuels

### Header
- "KBEAUTY - BUBBLE HAIR SPA" + barre "Inscription Nouveau Client"

### Formulaire (centre)
Champs dans l'ordre :
1. **Nom** : label "Nom :" + input glass (valeur "Dupont")
2. **Prenom** : label "Prenom :" + input glass (valeur "Jean")
3. **Adresse mail** : label "Adresse mail :" + input glass (valeur "j.dupont@mail.fr")
4. **Sexe** : label "Sexe :" + 2 boutons H/F
   - "H" : bouton glass avec icone homme
   - "F" : bouton glass avec icone femme
   - Icones SVG : male_24dp et female_24dp
   - Le Figma montre H et F, pas "Homme" / "Femme" / "Non-Precise"
5. **Age** : label "Age :" + input glass (valeur "54" ou "0")

### Checkboxes RGPD (sous le formulaire)
- Checkbox 1 : "J'accepte le traitement de mes donnees"
- Checkbox 2 : "J'accepte la politique de confidentialite"
- Icones toggle (checkmark visible quand coche)

### Bouton INSCRIPTION
- Texte : "INSCRIPTION"
- Style : Glass button, Playfair Display 500, 15px
- Pleine largeur du formulaire

### Clavier virtuel (visible dans RC4 et RC5)
- Clavier AZERTY affiche en bas de l'ecran quand un champ est focus
- Prend ~40% de la hauteur de l'ecran
- Les variantes RC4 et RC5 montrent explicitement le clavier
- C'EST UN ELEMENT CLE : le miroir est tactile, pas de clavier physique

### Icone recherche (haut)
- Petit bouton "Recherche" avec icone pour revenir a la recherche

## Navigation
- INSCRIPTION (apres validation) → Ecran Consentement
- Bouton Recherche → Retour recherche client

## Etat actuel app vs Figma
| Element | Figma | App | Statut |
|---------|-------|-----|--------|
| Header | OK | OK | OK |
| Champ Nom | Input glass | OK | OK |
| Champ Prenom | Input glass | OK | OK |
| Champ Mail | Input glass | OK | OK |
| Sexe H/F | 2 boutons H/F | 3 boutons Homme/Femme/Non-Precise | DIFFERENT |
| Icones H/F | SVG male/female | Pas d'icones, texte seul | DIFFERENT |
| Champ Age | Input glass | OK (0-120 validation) | OK |
| Checkbox RGPD 1 | "traitement donnees" | OK | OK |
| Checkbox RGPD 2 | "politique confidentialite" | OK | OK |
| Bouton INSCRIPTION | Glass button | OK | OK |
| Clavier virtuel | Visible dans variantes | NON IMPLEMENTE | MANQUANT |
| Bouton Recherche | En haut | MANQUANT | MANQUANT |
