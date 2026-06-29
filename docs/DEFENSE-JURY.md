# DreamTech Smart Mirror -- Preparation Soutenance Jury

Document de preparation aux questions du jury. Chaque reponse est directe, argumentee techniquement, et formulee en 2 a 4 phrases. La distinction entre ce qui est REALISE (MVP) et ce qui est CIBLE roadmap est explicite partout.

---

## 1. Choix d'Architecture

### Pourquoi Electron et pas une webapp ?

Le miroir s'appuie sur un microscope capillaire en WiFi/TCP (192.168.34.1:8080, protocole proprietaire JHCMD), dont le flux H.264 est transcode par ffmpeg en MJPEG sur localhost:9100 (proxy.js). Le pipeline a besoin de spawner ffmpeg et d'ouvrir un socket TCP local vers le microscope, ce qu'un navigateur web standard ne permet pas. Electron offre egalement le mode kiosque natif (plein ecran sans barre d'adresse), le stockage chiffre des tokens au repos via un coffre applicatif AES-256-GCM (cryptoVault, independant du trousseau OS, donc fiable sur Pi headless) et le fonctionnement offline-first avec persistance locale. Une webapp necessiterait un navigateur ouvert, une connexion permanente, et n'aurait acces ni a ffmpeg ni au socket TCP local du microscope.

### Pourquoi React et pas Vue ou Angular ?

React 19 offre l'ecosysteme le plus mature pour Electron via electron-vite, avec un hot-reload fiable et une compatibilite native. Zustand (state management choisi) est concu specifiquement pour React. L'equipe avait deja une experience React, ce qui a reduit le temps de montee en competence sur un projet au calendrier serre.

### Pourquoi Zustand et pas Redux ?

Le flux de l'application est lineaire (ecran par ecran, une seule seance active a la fois). Redux impose un boilerplate considerable (actions, reducers, middleware) injustifie pour un state aussi simple. Zustand offre un store minimaliste, sans boilerplate, avec une API directe qui correspond exactement au pattern single-session du miroir.

### Pourquoi TypeScript ?

Le projet comprend plusieurs composants (Electron, mock-API, proxy microscope, service IA) qui partagent des interfaces de donnees (clients, seances, diagnostics). TypeScript garantit la coherence des types aux frontieres entre composants et detecte les erreurs de contrat a la compilation, pas en production. Sur un projet multi-brique, le type safety n'est pas optionnel.

### Pourquoi un mock Express comme backend du device, et Laravel uniquement cote CRM ?

Le backend REALISE du device est un mock Express/Node.js (smart-mirror/mock-api/src/server.js) : deux applications Express, l'API metier sur le port 8100 et un proxy IA sur le port 3001, adossees a PostgreSQL 15-alpine en SQL brut via le client pg (aucun ORM). Il n'y a ni composer.json ni artisan sur le device. Le vrai Laravel 13 existe bien, mais c'est le CRM separe (crm/backend), source de verite partagee entre les boutiques, pas un backend embarque sur le miroir. Le mock Express a servi a figer le contrat d'API tot ; faire porter le device par un mock leger, et le CRM central par Laravel, evite d'embarquer un runtime PHP complet sur un Raspberry Pi tout en gardant un backend riche cote serveur.

### Pourquoi Laravel pour le CRM central ? [CRM separe, partiellement realise]

Laravel apporte nativement ce dont un CRM multi-tenant a besoin : Eloquent (ORM avec relations et migrations versionnees), Sanctum (tokens revocables par device), generation PDF cote serveur, et un systeme de queues. Le CRM (crm/backend) est un projet Laravel 13 distinct du device. La consolidation du contrat entre le mock device et le CRM se fera endpoint par endpoint (strangler-fig), sans big-bang, puisque le contrat d'API est deja fige par le mock.

### Pourquoi PostgreSQL et pas MySQL ?

PostgreSQL supporte nativement les UUID (type uuid, generation uuid_generate_v4), indispensables pour la synchronisation offline sans collision d'identifiants. Le type JSONB permet de stocker les diagnostics a structure variable avec indexation et requetes. La fonction unaccent() simplifie la recherche client tolerante aux accents. La base device est PostgreSQL 15-alpine, schema charge depuis init.sql. MySQL ne propose aucune de ces fonctionnalites nativement.

### Pourquoi pas de SQLite sur le device ?

Le device n'utilise aucun SQLite (aucune dependance better-sqlite3/sqlite3, aucun usage dans le code). Le stockage local repose sur trois mecanismes complementaires : electron-store pour la configuration, un fichier JSON chiffre (/var/smart-mirror/sync-queue.json) pour la file de synchronisation, et des fichiers .jpg.enc chiffres pour les photos. La base relationnelle (PostgreSQL 15) est servie par le backend mock, pas par une base embarquee de type SQLite.

### Pourquoi pas Firebase ou Supabase ?

