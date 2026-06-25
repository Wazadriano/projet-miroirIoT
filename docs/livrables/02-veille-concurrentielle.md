# Veille concurrentielle

> Livrable de soutenance — Projet Miroir IoT capillaire pour institut K-beauty
> Chef de projet unique : Adriano [A COMPLETER : nom complet]
> Client : KBEAUTY / K Beauty Cosmetics (cosmetiques coreens, e-commerce Shopify, mailing Klaviyo, service premium "Bubble Hair Spa")

## 1. Introduction : sortir du mythe "aucun concurrent"

Affirmer qu'un produit n'a "aucun concurrent" est un signal d'alarme, pas un argument de vente. Dans 90 % des cas, cela signifie l'une de deux choses : soit le marche n'existe pas (personne n'a paye pour ce probleme), soit l'analyse de la concurrence n'a pas ete faite. Le diagnostic capillaire assiste par image et IA est au contraire un marche actif, occupe par des acteurs etablis et bien capitalises.

Le bon positionnement n'est donc pas "nous sommes seuls", mais : **"nous occupons un creneau que les acteurs etablis ne servent pas — le diagnostic capillaire integre verticalement, a faible cout materiel, connecte au CRM marchand, deploye en institut K-beauty premium."** Les concurrents existent ; aucun ne combine exactement notre chaine de valeur. C'est cette honnetete qui rend le positionnement defendable devant un jury.

Il faut aussi nommer ce que nous ne sommes pas : nous ne sommes pas un dispositif medical (hors MDR, finalite cosmetique, zero allegation therapeutique), ni un microscope dermatologique de cabinet. Nous sommes un outil de vente-conseil et de fidelisation en point de vente.

## 2. Tableau des concurrents directs et adjacents

| Acteur | Type de produit | Cible | Force | Limite vs notre projet |
|--------|-----------------|-------|-------|------------------------|
| **L'Oreal / Kerastase K-Scan** | Diagnostic capillaire connecte de marque, capteur + app | Salons partenaires, distribution Kerastase | Puissance marque, R&D, reseau salons mondial | Ecosysteme ferme Kerastase ; aucune integration CRM marchand tiers (Shopify) ; pas de microscope generaliste bas cout |
| **BECON** (coreen, soutenu par Samsung) | Scanner cuir chevelu IA grand public/pro | Salons et consommateurs coreens, K-beauty | Backing Samsung, IA cuir chevelu mature, ancrage K-beauty | Produit ferme oriente scan ponctuel ; pas de chaine integree CRM e-commerce + institut premium hors Coree |
| **FotoFinder** | Imagerie dermatologique pro (trichoscopie, TrichoScan) | Dermatologues, cliniques capillaires | Reference clinique, precision elevee, donnees medicales | Positionnement medical lourd et couteux ; surdimensionne et hors cible pour un institut cosmetique de vente-conseil |
| **Aram Huvis ARAMO** | Camera/microscope diagnostic peau et cuir chevelu | Instituts, spas, distributeurs cosmetiques | Materiel eprouve, large gamme, distribution etablie | Brique materielle seule ; pas d'IA cloud integree ni de CRM marchand ; l'integration reste a la charge du revendeur |
| **CareOS Poseidon** | Miroir intelligent salle de bain (plateforme) | Domotique haut de gamme, hotellerie, retail beaute | Plateforme miroir complete, partenariats marques | Generaliste "smart mirror" ; pas de diagnostic capillaire microscope dedie ni d'integration verticale institut K-beauty |
| **HiMirror** | Miroir beaute grand public, analyse peau | Consommateur B2C, analyse peau/maquillage | Notoriete grand public, prix accessible | Centre peau/maquillage, pas cuir chevelu/cheveu ; pas de microscope ni de CRM institut ; trajectoire commerciale fragile |
| **Simplehuman** | Miroir a eclairage capteur (Sensor Mirror) | Consommateur premium, salle de bain | Qualite materielle, eclairage, marque premium | Aucune fonction de diagnostic ni d'IA capillaire ; concurrent "adjacent" sur l'objet miroir, pas sur la fonction |

Lecture : les **directs** sur la fonction diagnostic capillaire sont K-Scan, BECON, FotoFinder, ARAMO. Les **adjacents** sur l'objet miroir/beaute sont CareOS, HiMirror, Simplehuman.

## 3. Matrice de differenciation

