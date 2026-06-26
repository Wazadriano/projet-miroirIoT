# Diagrammes - index et guide d'insertion

Tous les diagrammes du dossier, en **source Mermaid** (`.mmd`, éditable) et en **image PNG
haute résolution** (échelle 3x, fond blanc, prête pour Word / PowerPoint).

Pour régénérer une image après modification d'un `.mmd` :

```bash
npx -y @mermaid-js/mermaid-cli -i 01-mcd.mmd -o 01-mcd.png \
    -p /tmp/puppeteer-config.json -b white -s 3
# puppeteer-config.json : { "executablePath": "/usr/bin/google-chrome-stable",
#                           "args": ["--no-sandbox","--disable-setuid-sandbox"] }
```

(Alternative sans installation : copier le contenu du `.mmd` dans https://mermaid.live puis « Export PNG/SVG ».)

## Table de correspondance

| Fichier | Diagramme | Où l'insérer dans le dossier | Section PPT |
|---------|-----------|------------------------------|-------------|
| `01-mcd.png` | **MCD** (conceptuel Merise) | Partie 5.3 / Livrable 06 - Modèle de données | Slide « Modèle de données » |
| `02-mld.png` | **MLD** (logique relationnel) | Partie 5.3 / Livrable 06 - Modèle de données | Slide « Modèle de données » |
| `03-cas-usage.png` | Cas d'usage UML (acteurs/fonctions) | Partie 3 (besoins) / Livrable 05 | Slide « Besoins & acteurs » |
| `04-sequence-seance.png` | Séquence : déroulé d'une séance | Partie 5.3 / Livrable 05 | Slide « Parcours technique » |
| `05-deploiement.png` | Déploiement (Pi + microscope + CRM + IA) | Partie 5.1 (architecture) / Livrable 05 | Slide « Architecture physique » |
| `06-classes-services-device.png` | Classes : services du device (Electron) | Partie 5.3 (conception logicielle) | Slide « Architecture logicielle » |
| `07-architecture-composants.png` | Composants : device + CRM + IA | Partie 5.1 (architecture système) | Slide « Vue d'ensemble » |
| `08-planning-gantt.png` | Planning Gantt (Merise Agile, 4 sprints) | Partie 4 (gestion de projet) | Slide « Planning & méthode » |

## Notes

- Le MCD et le MLD sont dérivés du **schéma réel** des migrations Laravel du CRM
  (`crm/backend/database/migrations/`), pas d'une modélisation théorique : ils sont fidèles
  au code livré (multi-tenant par `boutique_id`, singleton `config_miroir`, association n-n
  `seance_produits`, verrou RGPD `consentement_id` en RESTRICT).
- Les 3 UML (cas d'usage, séquence, déploiement) proviennent du livrable 05 et restent
  synchronisés avec lui.
- Détail complet du modèle de données (dictionnaire, règles de gestion, contraintes
  d'intégrité, règles de passage MCD->MLD) : `docs/livrables/06-modele-donnees-merise.md`.
