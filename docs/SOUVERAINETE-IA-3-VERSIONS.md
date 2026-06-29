# Souveraineté de l'IA - 3 versions du Smart Mirror

> Document de préparation soutenance RNCP 37046. Fact-check daté du 2026-06-29, niveaux de confiance indiqués.
> Sujet : la chaîne d'analyse capillaire et sa souveraineté (où part la donnée, dépendance internet, RGPD).
> Note de cohérence : l'état RÉEL du code est tranché par `docs/GROUND-TRUTH-CODE.md` (audit du code). Côté device, le proxy IA par défaut (port 3001) est un MOCK (`Math.random`). Le seul appel IA réel se trouve côté serveur CRM (`crm/ia-service`, port 3002) et envoie la photo à **GitHub Models (Azure, US)** : OpenRouter n'est appelé dans aucun code (mentionné seulement dans la doc). Ce document-ci porte sur les OPTIONS d'architecture et leur souveraineté.

---

## 1. Le problème de souveraineté à reconnaitre honnêtement

Le seul chemin IA réel du code (service serveur `crm/ia-service`) envoie la **photo JPEG complète** à **GitHub Models (Azure / Microsoft, US)** (modèles vision Llama-3.2-11B / Phi-3.5-vision / gpt-4o-mini, auth `GITHUB_TOKEN`). Remarque : la documentation historique citait « OpenRouter », mais OpenRouter n'est appelé dans aucun code exécutable. Dans les deux cas, le fournisseur est **US**. Cela signifie :

- **Transfert hors UE** d'une image de cuir chevelu (donnée potentiellement sensible selon la finalité).
- **Dépendance internet** totale pour l'analyse.
- **Non souverain** : ni l'éditeur du modèle, ni l'hébergement ne sont maitrisés/UE.

Prétendre la souveraineté avec cette configuration serait faux. D'où une stratégie en **3 versions**.

---

## 2. Tableau des 3 versions (vue jury)

| Critère | V1 actuelle - GitHub Models (Azure US) | V2 cloud souverain - Mistral EU | V3 premium - NPU local offline |
|---|---|---|---|
| Souveraineté | Faible (routage possible US) | **Élevée** (éditeur + hébergement UE) | **Maximale** (rien ne sort du miroir) |
| Dépendance internet | Oui | Oui | **Non** |
| Qualité d'analyse | Élevée (gros modèles) | Élevée (Medium 3.5 / Large 3) | Voie A : ciblée (classes) / Voie B : moyenne (petit VLM) |
| Type de sortie | Langage naturel | Langage naturel | A : labels + scores / B : langage naturel |
| Coût matériel | Pi 5 seul | Pi 5 seul | + HAT NPU 70-130 EUR |
| Coût d'usage | Variable (marge agrégateur) | ~fractions de ct à ~1 ct EUR / analyse | **0 EUR marginal** (électricité) |
| Complexité | Faible | Faible-moyenne (DPA, ZDR, endpoint EU) | **Élevée** (entrainement + compilation Hailo) |
| Statut RGPD | Transfert hors UE probable | Pas de transfert hors UE si endpoint EU + ZDR + DPA | Aucun traitement externe (idéal) |

---

## 3. AXE 1 - Version cloud souveraine : Mistral AI (UE)

**Verdict : OUI, passer à Mistral rend l'analyse substantiellement souveraine.** Confiance élevée.

- **Modèles vision** (acceptent une image en entrée), début 2026, source `docs.mistral.ai/models/overview` :
  - Mistral Medium 3.5 (frontier multimodal), Mistral Large 3, Ministral 3 (14B/8B/3B, "best-in-class text and vision").
  - **Pixtral 12B / Pixtral Large existaient (2024-2025) mais sont DÉPRÉCIÉS début 2026.** Ne pas présenter Pixtral comme la solution actuelle : dire "la gamme vision Mistral (Pixtral hier, Medium 3.5 / Large 3 / Ministral 3 aujourd'hui)".
