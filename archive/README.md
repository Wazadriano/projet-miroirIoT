# Archive — fichiers de travail mis de côté

Ce dossier regroupe des répertoires de travail et des vestiges techniques déplacés
hors de la vue principale du dépôt afin d'améliorer la lisibilité pour le jury RNCP.
**Rien n'a été supprimé** : tous ces fichiers restent suivis par git et sont
intégralement récupérables (`git mv archive/<dossier> <dossier>` pour restaurer).
La vue « jury » utile reste à la racine (`README.md`, `CDC_*.md`,
`smart_mirror_specs_techniques.md`), dans `docs/` et dans `smart-mirror/device-setup/`.

| Dossier archivé        | Volume (fichiers suivis) | Nature / raison de l'archivage                                                                 |
|------------------------|--------------------------|-----------------------------------------------------------------------------------------------|
| `_byan/`               | 782                      | Framework d'agents (BMAD-METHOD) : agents, workflows, templates. Outillage interne, non livrable. |
| `_byan-output/`        | 4                        | Sorties générées par les agents `_byan` (créations BMB). Artefacts intermédiaires.            |
| `figma-exports/`       | 57                       | Exports Figma bruts (chunks YAML + quelques .md + PNG). Données brutes non destinées au jury. |
| `snapshots/`           | 22                       | Captures d'écran de QA/debug (PNG) issues du développement. Artefacts de travail.             |

Total déplacé : **865 fichiers suivis**, dont **679 `.md`** (666 provenant de `_byan/`).
