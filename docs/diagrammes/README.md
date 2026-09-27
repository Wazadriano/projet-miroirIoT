# Diagrammes - index

Tous les diagrammes du projet, en **source Mermaid** (`.mmd`, éditable) et en **image PNG
haute résolution** (échelle 3x, fond blanc, prête pour Word / PowerPoint).

Pour régénérer une image après modification d'un `.mmd` :

```bash
npx -y @mermaid-js/mermaid-cli -i 01-mcd.mmd -o 01-mcd.png \
    -p /tmp/puppeteer-config.json -b white -s 3
# puppeteer-config.json : { "executablePath": "/usr/bin/google-chrome-stable",
#                           "args": ["--no-sandbox","--disable-setuid-sandbox"] }
```

(Alternative sans installation : copier le contenu du `.mmd` dans https://mermaid.live puis « Export PNG/SVG ».)

## Index

| Fichier | Diagramme |
|---------|-----------|
| `01-mcd.png` | **MCD** (conceptuel Merise) |
| `02-mld.png` | **MLD** (logique relationnel) |
| `03-cas-usage.png` | Cas d'usage UML (acteurs/fonctions) |
| `04-sequence-seance.png` | Séquence : déroulé d'une séance |
| `05-deploiement.png` | Déploiement (Pi + microscope + CRM + IA) |
| `06-classes-services-device.png` | Classes : services du device (Electron) |
| `07-architecture-composants.png` | Composants : device + CRM + IA |
| `08-planning-gantt.png` | Planning Gantt (4 sprints) |

## Notes

- Le MCD et le MLD sont dérivés du **schéma réel** des migrations Laravel du CRM
  (`crm/backend/database/migrations/`), pas d'une modélisation théorique : ils sont fidèles
  au code livré (multi-tenant par `boutique_id`, singleton `config_miroir`, association n-n
  `seance_produits`, verrou RGPD `consentement_id` en RESTRICT).
