# Storyboard de soutenance orale - Smart Mirror KBEAUTY

> Presentation orale 40 minutes. Titre RNCP 37046 (Chef de projet en solutions logicielles pour l'IoT).
> Candidat : Adriano, alternant chez OHADJA, etudiant a ACADENICE.
> Client : KBEAUTY-COSMETICS (institut K-beauty a Nice). Produit : miroir connecte d'analyse capillaire cosmetique (Bubble Hair Spa).
> Tous les faits techniques de ce storyboard proviennent de `docs/GROUND-TRUTH-CODE.md` et `docs/SOUVERAINETE-IA-3-VERSIONS.md`.
> Regle de redaction : zero emoji, francais avec accents corrects, finalite cosmetique NON medicale rappelee partout.

---

## 1. Identite visuelle

### Palette

| Role | Couleur | Code | Usage |
|------|---------|------|-------|
| Primaire (prune) | Plum | `#6B2D5C` | Titres, bandeaux de section, aplats forts |
| Secondaire (or) | Gold | `#9C7A3C` | Accents, chiffres cles, soulignements, icones actives |
| Fond clair | Ivoire | `#F7F3EE` | Fond de slide par defaut |
| Fond sombre | Aubergine | `#2A1326` | Slides de transition et de section |
| Texte | Anthracite | `#22202A` | Corps de texte sur fond clair |
| Alerte / honnetete | Terracotta | `#B5562F` | Encarts "honnetete jury", risques, RGPD |
| Validation | Sauge | `#5E7A5A` | MVP realise, tests verts, points acquis |

### Typographie

- Titres : police a empattement humaniste ou geometrique forte (ex. "Fraunces" ou "Playfair Display") pour l'esprit institut beaute premium.
- Corps : sans-serif lisible a distance (ex. "Inter" ou "Source Sans 3"), taille minimale 24 pt sur slide.
- Chiffres cles : gros, en or sur prune.

### Systeme d'icones

- Bibliotheque principale : `lucide` (icones de fonction : scan-line, shield-check, database, git-branch, microscope, lock, cpu, wifi).
- Bibliotheque marques/technos : `simple-icons` (Electron, React, TypeScript, Node.js, PostgreSQL, Python, Docker, Raspberry Pi, Linux).
- Regle : une techno = une icone. Jamais de liste de librairies sur la slide. Le detail va dans les notes orateur.

### Trame de slide (gabarit)

- Bandeau superieur fin couleur de section + numero de slide en or a droite.
- Un titre court (4 a 7 mots maximum).
- Une seule idee par slide : soit 3 a 5 puces courtes, soit un visuel central, jamais les deux charges.
- Pictogramme de section en filigrane discret.
- Pied de page constant : "Adriano - RNCP 37046 - Smart Mirror KBEAUTY - 2026".

### Codes par section (pictogramme de section)

| Section | Pictogramme lucide | Couleur de bandeau |
|---------|--------------------|--------------------|
| Ouverture | sparkles | Aubergine |
| Qui je suis | user | Prune |
| Entreprise et client | building-2 | Prune |
| Probleme et marche | trending-up | Prune |
| Cahier des charges | clipboard-list | Or sur prune |
| Devis | receipt | Or sur prune |
| Gestion de projet | kanban | Prune |
| Conception et technique | cpu | Aubergine |
| Demo et resultats | monitor-play | Sauge |
| Bilan et perspectives | compass | Prune |
| Remerciements | heart-handshake | Aubergine |

---

## 2. Table de minutage (40 minutes)

| Bloc | Slides | Duree cible | Cumul |
|------|--------|-------------|-------|
| Ouverture / accroche | 1 a 2 | 2 min | 2 min |
| Qui je suis (parcours, hobbies, outils, entreprise) | 3 a 6 | 4 min | 6 min |
| Entreprise et client | 7 a 8 | 3 min | 9 min |
| Probleme et marche (contexte, PESTEL, veille, SWOT) | 9 a 13 | 6 min | 15 min |
| Cahier des charges fonctionnel (CDCF) | 14 a 16 | 4 min | 19 min |
| Devis et chiffrage | 17 | 2 min | 21 min |
| Gestion de projet | 18 a 19 | 4 min | 25 min |
| Conception et technique | 20 a 28 | 9 min | 34 min |
| Demo et resultats | 29 | 3 min | 37 min |
| Bilan et perspectives | 30 a 31 | 2 min | 39 min |
| Remerciements et questions | 32 | 1 min | 40 min |

Total : 32 slides, 40 minutes. La slide 21 (justification des choix techniques) est une synthese rapide d'environ 1 minute absorbee dans le bloc conception. Garder 10 a 15 minutes de questions hors temps de presentation si le jury le prevoit.

---

## 3. Storyboard slide par slide

---

### Slide 1 - Ouverture

**Titre :** Smart Mirror KBEAUTY

**Contenu visible :**
- Sous-titre : "Le miroir qui revele ce que l'oeil ne voit pas".
- Une ligne : analyse capillaire cosmetique pour institut K-beauty.
- Nom, titre vise (RNCP 37046), date, logo ACADENICE et logo OHADJA.

**Notes orateur :**
"Bonjour, je suis Adriano. Aujourd'hui je vous presente le projet que j'ai mene en alternance : un miroir connecte d'analyse capillaire pour un institut de beaute coreenne a Nice. Avant la technique, je vais vous raconter une scene de salon, parce que tout est parti d'un besoin tres concret du terrain." Rester debout, calme, contact visuel. Ne pas lire la slide.

**Visuel suggere :** Visuel plein cadre d'un miroir d'institut elegant avec un leger reflet doré, palette prune et or. Icone lucide "sparkles" en filigrane. Pas de capture d'ecran technique ici, on vend l'emotion.

---

### Slide 2 - L'accroche (la scene de salon)

**Titre :** Une cliente, une question simple

**Contenu visible :**
- Une phrase centrale : "Est-ce que mon cuir chevelu va vraiment mieux ?"
- Trois mots cles : Conseiller. Objectiver. Fideliser.

**Notes orateur :**
"Dans un institut K-beauty, le soin signature s'appelle le Bubble Hair Spa. La praticienne fait un diagnostic du cuir chevelu, applique un protocole, et la cliente repart. Mais la cliente n'a aucune trace visuelle de l'avant et de l'apres. La praticienne, elle, manque d'un outil pour objectiver son expertise et la rendre spectaculaire. Mon projet repond a ce double manque : donner a voir, et donner une preuve. J'insiste des maintenant : on parle de cosmetique et de bien-etre, jamais de diagnostic medical." Annoncer le fil : qui je suis, le contexte, la solution, la technique, le bilan.

**Visuel suggere :** Photo avant / apres stylisee de cuir chevelu au microscope (floutee si pas d'image reelle), ou pictogramme split-screen. Encart terracotta discret : "Cosmetique, non medical".

---

### Slide 3 - Qui je suis : mon parcours

**Titre :** Moi, en quelques etapes

**Contenu visible :**
- Frise simple en 3 ou 4 jalons (formation, entree en alternance, projet actuel, objectif).
- Une accroche personnelle d'une ligne.

**Notes orateur :**
"[A COMPLETER PAR ADRIANO : ton parcours precis. Exemple de trame a personnaliser : d'ou tu viens, ce qui t'a amene vers l'IoT et le developpement, comment tu es arrive en alternance chez OHADJA, et ce que represente ce titre RNCP pour la suite. Termine par ta motivation : pourquoi le metier de chef de projet en solutions logicielles IoT te correspond.]" Rester bref, 45 secondes maximum, c'est une mise en relation humaine, pas un CV exhaustif.

**Visuel suggere :** Frise horizontale (timeline lucide "milestone") en or sur fond ivoire, photo portrait sobre du candidat en haut a droite. Une seule frise, pas de paragraphe.

---

### Slide 4 - Qui je suis : mes centres d'interet

**Titre :** Hors du travail

**Contenu visible :**
- 3 a 4 vignettes a icone (hobbies), sans phrases.
- Exemples a personnaliser : reseaux et infrastructure, modelisation 3D, domotique maison.

**Notes orateur :**
"Ce que je fais en dehors du travail nourrit directement ce projet. [A COMPLETER PAR ADRIANO : tes vrais hobbies. Exemples credibles a confirmer : la domotique chez moi m'a familiarise avec les capteurs et le reseau local ; la modelisation 3D m'aide a penser l'integration physique du miroir ; le bricolage reseau m'a appris a debugger du WiFi et du TCP, ce qui a servi pour le microscope.]" Faire le pont explicite entre une passion et une competence mobilisee dans le projet : cela montre la coherence du profil.

**Visuel suggere :** Trois ou quatre cartes icones lucide (par exemple "network", "box" pour 3D, "house-plug" pour domotique). Une icone par hobby, un mot sous chaque icone. Style epure, beaucoup de blanc.

---

### Slide 5 - Qui je suis : ce avec quoi je travaille

**Titre :** Mes outils, vue d'ensemble

**Contenu visible :**
- Grandes briques generalistes avec une icone chacune, AUCUNE librairie listee :
  - Application de bureau
  - Interface utilisateur
  - Base de donnees
  - Vision et IA
  - Reseau et IoT
  - Outillage et qualite

**Notes orateur :**
"Voici ma boite a outils, presentee par grandes familles plutot que par bibliotheques, pour rester lisible. Pour l'application de bureau, je travaille avec Electron sur Linux. Pour l'interface, React et TypeScript. Pour les donnees, PostgreSQL et du SQL maitrise. Pour la vision et l'IA, des proxys Node.js et des modeles de langage multimodaux. Pour le reseau et l'IoT, du TCP, du WiFi local et des Raspberry Pi. Pour la qualite, des tests automatises et de l'integration continue. Je detaillerai les choix techniques dans la partie conception." Le but est de montrer une vision generaliste de chef de projet, pas un catalogue de dependances.

**Visuel suggere :** Grille de 6 tuiles, chacune avec une icone simple-icons (Electron, React, PostgreSQL, un cerveau lucide "brain" pour IA, Raspberry Pi, un bouclier-check pour qualite) et un libelle generaliste. Interdiction de mettre des noms de libs (pas de liste React Router, Zustand, etc., ils restent dans ces notes).

**Note interne (pour les notes orateur, detail non affiche) :** stack reelle device = Electron 33, React 19, TypeScript 5.7, Zustand 5, electron-vite, electron-builder ; backend device = mock Express Node.js ; donnees serveur = PostgreSQL 15 en SQL brut via le driver pg ; proxys microscope en Node.js et Python avec ffmpeg.

---

### Slide 6 - Qui je suis : mon entreprise OHADJA

**Titre :** OHADJA, mon entreprise d'accueil

**Contenu visible :**
- Logo OHADJA, statut (SAS), une ligne d'activite.
- Mon role : developpeur junior full-stack IoT.
- Une phrase sur le positionnement.

**Notes orateur :**
"Je suis en alternance chez OHADJA, une SAS. [A COMPLETER PAR ADRIANO : activite exacte d'OHADJA, taille de l'equipe, types de projets, clients types, et ta place dans l'organisation.] Mon poste : developpeur junior full-stack orient IoT. C'est dans ce cadre qu'OHADJA m'a confie la relation avec le client KBEAUTY et la conduite de ce projet, ce qui m'a place en situation de chef de projet : cadrage du besoin, conception, developpement et pilotage." Faire le lien : OHADJA est le prestataire, KBEAUTY est le client final.

**Visuel suggere :** Slide sobre, logo OHADJA centre, trois pictos (statut, activite, mon role). Fond ivoire, accents or.

---

### Slide 7 - Le client : KBEAUTY-COSMETICS

**Titre :** Le client : un institut K-beauty a Nice

**Contenu visible :**
- Qui : institut de cosmetique coreenne (K-beauty), Nice.
- Soin phare : Bubble Hair Spa.
- Promesse de marque : rituel, soin, experience premium.

**Notes orateur :**
"Le client final est KBEAUTY-COSMETICS, un institut specialise dans la cosmetique coreenne a Nice. Leur soin signature, le Bubble Hair Spa, est un rituel de soin du cuir chevelu. Leur positionnement est premium et experientiel : la cliente vient chercher une experience, pas seulement un service. C'est essentiel pour comprendre pourquoi un miroir connecte a du sens ici : il prolonge l'experience et valorise l'expertise de la praticienne." Rappeler la finalite cosmetique.

**Visuel suggere :** Carte de Nice stylisee ou photo d'ambiance institut, logo client, pictogramme "bubbles" ou goutte. Palette douce.

---

### Slide 8 - Le besoin metier

**Titre :** Le besoin de la praticienne

**Contenu visible :**
- 3 besoins : montrer (avant / apres), objectiver le conseil, fideliser et recommander des produits.
- Une contrainte forte : ne pas ralentir le geste metier.

**Notes orateur :**
"Concretement, la praticienne a besoin de trois choses. Montrer : capturer une image agrandie du cuir chevelu et la projeter sur le miroir pour creer l'effet waouh. Objectiver : appuyer son conseil sur une analyse visuelle reproductible. Fideliser : conserver l'historique des seances et proposer les produits adaptes. Et une contrainte non negociable : l'outil doit s'inserer dans le geste sans le ralentir, sinon il ne sera jamais utilise en cabine." Cette slide justifie tout le reste du projet.

**Visuel suggere :** Trois icones lucide (eye, scan-line, repeat) avec un mot chacune. En bas, un bandeau contrainte "rapide, en cabine, mains parfois mouillees".

---

### Slide 9 - Le marche et les tendances

**Titre :** Un marche porteur : beaute connectee

**Contenu visible :**
- 3 tendances : essor de la K-beauty, beaute connectee et "beauty tech", attente de personnalisation.
- Positionnement : miroir connecte = differenciation en institut.

**Notes orateur :**
"Le marche est favorable. La K-beauty connait une forte croissance en Europe. La beaute connectee, le diagnostic de peau et de cheveux assiste, devient un argument de vente. Et les clientes attendent de la personnalisation. Un institut qui propose une analyse visuelle a un avantage concurrentiel. [A COMPLETER PAR ADRIANO : si tu as des chiffres de marche sources, ajoute-les ici, sinon rester sur des tendances qualitatives pour ne pas avancer de chiffres non verifies.]" Ne pas inventer de statistiques precises devant le jury.

**Visuel suggere :** Trois fleches montantes (lucide "trending-up") avec un libelle par tendance. Fond clair, accents or.

---

### Slide 10 - Analyse PESTEL

**Titre :** PESTEL : le contexte externe

**Contenu visible :**
- Hexagone PESTEL, un mot cle par axe :
  - Politique / Economique / Socioculturel / Technologique / Ecologique / Legal.

**Notes orateur :**
"J'ai cadre l'environnement avec un PESTEL. Politique et legal : le RGPD encadre fortement le traitement d'images de personnes, c'est un point structurant que je detaillerai. Economique : budget institut limite, donc une solution materielle sobre. Socioculturel : forte demande de personnalisation et de preuve visuelle. Technologique : maturite des Raspberry Pi, des microscopes WiFi et des modeles d'IA multimodaux. Ecologique : materiel basse consommation et durable. Le facteur legal est le plus determinant, c'est lui qui oriente mon architecture de securite." Annoncer que le RGPD reviendra.

**Visuel suggere :** Hexagone a six branches, une icone par axe, l'axe Legal mis en avant en terracotta pour preparer la partie RGPD.

---

### Slide 11 - Veille technologique

**Titre :** Ma veille technologique

**Contenu visible :**
- 3 axes de veille : capture image (microscope WiFi), IA vision (modeles multimodaux), souverainete et RGPD.
- Une ligne : "la veille a directement change mes choix".

**Notes orateur :**
"Ma veille a porte sur trois axes qui ont change mes decisions. Premier axe, la capture : j'ai compare microscopes USB et WiFi, et retenu un microscope WiFi qui se comporte comme une source reseau, plus souple a integrer. Deuxieme axe, l'IA vision : j'ai suivi l'evolution des modeles multimodaux capables d'analyser une image, dans le cloud comme en local. Troisieme axe, la souverainete : c'est en veillant que j'ai realise que la chaine cloud par defaut envoie l'image hors d'Europe, ce qui m'a conduit a proposer trois versions de souverainete, un temps fort de cette presentation." La veille n'est pas un exercice scolaire, elle a des consequences concretes.

**Visuel suggere :** Trois colonnes radar / sources, icones lucide (microscope, brain, shield). Mention discrete "fact-check date 2026-06-29" pour la rigueur.

---

### Slide 12 - Analyse SWOT

**Titre :** SWOT du projet

**Contenu visible :**
- Matrice 2x2 : Forces, Faiblesses, Opportunites, Menaces. Deux items courts par case.

**Notes orateur :**
"Le SWOT synthetise. Forces : effet differenciant fort, valorisation de l'expertise, architecture offline-first robuste. Faiblesses : dependance a la qualite de capture, et au depart une chaine IA non souveraine. Opportunites : marche de la beaute connectee en croissance, extension a d'autres soins. Menaces : le RGPD si le cadrage cosmetique derape vers le medical, et la dependance internet pour l'IA cloud. Mes faiblesses et menaces ne sont pas masquees : elles structurent ma roadmap." Le SWOT vient apres le PESTEL et la veille, c'est l'ordre logique : contexte externe puis synthese.

**Visuel suggere :** Matrice 2x2 coloree (forces et opportunites en sauge, faiblesses et menaces en terracotta), deux puces par quadrant maximum.

---

### Slide 13 - Transition vers la solution

**Titre :** Du probleme a la solution

**Contenu visible :**
- Une phrase de bascule : "Un besoin clair, un cadre legal exigeant : voici le cahier des charges".

**Notes orateur :**
"On a vu le besoin, le marche, le contexte legal et la synthese SWOT. Je passe maintenant a la traduction en exigences : le cahier des charges fonctionnel." Slide de respiration, 15 secondes. Changement de rythme, on entre dans la partie projet.

**Visuel suggere :** Slide de section pleine, fond aubergine, gros titre or, pictogramme "clipboard-list". Sert de marqueur visuel de changement de bloc.

---

### Slide 14 - CDCF : expression du besoin

**Titre :** Cahier des charges : le besoin

**Contenu visible :**
- Fonctions principales (bete a cornes ou liste) :
  - Capturer et afficher l'image agrandie.
  - Analyser (assistance) et restituer un conseil.
  - Tracer la seance et l'historique cliente.
  - Recommander des produits.

**Notes orateur :**
"J'ai formalise le besoin en fonctions de service. La fonction principale : permettre a la praticienne de capturer et d'afficher en direct une image agrandie du cuir chevelu. Les fonctions de soutien : fournir une analyse d'assistance, conserver l'historique des seances par cliente, et recommander des produits adaptes. Chaque fonction repond a un des trois besoins vus plus tot : montrer, objectiver, fideliser." Rester sur la valeur, pas encore sur la technique.

**Visuel suggere :** Schema bete a cornes simplifie ou liste a 4 fonctions avec icones. Lier visuellement chaque fonction au besoin correspondant (code couleur).

---

### Slide 15 - CDCF : les contraintes

**Titre :** Les contraintes a respecter

**Contenu visible :**
- 4 a 5 contraintes :
  - RGPD : consentement obligatoire, image de personne.
  - Cosmetique non medical (cadrage strict).
  - Offline-first (cabine, reseau instable).
  - Rapidite en cabine, usage tactile.
  - Budget materiel maitrise.

**Notes orateur :**
"Les contraintes encadrent la solution. Le RGPD d'abord : une image de cuir chevelu est une donnee personnelle, son traitement exige le consentement. Le cadrage cosmetique non medical, pour ne pas basculer dans la donnee de sante au sens de l'article 9. L'offline-first, car le reseau d'un institut n'est pas fiable et le soin ne doit jamais s'arreter. La rapidite et le tactile, pour l'usage en cabine. Et un budget materiel maitrise, autour d'un Raspberry Pi. Ces contraintes expliquent directement mes choix d'architecture." Insister sur RGPD et offline, ce sont les deux qui paient le plus en conception.

**Visuel suggere :** Cinq pastilles contraintes avec icones (shield, stethoscope barre, wifi-off, hand/touch, wallet). La contrainte RGPD en terracotta.

---

### Slide 16 - CDCF : la solution proposee

**Titre :** La solution : un miroir-device autonome

**Contenu visible :**
- Schema en 3 blocs : Miroir (device) / CRM serveur / Microscope WiFi.
- 3 mots : Autonome, Securise, Connecte au CRM.

**Notes orateur :**
"Ma reponse : un miroir-device autonome construit autour d'un Raspberry Pi sous Linux, avec une application de bureau Electron en mode kiosque. Le microscope WiFi fournit l'image. Le device fonctionne en offline-first : il enregistre localement et chiffre, puis synchronise avec un CRM serveur des que le reseau revient. L'analyse d'assistance vient en complement. C'est cette architecture que je vais detailler dans la partie conception." Annoncer la suite, ne pas tout deballer ici.

**Visuel suggere :** Schema d'architecture haut niveau a trois blocs relies, icones Raspberry Pi, microscope (WiFi), serveur/cloud. Fleche de synchronisation differee entre device et CRM.

---

### Slide 17 - Devis et chiffrage

**Titre :** Le devis

**Contenu visible :**
- Tableau synthetique : postes (materiel, developpement, integration, maintenance) sans montants detailles a l'ecran si confidentiel.
- Logique de chiffrage (jours-homme, materiel unitaire).

**Notes orateur :**
"Le chiffrage distingue le materiel et le logiciel. Materiel : Raspberry Pi, microscope WiFi, dalle et structure miroir, pour un cout unitaire maitrise. Logiciel : la conception et le developpement, valorises en jours-homme. S'ajoutent l'integration sur site et un volet maintenance et mises a jour. [A COMPLETER PAR ADRIANO : montants reels du devis, taux journalier OHADJA, et marge. Si le devis est confidentiel, garde les postes a l'ecran et donne les montants a l'oral seulement.]" Montrer que tu sais relier valeur, effort et prix : c'est une competence de chef de projet.

**Visuel suggere :** Tableau a 4 lignes (postes) et colonnes (quantite, unite, total) avec totaux en or. Picto "receipt". Si confidentiel, remplacer les montants par des barres relatives.

---

### Slide 18 - Gestion de projet : methode

**Titre :** Ma methode : Merise Agile et TDD

**Contenu visible :**
- 3 piliers : Merise Agile (donnees d'abord), iterations / sprints, tests a tous les niveaux.
- Une ligne : "concevoir les donnees tot, livrer par increments".

**Notes orateur :**
"J'ai pilote en Merise Agile. Concretement : je modelise les donnees tot, le modele conceptuel, puis je l'enrichis sprint apres sprint. Je decoupe en increments avec un MVP clair. Et je teste a tous les niveaux, en privilegiant les tests unitaires puis l'integration puis le bout en bout. Cette discipline explique le niveau de couverture que je montrerai. C'est aussi ma facon de challenger chaque exigence avant de la coder, pour ne pas construire l'inutile." Relier methode et resultats mesurables.

**Visuel suggere :** Trois colonnes piliers avec icones (database, repeat/iteration, check-circle). Petite frise MCD squelettique vers MCD enrichi.

---

### Slide 19 - Gestion de projet : pilotage

**Titre :** Pilotage et avancement

**Contenu visible :**
- Mini planning par sprints ou jalons (Sprint 0 a Sprint N).
- Distinction visuelle : realise (MVP) vs roadmap.

**Notes orateur :**
"Voici le deroule. Sprint 0 : cadrage, modele de donnees squelettique, mise en place de l'integration continue. Sprints suivants : pipeline microscope, application miroir, securite et chiffrement, synchronisation CRM, tests. [A COMPLETER PAR ADRIANO : tes dates reelles, la duree de l'alternance, les outils de suivi utilises, par exemple un board kanban.] Je distingue clairement ce qui est realise dans le MVP de ce qui reste en roadmap : je serai transparent la-dessus en fin de presentation." Annoncer l'honnetete MVP vs roadmap.

**Visuel suggere :** Diagramme de Gantt simplifie ou frise a jalons, code couleur sauge (realise) et gris (roadmap). Picto "kanban".

---

### Slide 20 - Architecture technique (vue d'ensemble)

**Titre :** Architecture d'ensemble

**Contenu visible :**
- Schema 4 blocs : Microscope WiFi -> Device (Electron Linux) -> CRM serveur (PostgreSQL) -> Service IA serveur.
- 3 proprietes : offline-first, chiffrement au repos, synchronisation differee.

**Notes orateur :**
"Vue d'ensemble. A gauche, le microscope WiFi. Au centre, le device : un Raspberry Pi sous Linux qui fait tourner une application Electron en kiosque, avec une interface React. Important pour la rigueur : sur le device, le backend est un mock Express en Node.js qui simule l'API, pas un Laravel embarque. Le vrai Laravel existe, mais c'est le CRM serveur, separe du device. Cote serveur, une base PostgreSQL 15 en SQL maitrise, sans ORM, et un service IA. Le device est offline-first : il chiffre et stocke localement, puis synchronise. Je detaille chaque element." Cette honnetete sur le mock vs le vrai backend est notee dans la source de verite, ne pas la cacher.

**Visuel suggere :** Schema d'architecture propre, 4 zones, icones simple-icons (Raspberry Pi, Linux, Electron, React, PostgreSQL, Docker). Annoter "device" et "serveur" pour separer clairement les deux mondes.

**Note interne :** ports reels (a citer si le jury creuse) : mock API 8100, proxy IA mock 3001, service IA reel serveur 3002, PostgreSQL 5432, Adminer 8080. Build = Linux deb et AppImage, arm64 et x64, aucune cible Windows ni macOS.

---

### Slide 21 - Justification des choix techniques

**Titre :** Pourquoi ces choix : les benchmarks

**Contenu visible :**
- Electron retenu vs Tauri : surcout RAM reel de 10 a 20 pour cent, pas un facteur 2.
- Video MJPEG : le Pi 5 n'a plus de decodage H.264 materiel, simplicite gagnante.
- PostgreSQL serveur vs SQLite : bascule autour de 16 connexions concurrentes.
- React 19 + Zustand : l'ecart entre frameworks s'efface sous Chromium/Electron.
- Methode : chiffre publie = ordre de grandeur x86, a mesurer sur le Pi 5 reel.

**Notes orateur :**
"Tous mes choix techniques sont justifies par des benchmarks, sous un protocole de fact-check : preuve demonstrable, quantifiable, reproductible. Premier point, le runtime : on lit partout qu'Electron consomme deux fois la RAM de Tauri. C'est faux sur Linux. Mesure correctement en PSS, source officielle Tauri issue 5889, l'ecart est de 10 a 20 pour cent, 207 contre 185 megaoctets, et Tauri peut meme consommer plus en USS. Le facteur cinq est un artefact de mesure RSS naif sur macOS ou Windows. Le vrai risque de Tauri sur Pi, c'est son moteur WebKitGTK qui rame sur la video et le GPU, alors que Chromium embarque par Electron est mur : decisif pour un produit video-centric. Deuxieme point, la video : le Pi 5, le BCM2712, n'a plus de decodage H.264 materiel, donc aucune des trois options video n'a d'avantage hardware, et MJPEG gagne par simplicite. Troisieme point, la base de donnees : SQLite plafonne a un seul writer, c'est ecrit dans la doc officielle SQLite ; en mono-connexion il est trois a huit fois plus rapide que PostgreSQL, mais des qu'on atteint huit a seize ecritures concurrentes, PostgreSQL passe devant, environ 35000 contre 23000 operations par seconde. Ce croisement, c'est exactement la frontiere entre mon device mono-process et mon serveur multi-clients : SQLite cote device, PostgreSQL cote serveur. Quatrieme point, le frontend : l'avantage de Svelte ou Solid, un geomean de rendu autour de 1,05 contre 1,5 pour React, et un bundle de 8 contre 45 kilooctets, s'evapore dans Electron parce qu'un process Chromium consomme deja 150 a 300 megaoctets et que les assets sont charges depuis le disque local. Zustand pese 0,49 kilooctet contre 17 pour Redux Toolkit, avec des selecteurs anti-re-render. Et l'avertissement que j'assume devant le jury : aucun benchmark public ne mesure ces technologies sur Pi 5, tous les chiffres sont issus de machines x86. Ils donnent des ordres de grandeur, pas la verite Pi. J'ai donc prepare des protocoles reproductibles pour mesurer la RAM PSS reelle, la latence video, le throughput PostgreSQL et les FPS sur le Pi 5 cible avant la soutenance." Le but n'est pas d'aligner des chiffres mais de montrer une methode : distinguer mythe et mesure, et savoir quel chiffre est defendable.

**Note interne (detail oral si question) :** Electron 33 binaires arm64 officiels, stack equipe deja en place ; Tauri = cross-compilation aarch64 requise + reecriture Rust. SQLite : doc sqlite.org/whentouse.html (L1) ; benchmark andrecasal (L2, M2 Pro, pas un Pi) : 1 connexion inserts SQLite 23403 vs PostgreSQL 7740 ops/s, mixte 80/20 SQLite 96051 vs 11824, mais 16 connexions PostgreSQL ~35000 vs SQLite ~23000. Cote device : JSON chiffre + electron-store retenu pour le chiffrement at-rest et la simplicite, PAS pour la performance ; SQLite aurait ete techniquement valide, ne pas pretendre qu'il serait trop lent. Framework backend : Express MVP (coherence de stack, ~6000 a 10000 req/s) vs Laravel cible (ecosysteme, perf neutralisee par Octane). Le seul chiffre defendable sans mesure est la taille binaire Electron vs Tauri (consequence d'architecture). Sources et protocoles complets : docs/BENCHMARKS-TECHNO-IA.md, section 4.

**Visuel suggere :** Tableau de synthese a 4 lignes (Choix retenu / Alternative ecartee / Raison chiffree) en or sur prune, une ligne par couche : runtime, video, base de donnees, frontend. Picto lucide "cpu" et "bar-chart-3". Encart terracotta discret "chiffres x86, a mesurer sur Pi 5" pour marquer l'honnetete methodologique.

---

### Slide 22 - Modele de donnees

**Titre :** Le modele de donnees

**Contenu visible :**
- MCD simplifie : 8 entites (BOUTIQUE, CLIENTE, CONSENTEMENT, MIROIR, SEANCE, PHOTO, PRODUIT, MEDIA).
- Note honnete : 9 tables en base, l'ecart = `config_miroir` (table technique).

**Notes orateur :**
"Le modele conceptuel compte 8 entites : boutique, cliente, consentement, miroir, seance, photo, produit, media. En base PostgreSQL, il y a 9 tables : la neuvieme, config_miroir, est une table technique de configuration de l'interface du miroir, que je n'ai pas remontee au niveau conceptuel car elle n'est pas metier. Je prefere vous le dire plutot que de masquer l'ecart. L'entite centrale est la seance, qui relie une cliente, un consentement et des photos." Montrer qu'on maitrise la difference entre modele conceptuel et schema physique.

**Visuel suggere :** MCD Mermaid epure (entites et cardinalites principales), avec config_miroir en pointilles ou en encart "table technique hors MCD". Mettre SEANCE au centre.

---

### Slide 23 - UML et parcours

**Titre :** Du cas d'usage au parcours

**Contenu visible :**
- Cas d'usage principal : "Realiser une seance d'analyse".
- Mini diagramme de sequence : Praticienne -> Miroir -> Microscope -> (Analyse) -> CRM.

**Notes orateur :**
"En UML, le cas d'usage central est realiser une seance. Le parcours : la praticienne identifie la cliente, recueille le consentement, lance le live du microscope, capture une image, declenche l'analyse d'assistance, puis la seance est enregistree et synchronisee avec le CRM. Le consentement est un verrou : sans lui, la seance ne peut pas etre creee, je le montre juste apres dans la partie securite." Lier le diagramme au verrou RGPD a venir.

**Visuel suggere :** Diagramme de sequence Mermaid simple, 4 a 5 acteurs/composants, fleche "consentement requis" mise en evidence. Garder peu de messages pour la lisibilite.

---

### Slide 24 - Pipeline microscope (temps fort technique)

**Titre :** Le pipeline video du microscope

**Contenu visible :**
- Chaine : Microscope WiFi (192.168.34.1:8080) -> handshake JHCMD -> H.264 (TCP) -> ffmpeg -> MJPEG -> balise image (port 9100).
- Verdict benchmark : le Pi 5 n'a plus de decodage H.264 materiel, aucune alternative n'a d'avantage hardware.
- Une ligne : "live preview dans une simple balise image, pas de lecteur video complexe".

**Notes orateur :**
"Voici un point technique dont je suis fier. Le microscope n'est pas en USB mais en WiFi : il expose un flux sur le reseau local, a l'adresse 192.168.34.1 port 8080. La connexion commence par un handshake proprietaire, la commande JHCMD. La source est du H.264, que je transcode a la volee avec ffmpeg en MJPEG. Le live s'affiche alors dans une simple balise image qui lit un flux MJPEG sur le port 9100, sans lecteur video complexe. Les captures sont des images JPEG. C'est robuste et simple, dans l'esprit du rasoir d'Ockham. Note d'honnetete : il reste des traces de code USB et V4L2 dans le depot, mais ce sont des vestiges non utilises par le pipeline reel." Citer le handshake et ffmpeg montre la maitrise reelle.

**Notes orateur - chiffres cles benchmark (si le jury creuse le choix MJPEG vs MSE/H.264 vs WebRTC) :** "Le fait fondateur, confirme par les ingenieurs du forum officiel Raspberry Pi (CLAIM L2), est que le Pi 5, le BCM2712, n'a plus de decodeur H.264 materiel, contrairement au Pi 4 ; seul le HEVC 4K60 reste materiel. Or le microscope emet du H.264 : les trois options, MJPEG, MSE/H.264 et WebRTC, doivent donc decoder en logiciel sur les coeurs Cortex-A76. L'argument du decodage materiel ne departage rien. A partir de la, MJPEG gagne par simplicite : une balise image, zero player, zero signaling, alors que WebRTC impose signaling, SDP et ICE pour une latence reseau publiee de 200 a 500 ms qui ne se transpose meme pas a notre cas loopback. MJPEG isole en plus le decodage lourd dans le process ffmpeg, hors du rendu Electron. Le seul defaut de MJPEG, la forte bande passante, est neutralise en loopback ou LAN. Honnetete : aucun benchmark public ne mesure ce pipeline exact sur Pi 5 ; la latence reelle reste a mesurer sur le Pi cible (protocole glass-to-glass, 240 fps, mediane sur 10 mesures). A reconsiderer seulement, via MSE en remux -c copy, si la mesure montre ffmpeg saturant un coeur."

**Visuel suggere :** Schema pipeline horizontal avec etapes en boites : icone microscope WiFi, puis "JHCMD handshake", puis "H.264", puis logo ffmpeg, puis "MJPEG", puis icone image. Fleches orientees. Encart gris "vestiges USB/V4L2 non utilises".

---

### Slide 25 - Securite et RGPD

**Titre :** Securite et RGPD by design

**Contenu visible :**
- Chiffrement au repos : AES-256-GCM (photos, file de synchronisation, secrets).
- Consentement : verrou a deux niveaux (cle etrangere obligatoire en base + refus serveur HTTP 422).
- Durcissement Electron : sandbox, isolation, CSP en production.

**Notes orateur :**
"La securite est integree des la conception. Au repos, tout est chiffre en AES-256-GCM, un chiffrement authentifie : les photos de cuir chevelu, la file de synchronisation et les secrets de configuration. En production, sans cle maitre, l'application refuse de demarrer plutot que de fonctionner en clair. Le consentement RGPD est verrouille a deux niveaux : en base, la seance exige obligatoirement une reference vers un consentement valide ; au niveau applicatif, le serveur refuse la creation avec un code HTTP 422 si le consentement est absent ou revoque. Enfin, l'application Electron est durcie : bac a sable, isolation des contextes, et politique de securite du contenu en production." Insister : le code 422, pas 403, c'est un detail qui montre que tu connais ton code.

**Visuel suggere :** Trois cartes : un cadenas (AES-256-GCM), un panneau "422" avec icone shield (consentement), un casque Electron durci. Bandeau "Cosmetique, non medical : on reste hors article 9 RGPD".

---

### Slide 26 - Tests et qualite

**Titre :** Tests et integration continue

**Contenu visible :**
- Chiffre cle : 196 tests (60 unitaires + 136 bout-en-bout).
- 5 services couverts en unitaire.
- CI : etapes bloquantes vs non bloquantes (honnete).

**Notes orateur :**
"Cote qualite, 196 tests automatises : 60 tests unitaires sur cinq services critiques, dont la synchronisation CRM avec 18 cas, et 136 tests bout-en-bout avec Playwright. Sur l'integration continue, je suis precis et honnete : ce qui bloque reellement la chaine, c'est l'audit de securite des dependances critiques en production et la detection de secrets avec gitleaks. D'autres etapes, comme l'audit des vulnerabilites de niveau eleve, la generation de SBOM et l'analyse statique Semgrep, sont presentes mais en mode non bloquant. Je ne les presente donc pas comme des garde-fous absolus." Cette nuance evite un piege classique du jury.

**Visuel suggere :** Gros chiffre "196" en or, sous-decompose 60 + 136. A droite, deux colonnes "Bloquant" (audit critique prod, gitleaks) en sauge et "Non bloquant" (audit high, SBOM, Semgrep) en gris. Picto git-branch.

---

### Slide 27 - Souverainete IA : le probleme

**Titre :** Souverainete : ou part la photo ?

**Contenu visible :**
- Constat honnete : dans le chemin par defaut de l'app, l'IA est mockee (pas d'appel reel).
- Mais le service IA serveur reel envoie la photo (JPEG complet) vers un cloud US (GitHub Models, Azure).
- 3 enjeux : transfert hors UE, dependance internet, non souverain.

**Notes orateur :**
"Soyons transparents sur l'IA, c'est crucial pour un jury. Dans l'application miroir, le chemin par defaut est un mock : les scores sont simules, l'image n'est pas reellement analysee. C'est un choix de developpement assume pour le MVP. En revanche, il existe un vrai service d'IA cote serveur qui, lui, envoie la photo complete en base64 vers GitHub Models, heberge sur Azure aux Etats-Unis, en vision multimodale. Donc dans cette configuration, la photo quitte bien le device et part hors d'Europe. Pretendre la souverainete dans cet etat serait faux. C'est ce constat qui m'a amene a concevoir trois versions de souverainete." Distinguer mock device et appel reel serveur, exactement comme dans la source de verite.

**Visuel suggere :** Schema avec une fleche rouge "photo -> cloud US" traversant une frontiere UE barree. Encart terracotta "la photo quitte le device". Mention "GitHub Models / Azure US, pas OpenRouter".

---

### Slide 28 - Souverainete IA : 3 versions

**Titre :** Ma reponse : 3 niveaux de souverainete

**Contenu visible :**
- Carte a 3 colonnes :
  - V1 actuelle : cloud non souverain (GitHub Models, Azure US). Souverainete faible.
  - V2 : cloud souverain Mistral AI (UE, hebergement UE, Zero Data Retention). Souverainete elevee.
  - V3 : NPU local sur Raspberry Pi (Hailo), 100 pour cent offline. Souverainete maximale.

**Notes orateur :**
"Ma proposition est une strategie a trois niveaux, choisie selon le besoin du client. Version 1, l'existant : cloud non souverain, qualite elevee mais l'image part hors UE et il faut internet. Version 2, le cloud souverain : passer a Mistral AI, entreprise francaise, hebergement UE par defaut, avec retention zero des donnees contractualisee. La souverainete devient elevee, l'image reste en UE, mais elle quitte quand meme le miroir : souverainete n'est pas confidentialite totale. Version 3, le 100 pour cent local : un accelerateur NPU sur le Raspberry Pi. Et la, je suis precis et honnete sur la faisabilite : aujourd'hui le realiste en local, c'est de la classification d'images dediee sur un Hailo-8, pas un grand modele generatif. Le diagnostic en langage naturel totalement local ne devient envisageable qu'avec le tout recent Hailo-10H de janvier 2026, ou un petit modele sur CPU avec une latence degradee. Rien ne sort du miroir : souverainete maximale. Je positionne ces trois versions comme un curseur cout / souverainete / qualite que le client arbitre." C'est le temps fort : montrer maturite, nuance et honnetete technique.

**Visuel suggere :** Carte comparative a 3 colonnes (V1 / V2 / V3) avec une jauge de souverainete croissante (faible -> elevee -> maximale) et des icones (cloud US, drapeau UE / Mistral, puce NPU). Ligne "internet requis : oui / oui / non". Garder 3 lignes maximum par colonne sur la slide, le detail tarifaire et materiel reste dans ces notes.

**Note interne (detail oral si question) :** V2 Mistral, modeles vision actuels Medium 3.5 / Large 3 / Ministral 3 (Pixtral deprecie debut 2026), cout de l'ordre de fractions de centime a un centime par analyse, souverainete conditionnee a endpoint UE + ZDR + DPA. V3 materiel : AI HAT+ autour de 70 a 150 EUR selon la puce ; Hailo-8/8L = vision classique uniquement (limite SRAM, pas de grand modele) ; Hailo-10H (AI HAT+ 2, 15 jan 2026, 8 Go LPDDR4) = petits modeles generatifs locaux ; voie A recommandee = classification CNN dediee, texte genere par regles cote app.

**Note interne - chiffres cles benchmark IA (si le jury creuse GitHub Models vs Mistral, et Hailo vs VLM) :**
- Qualite vision cloud (CLAIM L2) : gpt-4o-mini est le seul a publier un MMMU chiffre, 59,4 ; Mistral ne publie AUCUN score MMMU/DocVQA pour ses modeles courants (les seuls chiffres vision solides concernaient Pixtral Large, deprecie). Donc "gpt-4o-mini meilleure qualite prouvee" tient sur la preuve publiee, pas sur une demonstration capillaire. Limite honnete : aucun de ces benchmarks ne mesure l'analyse du cuir chevelu, la correlation reste une HYPOTHESIS a valider (30 a 50 photos annotees, accord praticienne via Cohen's kappa >= 0,6).
- Cout par analyse (hypothese 1500 tokens entree + 300 sortie, taux 1 USD ~ 0,92 EUR) : gpt-4o-mini ~0,0004 EUR (mais facturation image a facteur eleve, cout reel 2 a 10x possible, a mesurer) ; Mistral Large 3 ~0,0011 EUR ; Ministral 3 ~0,00017 EUR ; Medium 3.5 ~0,0041 EUR, soit ~10x Large 3 sans benefice vision prouve, a eviter.
- Souverainete (CLAIM L2) : GitHub Models = tenant Azure US par defaut, retention ~28 jours, Cloud Act applicable. Mistral = routage UE par defaut, retention 30 jours glissants, GDPR natif, ZDR disponible (plan Scale). Sur des photos de cuir chevelu de clientes, l'argument GDPR penche nettement vers Mistral.
- IA edge 100 pour cent locale (CLAIM L2) : Hailo-8 classification ResNet-50 = 1371 FPS hardware pur, 3,38 ms de latence, 3,96 a 4,06 W, AI HAT+ ~70 USD ; en pipeline reel (capture + pre/post-traitement CPU) on tombe a 40 a 45 FPS, ce qui reste tres au-dessus du besoin capillaire. Piege a desamorcer : ecart de 10 a 25x entre le FPS "hw_only" marketing et le FPS pipeline, car le Pi 5 bride le PCIe en Gen3 x1 alors que le Model Zoo Hailo mesure en Gen3 x2. Seul le FPS pipeline compte.
- Generatif local : un VLM sur CPU Pi 5 (moondream2 1,9B) tourne a ~5 a 10 tok/s avec un TTFT de plusieurs secondes, acceptable pour un MVP, pas pour du temps reel. Le Hailo-8 ne fait PAS de VLM generatif (architecture vision, pas de KV-cache transformer). Le Hailo-10H (~130 USD, emergent janvier 2026) gagne surtout sur le TTFT (320 ms vs ~2039 ms, 6,4x) et la conso (~30 pour cent de moins), pas sur le debit brut ou le CPU du Pi 5 est souvent plus rapide (ex. Qwen2.5 1.5B : 6,74 vs 11,73 tok/s en faveur du CPU). D'ou le verdict V3 : classification CNN sur Hailo-8 pour l'offline temps reel, le generatif reste pertinent cote serveur.

---

### Slide 29 - Demo et resultats

**Titre :** Demonstration : le MVP en action

**Contenu visible :**
- 3 captures ou points : live microscope sur le miroir, creation de seance avec consentement, historique cliente.
- Une ligne : "l'IA est un waouh au service de l'expertise, pas un diagnostic".

**Notes orateur :**
"Voici le MVP realise. [Lancer la demo ou derouler les captures.] D'abord le live du microscope projete sur le miroir, l'effet waouh immediat. Ensuite la creation d'une seance : sans consentement, le systeme bloque, c'est le verrou RGPD en action. Puis l'historique de la cliente, qui permet de comparer dans le temps. Je rappelle le positionnement : l'analyse est une assistance qui valorise le geste de la praticienne, jamais un diagnostic medical. C'est la praticienne qui conseille, l'outil l'appuie." Prevoir un plan B en captures ou video si la demo live echoue.

**Visuel suggere :** Trois captures d'ecran reelles de l'application (live, seance, historique) en mockup de miroir. Si demo live, garder une slide de secours avec les memes captures. Bandeau sauge "MVP realise".

---

### Slide 30 - Bilan : MVP realise vs roadmap

**Titre :** Bilan honnete : fait et a venir

**Contenu visible :**
- Deux colonnes :
  - Realise (MVP) : pipeline microscope, application miroir kiosque, chiffrement AES-256-GCM, verrou consentement, synchronisation offline-first, 196 tests.
  - Roadmap : IA reelle souveraine (V2 Mistral), version locale (V3 NPU), CRM Laravel complet, durcissement CI.

**Notes orateur :**
"Le bilan, en toute transparence. Ce qui est realise : le pipeline video du microscope, l'application miroir en kiosque, le chiffrement au repos, le verrou de consentement, la synchronisation offline-first et une base de 196 tests. Ce qui reste en roadmap : brancher une IA reelle et souveraine, idealement Mistral en version 2 puis le local en version 3 ; completer le CRM Laravel ; et rendre bloquantes les etapes de securite aujourd'hui en mode avertissement. Je prefere un MVP solide et honnete qu'une demo qui survend. Cette lucidite fait partie du metier de chef de projet." La distinction realise / roadmap est explicitement demandee, elle credibilise tout le reste.

**Visuel suggere :** Deux colonnes, "Realise" en sauge avec coches, "Roadmap" en gris avec fleches. Equilibrer visuellement pour ne pas donner l'impression d'inacheve.

---

### Slide 31 - Perspectives et competences

**Titre :** Perspectives et ce que j'en retire

**Contenu visible :**
- 3 perspectives produit (souverainete locale, extension multi-soins, multi-instituts via CRM).
- 3 competences de chef de projet IoT acquises (cadrage RGPD, conduite technique transverse, qualite et tests).

**Notes orateur :**
"Les perspectives produit : aller vers la souverainete locale, etendre a d'autres soins, et industrialiser en multi-instituts grace au CRM. Sur le plan personnel, ce projet m'a fait grandir comme chef de projet en solutions logicielles pour l'IoT : cadrer un besoin sous forte contrainte RGPD, piloter une chaine technique de bout en bout du capteur au cloud, et imposer une exigence de qualite et de tests. [A COMPLETER PAR ADRIANO : ton objectif professionnel apres le titre.]" Conclure sur la montee en competence, c'est ce que le jury evalue.

**Visuel suggere :** Deux blocs, "Produit" et "Moi", trois pictos chacun. Fin sur une note positive, palette or et prune.

---

### Slide 32 - Remerciements et questions

**Titre :** Merci de votre attention

**Contenu visible :**
- "Merci" en grand, prune et or.
- Nom, contact, mention OHADJA et ACADENICE.
- "Vos questions ?"

**Notes orateur :**
"Merci de votre attention. Je remercie OHADJA pour la confiance, l'equipe ACADENICE pour l'accompagnement, et le client KBEAUTY. Je suis a votre disposition pour vos questions." Avoir en tete les questions pieges deja preparees : la photo quitte-t-elle le device, le NPU fait-il vraiment tourner de l'IA generative locale, est-ce de la donnee de sante. Repondre avec les nuances honnetes deja documentees.

**Visuel suggere :** Slide de cloture sobre, fond aubergine, "Merci" centre en or, pictogramme "heart-handshake". Garder en slides annexes (backup, apres celle-ci) : tableau comparatif souverainete detaille, schema RGPD, decompte des tests, et le tableau materiel Hailo, pour repondre aux questions sans surcharger la presentation principale.

---

## 4. Slides annexes recommandees (backup, apres slide 32)

A preparer mais a ne pas presenter, uniquement pour repondre aux questions du jury :

- A1 : Tableau detaille des 3 versions de souverainete (criteres complets, couts, RGPD).
- A2 : Detail materiel NPU (AI HAT+ 13/26, AI HAT+ 2 Hailo-10H), limites SRAM, voie A vs voie B.
- A3 : Detail du verrou consentement (schema base + sequence HTTP 422 absent / revoque).
- A4 : Decompte exact des tests par service (api-client 14, config 14, crm-sync 18, crypto-vault 7, sync 7 ; e2e 14 + 65 + 42 + 15).
- A5 : Detail des etapes CI bloquantes et non bloquantes.
- A6 : Schema complet des ports et services (device 8100 / 3001, serveur 3002, PostgreSQL 5432).

---

## 5. Rappels de coherence factuelle (a ne jamais contredire en oral)

1. Backend device = mock Express Node.js, pas Laravel. Le vrai Laravel est le CRM serveur separe.
2. Base serveur = PostgreSQL 15 en SQL brut via le driver pg, aucun ORM. Aucun SQLite cote device.
3. 196 tests = 60 unitaires (5 services) + 136 bout-en-bout Playwright.
4. 9 tables en base vs 8 entites au MCD, ecart = config_miroir (table technique).
5. Consentement RGPD = verrou a deux niveaux (cle etrangere obligatoire + refus serveur HTTP 422).
6. Chemin IA par defaut = mock (scores simules). Service IA reel cote serveur = envoie la photo a GitHub Models (Azure US), pas OpenRouter.
7. Video = H.264 TCP transcode par ffmpeg en MJPEG, affiche dans une balise image (port 9100), pas de MediaSource.
8. Microscope = WiFi/TCP 192.168.34.1:8080, handshake JHCMD. USB/V4L2 = vestiges morts.
9. Chiffrement au repos = AES-256-GCM (CryptoVault), refus de demarrer en prod sans cle maitre.
10. CI : bloquants = audit critique prod + gitleaks ; non bloquants = audit high, SBOM CycloneDX, Semgrep.
11. Build = Linux deb et AppImage, arm64 et x64. Aucune cible Windows ni macOS.
12. Finalite cosmetique NON medicale, rappelee a chaque mention de l'analyse, pour rester hors article 9 RGPD.