Notre avantage ne tient pas a une brique isolee — chacune existe ailleurs — mais a leur **integration verticale** dans un seul parcours institut K-beauty.

| Critere | K-Scan | BECON | FotoFinder | ARAMO | CareOS | HiMirror | **Notre projet** |
|---------|:------:|:-----:|:----------:|:-----:|:------:|:--------:|:----------------:|
| Microscope/imagerie capillaire dediee | Oui | Oui | Oui (medical) | Oui | Non | Non | **Oui (USB UVC ~45 EUR)** |
| Materiel a faible cout | Non | Non | Non | Moyen | Non | Oui | **Oui (Pi 5 + UVC)** |
| IA d'analyse | Oui | Oui | Oui | Partiel | Partiel | Oui | **Oui (cloud OpenRouter, ~0,002 EUR/analyse)** |
| Integration CRM marchand (Shopify) | Non | Non | Non | Non | Non | Non | **Oui (CRM dedie K-beauty)** |
| Ancrage institut K-beauty premium | Partiel | Oui (Coree) | Non | Non | Non | Non | **Oui (Bubble Hair Spa)** |
| Ecosysteme ouvert / sur-mesure client | Non | Non | Non | Brique seule | Plateforme | Non | **Oui (developpe pour KBEAUTY)** |

**Notre angle = integration verticale microscope bas cout + IA + CRM Shopify en institut K-beauty premium.** Aucun acteur du tableau ne ferme la boucle "diagnostic en cabine -> fiche client enrichie -> recommandation produit -> e-commerce/fidelisation". K-Scan et BECON ferment leur ecosysteme ; FotoFinder vise le medical ; ARAMO vend la brique sans le logiciel ni le CRM ; CareOS/HiMirror/Simplehuman ne font pas de diagnostic capillaire serieux.

Note d'honnetete technique (a assumer en soutenance) : le microscope WiFi est l'**option** de differenciation visee, mais la V1 fonctionne en **USB UVC par defaut** (conforme au code ; le double-WiFi n'est pas implemente en V1, `wifi.service.ts` ne gere que `wlan0`). Le cout materiel reste l'argument fort : Raspberry Pi 5 (4 Go recommande pour le MVP, dimensionnement a confirmer par mesure 48h `free -m`/VmRSS) ~150-200 EUR (crise RAM juin 2026), alimentation 27W ~12 EUR, refroidisseur actif ~8 EUR, microSD ~15 EUR, boitier PETG imprime profil SLIM ~5 EUR, microscope USB UVC ~45 EUR. Le vrai poste d'incertitude du TCO reste l'ecran Shineworld 32 pouces ~700-900 EUR, **a chiffrer fermement par devis**.

## 4. Conclusion : un positionnement defendable

Le positionnement defendable n'est pas "nous sommes seuls" mais **"nous sommes les seuls a integrer toute la chaine pour ce client et ce canal precis"**. Trois piliers le soutiennent :

1. **Cout d'acces materiel bas** (Pi 5 + microscope UVC) la ou les references du marche imposent des plateformes fermees et couteuses — ce qui rend le deploiement multi-points realiste : MVP soutenance = 1 boutique / 1 tenant ; cible commerciale = 6 miroirs / 3 boutiques (Nice, Lyon, Cannes).
2. **Integration verticale CRM** que personne d'autre n'offre : le diagnostic alimente directement la fiche client et le e-commerce Shopify / mailing Klaviyo de KBEAUTY.
3. **Specialisation K-beauty premium** ("Bubble Hair Spa"), un canal et un univers de marque que les acteurs generalistes ne servent pas.

Les limites a assumer sans les masquer : la differenciation WiFi est une **roadmap**, pas une realite V1 (USB par defaut) ; l'IA est **100 % cloud (OpenRouter, datacenter US)**, ce qui impose une conformite RGPD Chapitre V (DPA art.28, clauses de transfert DPF/SCC art.46, TIA Schrems II, et consentement explicite art.9(2)(a) si donnees de sante — position art.9 a traiter par precaution, cf. CJUE C-184/20). La roadmap d'analyse on-device (OpenCV, scores anonymises) repond a ce point sans etre encore implementee.

Message au jury : nous n'avons pas invente un marche vierge — nous avons identifie un **angle mort** dans un marche reel, et construit l'integration que les leaders ne proposent pas.

---

*[A COMPLETER : identite et activite d'OHADJA, son TJM, le parcours personnel d'Adriano, remerciements.]*