L'architecture multi-tenant avec isolation par boutique est complexe a implementer sur Firebase/Supabase (Row Level Security limitee, pas de controle fin des policies). La generation PDF de seance est aujourd'hui faite cote serveur par le mock Express (pdfkit, server.js:308-388) ; la cible CRM Laravel la deportera vers un job asynchrone. Enfin, les photos cosmetiques potentiellement sensibles imposent un controle total sur l'hebergement des donnees (et, en CIBLE, un hebergement HDS UE/EEE). Le code conserve un commentaire "In production, this triggers n8n webhook" (server.js:198) alors que la generation reste synchrone in-process : c'est un marqueur de cible roadmap, pas une fonctionnalite en place.

### Pourquoi un backend local sur le miroir ET un CRM distant ?

Le miroir a son propre backend (mock Express + PostgreSQL) qui tourne directement sur le device. Toutes les ecritures (clients, seances, photos, diagnostics) vont d'abord dans cette base locale. Le CRM Laravel est la source de verite partagee entre tous les miroirs et boutiques. Un service de synchronisation (CrmSyncService) detecte quand le reseau est disponible, pousse les donnees non syncees vers le CRM, verifie la reception (reponse 200/201), marque les records comme synces localement, et nettoie les donnees locales confirmees apres 30 jours. Ce design garantit que la seance n'est jamais interrompue par un probleme reseau, et que les donnees finissent toujours dans le CRM central.

### Pourquoi ne pas ecrire directement dans le CRM ?

Si le CRM est la seule base, une coupure reseau pendant une seance bloque tout : impossible de sauvegarder un client, une photo, un diagnostic. Le backend local elimine cette dependance. De plus, les ecritures locales sont instantanees, alors qu'un appel API distant peut prendre 100-500 ms. Pour une UX fluide sur un kiosque tactile, la reactivite est critique.

### Comment garantissez-vous que les donnees arrivent bien dans le CRM ?

Le pipeline de sync est verifie en 4 etapes : (1) lecture des records non synces, (2) push vers le CRM avec verification du code HTTP 200/201, (3) confirmation locale qui marque synced_to_crm = TRUE, (4) nettoyage des records confirmes apres 30 jours. Si une etape echoue, le record reste dans la file et sera retente au prochain cycle. Le service crm-sync est couvert par 18 tests unitaires qui verrouillent ce comportement.

### Comment la recherche client fonctionne cross-miroir ?

Quand le praticien cherche un client, l'app interroge d'abord la base locale, puis le CRM distant si le reseau est disponible. Les resultats sont fusionnes et dedupliques par identifiant. Cela permet de retrouver un client qui a fait un soin dans une autre boutique ou sur un autre miroir, tout en garantissant que la recherche fonctionne meme sans reseau.

---

## 2. Choix de Donnees

### Pourquoi des UUID et pas des identifiants auto-incrementes ?

Le miroir fonctionne offline-first : il cree des clients et des seances sans connexion au serveur. Avec des auto-increments, deux miroirs offline genereraient les memes ID, causant des collisions a la synchronisation. Les UUID v4 garantissent l'unicite sans coordination centrale.

### Pourquoi JSONB pour les diagnostics IA ?

La structure du diagnostic varie selon le nombre de zones capturees et les recommandations generees. Aujourd'hui le proxy IA par defaut est mocke : les scores sont produits par Math.random (server.js:518-549), aucun appel reseau n'est fait depuis ce chemin. Le format JSONB reste le bon choix structurel : un schema relationnel rigide obligerait a modifier la base a chaque evolution du prompt ou du modele. JSONB permet de stocker une structure flexible tout en offrant l'indexation et les requetes SQL sur les champs specifiques.

### Pourquoi les photos sont stockees a la fois en local et sur le serveur ?

L'affichage des captures doit etre instantane pendant la seance, sans dependre du reseau. Les photos sont donc d'abord stockees localement (chiffrees) pour un acces immediat, puis synchronisees vers le serveur quand le reseau est disponible. Cette double strategie garantit une experience fluide meme en cas de coupure WiFi.

### Pourquoi une retention de 30 jours ?

Le principe de minimisation du RGPD impose de ne conserver les donnees que le temps strictement necessaire. 30 jours couvrent l'intervalle entre deux seances en salon (frequence typique : 2 a 4 semaines) tout en limitant l'exposition des donnees personnelles. La purge est implementee (cleanupExpiredPhotos, declenchee dans le cycle de polling).

### Pourquoi stocker la date de naissance et pas l'age ?

La date de naissance est une donnee immutable : elle ne change jamais et n'a pas besoin d'etre mise a jour. L'age est une valeur calculee qui devient fausse des le lendemain de l'anniversaire. Stocker un age obligerait a le recalculer periodiquement, ce qui est une source d'erreur evitable.

### Pourquoi 9 tables en base alors que le MCD en compte 8 ?