- **Souveraineté / données** (source `help.mistral.ai`) :
  - "By default, your data is hosted in the European Union." Le routage US est **opt-in** explicite.
  - **Zero Data Retention (ZDR)** disponible sur l'API (à contractualiser via DPA) : ni inputs ni outputs conservés.
  - Mistral AI = **entreprise française** (siège Paris), entité UE. Confiance ~95%.
- **Tarifs indicatifs** (source `mistral.ai/pricing`, page JS, **confiance moyenne ~70%, à revérifier le jour J**) :
  - Mistral Medium 3.5 : ~1,50 $ / 7,50 $ par M tokens (in/out).
  - Mistral Large 3 : ~0,50 $ / 1,50 $. Ministral 3 (8B) : ~0,15 $ / 0,15 $.
  - Une image est facturée en tokens (selon résolution). Une analyse capillaire (1 image + prompt + réponse courte) sur un petit modèle Ministral = de l'ordre de **fractions de centime à ~1 ct EUR** (ordre de grandeur).
- **Nuances honnêtes à dire au jury** :
  1. Ce n'est **pas** "100% local" : l'image quitte quand même le miroir. Souveraineté n'est pas confidentialité totale.
  2. La souveraineté UE dépend de la **configuration** (endpoint EU + ZDR activé + DPA signé), pas automatique.
  3. Vérifier le **Trust Center / liste des sous-traitants** Mistral (aucun sous-traitant hors UE non encadré par des SCC).

---

## 4. AXE 2 - Version premium 100% locale (NPU sur Pi 5)

### Matériel (accélérateurs Hailo pour Pi 5)

| Produit | Puce | TOPS | Prix officiel | EUR approx TTC* |
|---|---|---|---|---|
| AI Kit (arrêté) / AI HAT+ 13 | Hailo-8L | 13 | 70 USD | ~70 EUR |
| AI HAT+ 26 | Hailo-8 | 26 | 110 USD | ~110-120 EUR |
| **AI HAT+ 2** (15 jan 2026) | **Hailo-10H** | **40 (INT4)** + 8 Go LPDDR4 | **130 USD** | ~130-150 EUR |

\*EUR TTC = estimation TVA 20%, **confiance faible**, vérifier chez un revendeur FR (kubii.com). Connexion M.2/PCIe sur le Pi 5. Conso Hailo-8 ~2,5 W sous charge (confiance moyenne, à confirmer datasheet).

### Le point critique (coeur du fact-check)

**Un VLM génératif "diagnostic en langage naturel 100% local" n'est PAS réaliste sur Hailo-8/8L.** Confiance élevée.

- **Hailo-8 / 8L** (AI Kit, AI HAT+ 13/26) = accélérateur **vision classique uniquement** (CNN : classification, détection YOLO, segmentation). Limite matérielle dure : pas d'interface mémoire externe, tous les poids doivent tenir dans la SRAM on-chip -> impossible de charger un LLM/VLM de plusieurs milliards de paramètres.
- **Hailo-10H** (AI HAT+ 2, jan 2026) = ajoute 8 Go LPDDR4 dédiés -> fait tourner localement, **sans internet**, de **petits** LLM/VLM (DeepSeek-R1-Distill 1.5B, Llama 3.2 1B, Qwen2.5 1.5B). Perfs chiffrées non publiées (confiance faible sur la latence).
- **CPU seul (Ollama / llama.cpp, sans Hailo)** : faisable mais **lent**. moondream2 (1,9B) le plus léger ; LLaVA/Qwen 7B exigent 8 Go RAM et tournent à ~2 tokens/s (réponse = dizaines de secondes, inconfortable pour une UX miroir).

### Architecture locale RÉALISTE : deux voies

- **Voie A (recommandée) - Classification CNN dédiée sur Hailo-8** : entrainer/compiler un modèle de classification (ex. "cuir chevelu sec / gras / pellicules / normal") via le Hailo Dataflow Compiler. Rapide (temps réel), faible conso, 100% offline, souverain, ~70-110 EUR. Sortie = **labels + scores** ; le texte cosmétique est généré côté app par règles/templates. C'est la version 100% locale défendable aujourd'hui.
- **Voie B (prospective, V3+) - VLM génératif local** : Hailo-10H (~130 EUR) avec un petit VLM, ou VLM CPU (latence dégradée). Sortie en langage naturel mais qualité < cloud et maturité récente.

**Phrase clé jury** : "En local sur Pi 5, le réaliste et fiable aujourd'hui, c'est de la classification d'images dédiée (Hailo-8), pas un VLM génératif. Le diagnostic en langage naturel 100% local devient envisageable seulement avec le tout récent Hailo-10H (AI HAT+ 2, jan 2026) ou un petit VLM CPU à latence dégradée."

---

## 5. Note RGPD transversale

Une image de cuir chevelu **à finalité cosmétique** n'est en principe **pas une donnée de santé (art. 9 RGPD)** tant qu'aucune finalité médicale (diagnostic de pathologie : alopécie, dermatite) n'est revendiquée. Il faut donc **cadrer strictement "cosmétique, non médical"** dans toute la documentation, sinon bascule art. 9. Confiance moyenne (qualification juridique, à faire valider).

---

## 6. Questions pièges du jury + réponses honnêtes

1. **"Mistral c'est souverain, mais l'image quitte quand même le miroir ?"**
   -> Oui. Souveraineté n'est pas confidentialité totale. Atouts réels : éditeur français/UE, hébergement UE par défaut, ZDR + DPA + endpoint EU suppriment le transfert hors UE et la rétention. La seule version "rien ne sort" est la V3 locale. C'est pourquoi je propose 3 niveaux selon le besoin.
2. **"Votre NPU Hailo fait-il vraiment tourner l'IA générative en local ?"**
   -> Distinction nette : Hailo-8/8L non (vision classique, limite SRAM). Ma V3 réaliste = classification dédiée entrainée sur des classes capillaires. Le VLM génératif 100% local n'est possible qu'avec le Hailo-10H / AI HAT+ 2 (jan 2026) ou un petit VLM CPU lent : je le positionne en évolution.
3. **"Est-ce de la donnée de santé (art. 9) ?"**
   -> Tant que la finalité reste cosmétique sans diagnostic médical, non. Le risque serait de basculer en revendiquant du diagnostic de pathologie. D'où le cadrage strict + minimisation (traitement local quand possible).

---

## 7. Sources (consultées 2026-06-29)

- Mistral modèles : docs.mistral.ai/models/overview ; mistral.ai/news/pixtral-large
- Mistral données/EU/ZDR : help.mistral.ai (hébergement UE) ; legal.mistral.ai/terms/data-processing-addendum
- Mistral tarifs : mistral.ai/pricing (page JS, à revérifier)
- Raspberry Pi AI HAT+ : raspberrypi.com/news/raspberry-pi-ai-hat ; datasheets.raspberrypi.com/ai-hat-plus
- AI HAT+ 2 / Hailo-10H (15 jan 2026) : raspberrypi.com/news (AI HAT+ 2) ; cnx-software.com (2026-01-15)
- Hailo-8 vs LLM (limite mémoire) : community.hailo.ai ; hailo.ai/products (Hailo-10H)
- VLM local Pi 5 (perf) : learnopencv.com/vlm-on-edge-devices ; raspberry.tips (Ollama Pi 5)

## 8. À revérifier soi-même avant la soutenance

1. Prix exacts Mistral (page JS) et prix EUR TTC des HAT chez un revendeur FR.
2. ZDR : disponibilité contractuelle réelle sur le plan choisi + liste sous-traitants au Trust Center.
3. Consommation Hailo-8 en W (datasheet Hailo officielle).
4. Qualification RGPD art. 9 : à faire valider (question juridique, pas un fait technique).