Le MCD presente 8 entites metier (BOUTIQUE, CLIENTE, CONSENTEMENT, MIROIR, SEANCE, PHOTO, PRODUIT, MEDIA), chacune correspondant 1:1 a une table SQL. La base (init.sql) contient une 9e table, config_miroir, qui est une table technique de configuration de l'interface du miroir, sans portee metier : c'est pourquoi elle ne figure pas au MCD conceptuel. L'ecart 8/9 est donc assume et documente. Quelques attributs portent des noms differents entre MCD et SQL (par exemple MIROIR : device_token / is_online / ip_address en base, PRODUIT : affiche_miroir).

---

## 3. Choix Methodologiques

### Pourquoi le design offline-first ?

Le WiFi en salon de coiffure est notoirement instable : equipements electriques, murs epais, reseau partage avec les clients. Un miroir qui affiche "erreur reseau" en pleine seance avec un client est inacceptable. L'offline-first garantit que la seance se deroule sans interruption et que les donnees se synchronisent automatiquement quand le reseau revient. C'est un offline-first reel : la photo est ecrite chiffree sur disque puis mise en file AVANT tout reseau, et reempilee en cas d'echec (retry).

### Pourquoi le consentement a chaque seance et pas une seule fois ?

Le RGPD (article 7) exige un consentement libre, specifique et eclaire pour chaque traitement de donnees. Chaque seance implique de nouvelles photos du cuir chevelu. Un consentement unique a l'inscription ne couvrirait pas les traitements futurs et serait juridiquement fragile en cas de controle. Le verrou est a deux niveaux : FK consentement_id NOT NULL en base, et refus serveur HTTP 422 si le consentement est absent, introuvable ou revoque (server.js:166-177).

### Pourquoi Merise Agile ?

Merise apporte une modelisation rigoureuse des donnees (MCD) et des traitements (MCT) qui force a penser le schema avant de coder. L'iteration agile (sprints, user stories) permet d'enrichir le modele incrementalement. Cette combinaison evite les deux ecueils : le code sans reflexion prealable (agile pur) et la paralysie d'analyse (Merise classique).

### Pourquoi le TDD et combien de tests ?

Le total est de 196 cas : 60 tests unitaires Vitest et 136 cas e2e Playwright (4 fichiers). Les 60 unitaires couvrent 5 services du main (api-client 14, config 14, crm-sync 18, crypto-vault 7, sync 7). Le service de synchronisation crm-sync, chemin critique, est donc bien couvert par 18 tests unitaires. Le fichier crypto-vault.service.test.ts verrouille le chiffrement : il prouve notamment que le JPEG ecrit sur disque ne commence pas par FF D8 et que le store ne contient pas le token en clair. La couverture restante a etendre vise les services main encore sans test unitaire (media-cache, microscope, updater, wifi).

### Pourquoi un microscope dedie (WiFi) et pas la camera d'un telephone ?

L'analyse capillaire necessite un grossissement optique pour observer la structure du cuir chevelu et des follicules. La camera d'un telephone offre au mieux un zoom numerique qui degrade la resolution. Le microscope capillaire fournit un grossissement optique reel. Precision technique : ce microscope se connecte en WiFi/TCP (192.168.34.1:8080, protocole JHCMD, handshake JHCMD + 0xD0 0x01), pas en USB ; son flux H.264 est transcode par ffmpeg en MJPEG sur localhost:9100.

### Pourquoi MJPEG et pas WebRTC, et pourquoi pas MSE ?

Le flux microscopique circule exclusivement en local (localhost:9100), entre le proxy et l'application Electron sur la meme machine. WebRTC est concu pour la communication pair-a-pair sur Internet (signaling, ICE, STUN/TURN), une complexite inutile pour du localhost. Le live preview est un flux MJPEG (multipart/x-mixed-replace) affiche directement dans une balise img (src=http://localhost:9100/stream.mjpg) ; il n'y a pas de MediaSource/MSE dans le code. MJPEG est une succession d'images JPEG sur HTTP, trivial a consommer dans un tag img, et le H.264 source n'atteint jamais le renderer (transcode par ffmpeg cote proxy).

### Pourquoi n8n pour les workflows ? [CIBLE ROADMAP - non implemente]

n8n est une CIBLE roadmap : aujourd'hui la generation PDF est synchrone in-process (pdfkit), et le code porte un commentaire "In production, this triggers n8n webhook" (server.js:198) qui n'est pas branche. En cible, n8n decouplera les traitements asynchrones (generation PDF, envoi d'email, notifications) du code applicatif : ajouter un nouveau workflow se ferait visuellement sans deployer une nouvelle version du backend. Cette separation reduira le risque de regression et accelerera les evolutions post-MVP.

### Pourquoi une mock API separee du backend cible ?

La mock API a permis de developper les 9 ecrans en figeant tot le contrat d'API (endpoints, formats de reponse). A ce jour, ce mock Express EST le backend du MVP sur le device. Parce que le contrat est fige, la consolidation avec le CRM Laravel se fera en strangler-fig, endpoint par endpoint, sans toucher au code frontend. Ce decoupage permet un developpement parallele et reduit le chemin critique des evolutions futures.

---

## 4. Choix UX/UI

### Pourquoi une resolution 1080x1920 en portrait ?

Le miroir est un objet physique vertical. Les utilisateurs se regardent dans un miroir en format portrait, pas paysage. L'interface reproduit ce format naturel pour que l'experience soit coherente avec l'objet. De plus, le portrait maximise la surface verticale pour afficher le flux microscopique et les informations de diagnostic simultanement.

### Pourquoi un clavier virtuel ?

Le miroir est un kiosque sans peripheriques physiques : pas de clavier, pas de souris. Chaque saisie (nom, telephone, recherche client) passe par un clavier virtuel tactile affiche a l'ecran. Le composant react-simple-keyboard est personnalise pour n'afficher que les touches necessaires au contexte (alphabetique, numerique, telephone).

### Pourquoi le design "glass" (effet verre) ?

L'esthetique K-Beauty est fondee sur la modernite, la purete et la transparence. L'effet verre (fond semi-transparent, flou d'arriere-plan, reflets subtils) cree une coherence visuelle avec le miroir physique lui-meme. Ce choix de design renforce l'identite premium du produit dans un contexte salon haut de gamme.

### Pourquoi un QR code et pas l'envoi direct par email ?

Le QR code elimine le besoin de saisir une adresse email sur le clavier virtuel (source d'erreurs de frappe). Il est instantane : le client scanne avec son telephone et obtient son rapport PDF en une seconde. De plus, il est RGPD-friendly : pas de collecte d'email supplementaire, pas de traitement de donnees de contact additionnel.

### Pourquoi un countdown de 30 secondes sur l'ecran QR ?

Le miroir est un dispositif partage entre clients successifs. Sans timeout, l'ecran QR resterait affiche indefiniment, exposant les donnees du client precedent. Le countdown de 30 secondes laisse le temps de scanner le QR code puis ramene automatiquement le miroir a l'ecran d'accueil, pret pour le client suivant.

---

## 5. Choix Securite

### Pourquoi l'authentification par adresse MAC ?

Le miroir est un dispositif physique fixe, installe dans un salon specifique. L'adresse MAC identifie chaque appareil sans necessiter de login/mot de passe sur un kiosque sans clavier. Lors du provisioning, le miroir transmet son identifiant au CRM qui lui delivre un token d'acces lie a la boutique ; le mock device lit ce token (x-mirror-token) dans les en-tetes des requetes.

### Pourquoi un coffre applicatif AES-256-GCM plutot que safeStorage ?

Electron safeStorage s'appuie sur le trousseau natif de l'OS (libsecret sur Linux, Keychain sur macOS). Sur un Pi 5 en kiosque headless, sans session de bureau (pas de gnome-keyring, pas de Secret Service deverrouille), safeStorage retombe sur le backend basic_text, qui n'est que de l'obfuscation. Le projet utilise donc un coffre applicatif AES-256-GCM independant du trousseau (cryptoVault, crypto-vault.service.ts) ; safeStorage n'est pas utilise en production. Les secrets (device.token, crmToken, crmBearerToken) sont persistes chiffres au repos. La cle maitre est resolue par priorite : env SMART_MIRROR_MASTER_KEY -> systemd-creds (CREDENTIALS_DIRECTORY) -> keyfile -> fallback dev, avec un THROW explicite en production si aucune cle n'est disponible (jamais de degrade silencieux). Le format de payload est [version 1o || IV 12o || authTag 16o || ciphertext].

### Pourquoi Sanctum cote CRM et pas JWT ? [CIBLE CRM]

Sanctum est lie au CRM Laravel. Cote device aujourd'hui, l'authentification REALISEE est un echange MAC + token_device produisant un Bearer (crm-sync.service.ts). En cible CRM, Sanctum (natif Laravel) stockera les tokens en base et permettra une revocation instantanee : si un miroir est vole, son token serait desactive en une requete, avec des abilities/scopes par miroir. Les JWT sont ecartes car irrevocables par nature (valides jusqu'a expiration), inacceptable pour un parc de dispositifs physiques exposes au vol.

### Comment les photos sensibles sont-elles protegees ?

Sur le device, c'est REALISE : les photos de cuir chevelu sont ecrites chiffrees au repos en AES-256-GCM (extension .jpg.enc), via cryptoVault appele dans sync.service.ts (savePhotoLocally). Le chiffrement est authentifie (IV aleatoire par photo, tag d'integrite GCM). La file de synchronisation est elle aussi chiffree au repos (lecture retrocompatible de l'ancien JSON clair), et la photo n'est dechiffree qu'au moment du push CRM (crm-sync.service.ts), ou le suffixe .enc est retire du nom distant. Sont aussi en place la retention courte (purge a 30 jours, cleanupExpiredPhotos) et le consentement obligatoire avant seance. Durcissement Electron : sandbox true, contextIsolation true, nodeIntegration false, et CSP appliquee en production (index.ts, garde if !is.dev). RESTE A FAIRE avant production : durcir le backend mock (PDF de seance servi sans protection, secrets a externaliser, device_token a hacher), pgcrypto sur les colonnes sensibles cote serveur, chiffrement en transit (TLS), puis object storage chiffre et hebergement HDS.

### Quel est l'etat reel de la CI securite ?

La CI (.github/workflows/ci.yml) combine des gates bloquants et des controles informatifs. BLOQUANTS : npm audit --omit=dev --audit-level=critical (vulnerabilites critiques en dependances de production) et gitleaks (job secrets-scan, detection de secrets). NON BLOQUANTS (continue-on-error, a visee informative) : npm audit --audit-level=high (incluant dev), generation du SBOM CycloneDX (uploade en artefact), et l'analyse Semgrep. Cette gradation evite de bloquer la chaine sur du bruit tout en imposant un veto sur les deux risques majeurs : vulnerabilite critique en prod et fuite de secret.

---

## 6. Souverainete de l'IA et confidentialite

Cette section traite specifiquement de la chaine d'analyse capillaire : ou part la donnee, la dependance internet, et la conformite RGPD. La strategie est presentee en 3 versions selon le niveau de souverainete recherche.

### L'IA du miroir fonctionne-t-elle reellement aujourd'hui ?

Le chemin par defaut de l'application est MOCKE : le proxy IA (port 3001) renvoie des scores generes par Math.random avec une latence simulee (server.js:518-549) ; l'image recue dans le corps de la requete n'est pas exploitee sur ce chemin. Le mock valide le flux de bout en bout et le contrat d'API (le diagnostic retourne deja un niveau de confiance : ok, a_confirmer, non_concluant). Il n'y a aucune vision CPU on-device : aucun OpenCV, aucun cascade Haar dans le code.

### Existe-t-il un vrai service d'IA, et que fait-il de la photo ?

Oui. Un second service IA REEL existe : crm/ia-service (port 3002), deploye cote SERVEUR (CRM) via docker-compose et Traefik, pas sur le Raspberry Pi. Ce service envoie la photo JPEG complete, encodee en base64, vers GitHub Models (endpoint Azure, models.inference.ai.azure.com), en vision multimodale (image_url), avec authentification Bearer GITHUB_TOKEN et des modeles vision (Llama-3.2-11B-Vision, Phi-3.5-vision, gpt-4o-mini). Il faut donc l'enoncer clairement : sur ce chemin, la photo QUITTE le perimetre vers un cloud US. L'application miroir ne pointe vers ce service 3002 dans aucune configuration par defaut (elle utilise le mock 3001) ; le service reel est construit et deploye cote serveur mais pas cable par defaut dans le device.

### Vos donnees IA sortent-elles de l'UE ?

Sur le chemin cloud reel decrit ci-dessus, oui : la photo part vers GitHub Models / Azure (US). C'est un transfert hors UE d'une donnee potentiellement sensible, qu'il faut encadrer (garanties contractuelles type SCC, minimisation, recadrage). C'est precisement le probleme de souverainete que la strategie en 3 versions adresse, sans le masquer.

### Quelle est votre strategie de souverainete en 3 versions ?

- V1 (cloud actuel, GitHub Models / Azure) : souverainete faible, dependance internet totale, transfert hors UE probable. C'est l'etat de l'architecture cloud telle que codee.
- V2 (cible cloud souverain, Mistral AI / UE) : editeur francais, hebergement UE par defaut, Zero Data Retention (ZDR) contractualisable via DPA et endpoint EU. La souverainete devient elevee, mais l'image quitte toujours le miroir : souverainete n'est pas confidentialite totale.
- V3 (cible premium, 100% locale sur NPU Pi 5) : rien ne sort du miroir, aucune dependance internet, souverainete maximale, cout d'usage marginal nul. Necessite un accelerateur Hailo (HAT NPU, 70 a 150 EUR) et une complexite d'integration elevee.

### Question piege : "Mistral c'est souverain, mais l'image quitte quand meme le miroir ?"

Oui, et il faut le reconnaitre. La souverainete (editeur et hebergement UE maitrises) n'est pas la confidentialite totale. Les atouts reels de la V2 sont concrets : editeur francais/UE, hebergement UE par defaut, et ZDR + DPA + endpoint EU qui suppriment le transfert hors UE et la retention. La seule version "rien ne sort" est la V3 locale. C'est exactement pour cela que je propose trois niveaux selon le besoin du client.

### Question piege : "Votre NPU Hailo fait-il vraiment tourner de l'IA generative en local ?"

Distinction nette. Les puces Hailo-8 / 8L (AI Kit, AI HAT+ 13/26) sont des accelerateurs de vision classique (CNN : classification, detection, segmentation) ; leur memoire on-chip ne permet pas de charger un LLM/VLM de plusieurs milliards de parametres. Ma V3 realiste est donc une classification dediee entrainee sur des classes capillaires (cuir chevelu sec / gras / pellicules / normal), rapide et 100% offline, dont la sortie est labels + scores, le texte cosmetique etant genere cote app par regles/templates. Le diagnostic en langage naturel 100% local ne devient envisageable qu'avec le tres recent Hailo-10H (AI HAT+ 2, janvier 2026, 8 Go LPDDR4 dedies) ou un petit VLM sur CPU a latence degradee : je le positionne en evolution, pas comme acquis.

### Question piege : "Est-ce de la donnee de sante (article 9 RGPD) ?"

Tant que la finalite reste strictement cosmetique, sans diagnostic medical (pas de revendication d'alopecie, de dermatite, etc.), une image de cuir chevelu n'est en principe pas une donnee de sante au sens de l'article 9. Le risque serait de basculer en revendiquant du diagnostic de pathologie. D'ou un cadrage strict "cosmetique, non medical" dans toute la documentation, couple a la minimisation (traitement local quand c'est possible). C'est une qualification juridique a faire valider.

### Pourquoi pas un appel direct a ChatGPT grand public ?

Sur le chemin reel, l'IA passe par GitHub Models / Azure cote serveur, pas par une API grand public. Trois raisons motivent un service IA dedie plutot qu'un appel direct grand public : la confidentialite (encadrer le transfert d'une photo potentiellement sensible), la specialisation (prompts optimises pour l'analyse cosmetique capillaire), et la resilience (strategie multi-modeles avec fallback entre plusieurs modeles vision). La trajectoire souveraine (V2 Mistral EU, puis V3 local) renforce encore ce raisonnement.

---

## 7. Questions Pieges Operationnelles

### Le WiFi tombe pendant une seance -- que se passe-t-il ?

Rien ne change pour l'utilisateur. Toutes les ecritures vont dans le backend local qui tourne sur le device, sans dependance reseau. Les photos sont sauvegardees localement (chiffrees), le diagnostic mock reste disponible en local. Le CrmSyncService detecte la perte de connexion et met la sync en pause. Quand le WiFi revient, il reprend automatiquement : push des records non synces, verification, confirmation. Le praticien ne voit aucune interruption.

### Que se passe-t-il si le CRM distant est en panne ?

L'app continue de fonctionner normalement. Toutes les operations se font sur le backend local. Les donnees s'accumulent avec synced_to_crm = FALSE. Quand le CRM revient, le prochain cycle de sync pousse tout le backlog. Le pipeline est idempotent : un item en erreur reseau est reempile et reessaye, seuls les records non confirmes sont rejoues.

### Le microscope se deconnecte en pleine capture ?

La StatusBar en haut de l'ecran affiche en temps reel l'etat du microscope. La deconnexion est detectee au niveau du lien WiFi/TCP (perte de la socket vers 192.168.34.1:8080) ou de la sante du flux MJPEG local (localhost:9100), pas d'un branchement USB. Le proxy (proxy.js) tente une reconnexion automatique et relance le transcodage ffmpeg. Les captures deja realisees (snapshots JPEG recuperes sur /snapshot.jpg) sont conservees localement, la seance n'est pas perdue.

### Quelle est la fiabilite de l'IA ?

A ce stade, le chemin par defaut est mocke (Math.random, server.js:518-549). Le mock valide le flux de bout en bout et le contrat d'API (niveaux ok / a_confirmer / non_concluant). Le service IA reel (crm/ia-service, GitHub Models) existe cote serveur et persiste modele et latence. Dans tous les cas, le praticien est forme a interpreter ces niveaux et conserve le dernier mot : l'IA est un outil d'aide cosmetique, pas un substitut au jugement professionnel ni un diagnostic medical.

### Comment scaler a 100 salons ?

L'architecture est deja multi-tenant : chaque boutique est isolee au niveau des donnees. Chaque miroir est autonome (offline-first) et ne sollicite le serveur que pour la synchronisation, ce qui limite intrinsequement la charge centrale. En cible, l'API CRM Laravel stateless sera horizontalement scalable derriere un load balancer, et les taches lourdes (PDF, sync) seront deportees vers des queues. Aujourd'hui ces taches sont synchrones ou gerees par une file JSON locale interrogee a 30 s (heartbeat 60 s) ; le passage a des queues est le levier de scalabilite identifie pour ce palier.

### Pourquoi pas une application mobile ?

Le miroir est un outil professionnel fixe dans un salon, pas un gadget personnel. L'experience kiosque guidee (ecran par ecran, gros boutons tactiles) est concue pour etre utilisee par le praticien pendant le service, avec le client assis face au miroir. Une application mobile s'integrerait mal au pipeline microscope (socket WiFi/TCP vers 192.168.34.1:8080 + transcodage ffmpeg local), ne controle pas l'environnement d'affichage, et ne garantit pas le mode kiosque securise.

### Le RGPD est-il vraiment respecte ?

Le RGPD est respecte sur plusieurs points DEJA en place, et il reste des exigences a tenir avant la mise en production. En place et verifiable : le consentement explicite avant chaque seance (article 7), verrouille en base par la FK consentement_id NOT NULL et refuse cote serveur en HTTP 422 (server.js:166-177) ; la retention limitee a 30 jours (minimisation, cleanupExpiredPhotos) ; l'absence de tracking et de cookies tiers ; et le chiffrement AU REPOS des photos sur le device (AES-256-GCM via cryptoVault, ecriture .jpg.enc dans sync.service.ts), de la file de synchronisation et des tokens. Ce qui reste a tenir : la securisation du backend mock, pgcrypto sur les colonnes sensibles, le chiffrement en transit (TLS), l'anonymisation/effacement, et surtout l'encadrement du transfert hors UE pour le service IA reel (la photo part vers GitHub Models / Azure US) ainsi que la trajectoire souveraine (V2 Mistral EU, V3 local). Je presente donc la conformite comme une trajectoire maitrisee, avec des acquis concrets, pas comme un acquis total.

### Que faire si l'IA se trompe ?

Le praticien a toujours le dernier mot. L'IA ne pose pas de diagnostic medical, elle fournit une analyse cosmetique avec un niveau de confiance explicite. Si le resultat est marque "a_confirmer" ou "non_concluant", le praticien ajuste ou ignore la suggestion. Le rapport final reflete la decision du praticien, pas celle de l'IA seule.

### Comment gerez-vous la concurrence sur le marche ?

Le marche n'est pas vide, et il faut le dire clairement. Sur l'analyse capillaire/cuir chevelu professionnelle, on trouve par exemple K-Scan, FotoFinder, ARAMO ; sur le miroir connecte beaute, des acteurs comme BECON/Samsung, CareOS ou HiMirror. Notre differenciation n'est pas un "first-mover" illusoire mais l'integration verticale : un outil professionnel B2B salon, a cout maitrise, combinant capture microscope WiFi, diagnostic cosmetique, CRM/synchronisation offline-first et conformite RGPD pensee des la conception, specifiquement pour les salons K-Beauty. Le positionnement vise le creneau intermediaire entre l'application mobile grand public (sans microscope ni CRM) et le dispositif medical/clinique haut de gamme.

### Quel est le modele economique ?

SaaS B2B par boutique : abonnement mensuel couvrant le miroir (hardware + logiciel), le CRM multi-tenant, et le service IA. Le cout est previsible pour le salon, et le modele recurrent assure la perennite du service. Des options additionnelles (synchronisation Shopify, workflows n8n personnalises, analytics avancees) constituent des leviers d'upsell. Shopify et n8n sont des cibles roadmap, pas des integrations deja livrees.

---

## 8. Banque de reponses (REALISE vs CIBLE)

Reponses pre-redigees, opposables a un jury qui lit le code. Chaque reponse distingue ce qui est REALISE et verifiable de ce qui est CIBLE roadmap.

### Votre IA fonctionne-t-elle reellement ?

Le chemin par defaut de l'app est mocke (server.js:518-549, scores Math.random). Un service IA reel existe cependant cote serveur (crm/ia-service, port 3002) : il envoie la photo JPEG base64 a GitHub Models (Azure), en vision multimodale, auth GITHUB_TOKEN. L'app ne pointe pas vers ce service par defaut. Brancher la chaine reelle dans le device, et l'orienter vers une cible souveraine, est la suite identifiee.

### Le provider IA, c'est OpenRouter ?

Non. OpenRouter est cite dans la documentation mais n'est appele dans aucun code executable. Le service IA reel utilise GitHub Models (endpoint Azure models.inference.ai.azure.com, auth GITHUB_TOKEN), avec des modeles vision (Llama-3.2-11B-Vision, Phi-3.5-vision, gpt-4o-mini). La cible souveraine documentee est Mistral AI (UE), puis le local sur NPU.

### Le microscope est-il en USB ?

Non, il est en WiFi/TCP (192.168.34.1:8080, protocole JHCMD, handshake JHCMD + 0xD0 0x01). Le flux H.264 est transcode par ffmpeg en MJPEG servi sur localhost:9100 (proxy.js), et affiche dans une balise img. Il subsiste des references USB/UVC/V4L2 dans le repo (regles udev, /dev/video0, v4l2-ctl) mais ce sont des vestiges non consommes par le pipeline reel.

### Le live preview, c'est du H.264 via MSE ?

Non. Le renderer ne recoit jamais de H.264 : le flux est du MJPEG (multipart/x-mixed-replace) affiche dans une balise img (localhost:9100/stream.mjpg). Il n'y a aucune API MediaSource/SourceBuffer dans le code du device. ffmpeg est au coeur du pipeline (transcodage H.264 -> MJPEG) et n'est pas en cours de retrait.

### Avez-vous des queues Redis ?

Pas aujourd'hui : aucune dependance Redis, aucun conteneur dans le docker-compose du device. La file de synchronisation REALISEE est un simple fichier JSON local (sync-queue.json), chiffre au repos, interroge a 30 s (heartbeat 60 s). Des queues (cote CRM Laravel) sont la cible pour les traitements asynchrones : generation PDF, push CRM, purge RGPD, etc.

### Y a-t-il du SQLite sur le device ?

Non, aucun SQLite sur le device (aucune dependance, aucun usage). Le stockage local repose sur electron-store (config), le fichier JSON chiffre sync-queue.json (file de sync), et des fichiers .jpg.enc (photos). La base relationnelle est PostgreSQL 15 servie par le mock Express. Les occurrences SQLite du depot concernent le CRM Laravel et la documentation.

### Les photos de cuir chevelu sont-elles chiffrees ?

Oui, au repos sur le device : sync.service.ts (savePhotoLocally) ecrit un .jpg.enc chiffre AES-256-GCM via cryptoVault (crypto-vault.service.ts), la file de sync est chiffree, et la photo n'est dechiffree qu'avant le push CRM (crm-sync.service.ts). La cle maitre vient de systemd-creds en prod, avec THROW explicite sans cle. Un test dedie prouve que le JPEG sur disque ne commence pas par FF D8. Reste a faire : durcir le backend mock, pgcrypto en base, object storage chiffre et HDS (donnee potentiellement de sante, art. 9). Attention : sur le chemin IA cloud reel, la photo en clair est envoyee a GitHub Models / Azure US, ce qui est un point RGPD a encadrer.

### Combien de tests ?

196 cas au total : 60 tests unitaires Vitest (api-client 14, config 14, crm-sync 18, crypto-vault 7, sync 7) et 136 cas e2e Playwright (4 fichiers). Le service critique crm-sync est couvert par 18 tests unitaires. Le fichier crypto-vault.service.test.ts verrouille le chiffrement (JPEG sur disque sans FF D8, store sans token en clair). La couverture restante a etendre vise media-cache, microscope, updater et wifi.

### Tournez-vous Laravel sur le miroir ?

Non, le backend du device est un mock Express + PostgreSQL 15 (server.js, docker-compose), sans composer.json ni artisan. Laravel 13 / PHP 8.4 est le CRM separe (crm/backend), source de verite partagee entre boutiques, et/ou cible de consolidation. Le contrat d'API est fige par le mock pour pouvoir consolider en strangler-fig endpoint par endpoint.

### Le sandbox Electron et la CSP sont-ils en place ?

Oui : sandbox true et contextIsolation true (index.ts), nodeIntegration false, et CSP appliquee en production via onHeadersReceived (garde if !is.dev). La CI GitHub Actions (ci.yml), l'ESLint flat config et la playwright.config sont egalement en place.

### Quels controles CI sont bloquants ?

Bloquants : npm audit critical en dependances de production, et gitleaks (detection de secrets). Non bloquants (continue-on-error, informatifs) : npm audit high incluant dev, SBOM CycloneDX, et Semgrep. Le veto porte donc sur les deux risques majeurs (vulnerabilite critique en prod, fuite de secret), sans bloquer la chaine sur du bruit.

### La regle RGPD du consentement est-elle verrouillee ?

Oui, a deux niveaux : schema (init.sql, FK consentement_id NOT NULL) et serveur (server.js:166-177 refuse une seance en HTTP 422 si le consentement est absent, introuvable ou revoque). Le verrou applicatif verifie explicitement que le consentement n'est pas revoque (date_revocation IS NULL).

### Vos donnees IA sortent-elles de l'UE ?

Sur le chemin IA cloud reel, oui : la photo part vers GitHub Models / Azure (US). C'est un transfert hors UE d'une donnee potentiellement sensible, a encadrer (garanties contractuelles SCC, minimisation). La trajectoire souveraine adresse ce point : V2 cloud Mistral EU (hebergement UE, ZDR, DPA), puis V3 100% locale sur NPU (rien ne sort). Si les photos sont qualifiees donnees de sante, un hebergement certifie HDS UE/EEE est requis.

### Quelle est la cible de build du device ?

Le build electron-builder cible Linux uniquement, en deux formats (deb et AppImage), chacun pour deux architectures : arm64 (Raspberry Pi) ET x64. Il n'y a aucune cible Windows ni macOS. La publication des mises a jour utilise le provider generic via la variable UPDATE_SERVER_URL.

### Avez-vous des concurrents ?

Oui, le marche n'est pas vide. En analyse capillaire professionnelle : K-Scan, FotoFinder, ARAMO. En miroir connecte beaute : BECON/Samsung, CareOS, HiMirror. Je ne revendique aucun "first-mover" ; ma differenciation est l'integration verticale (capture microscope WiFi, diagnostic cosmetique, CRM offline-first, RGPD by design) pour le creneau B2B salon K-Beauty a cout maitrise.
