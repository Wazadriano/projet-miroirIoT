# DreamTech Smart Mirror -- Preparation Soutenance Jury

Document de preparation aux questions du jury. Chaque reponse est directe, argumentee techniquement, et formulee en 2 a 4 phrases.

---

## 1. Choix d'Architecture

### Pourquoi Electron et pas une webapp ?

Le miroir s'appuie sur un microscope capillaire en WiFi/TCP (192.168.34.1:8080, protocole proprietaire JHCMD), dont le flux H.264 est transcode par ffmpeg en MJPEG sur localhost:9100 (proxy.js). Le pipeline a besoin de spawner ffmpeg et d'ouvrir un socket TCP local vers le microscope, ce qu'un navigateur web standard ne permet pas. Electron offre egalement le mode kiosque natif (plein ecran sans barre d'adresse), le stockage chiffre des tokens au repos via un coffre applicatif AES-256-GCM (cryptoVault, independant du trousseau OS, donc fiable sur Pi headless) et le fonctionnement offline-first avec persistance locale. Une webapp necessiterait un navigateur ouvert, une connexion permanente, et n'aurait acces ni a ffmpeg ni au socket TCP local du microscope. (Note : on trouve dans le depot des vestiges UVC/V4L2 morts, non utilises par le pipeline reel.)

### Pourquoi React et pas Vue ou Angular ?

React 19 offre l'ecosysteme le plus mature pour Electron via electron-vite, avec un hot-reload fiable et une compatibilite native. Zustand (state management choisi) est concu specifiquement pour React. L'equipe avait deja une experience React, ce qui a reduit le temps de montee en competence sur un projet au calendrier serre.

### Pourquoi Zustand et pas Redux ?

Le flux de l'application est lineaire (ecran par ecran, une seule seance active a la fois). Redux impose un boilerplate considerable (actions, reducers, middleware) injustifie pour un state aussi simple. Zustand offre un store minimaliste, sans boilerplate, avec une API directe qui correspond exactement au pattern single-session du miroir.

### Pourquoi TypeScript ?

Le projet comprend quatre composants (Electron, mock-API, proxy microscope, service IA) qui partagent des interfaces de donnees (clients, seances, diagnostics). TypeScript garantit la coherence des types aux frontieres entre composants et detecte les erreurs de contrat a la compilation, pas en production. Sur un projet multi-brique, le type safety n'est pas optionnel.

### Pourquoi Laravel et pas Node.js/Express pour le backend ? [CIBLE ROADMAP - non implemente]

A clarifier d'emblee : aujourd'hui le backend REALISE est un mock Express (server.js, API metier sur le port 8100, IA mock sur le port 3001) avec PostgreSQL 15-alpine et du SQL brut via le client pg ; il n'y a ni composer.json ni artisan. Laravel 13 / PHP 8.4 est la CIBLE roadmap. Le choix de Laravel pour la bascule est motive par ce qu'il fournit nativement et que le mock n'offre pas : Eloquent (ORM avec relations et migrations versionnees), Sanctum (tokens revocables par device), generation PDF cote serveur, et un systeme de queues. Le mock Express a d'abord servi a figer le contrat d'API ; la migration se fera en strangler-fig, endpoint par endpoint, sans big-bang. Redis (queues) est lui aussi une cible roadmap, voir plus bas.

### Pourquoi PostgreSQL et pas MySQL ?

PostgreSQL supporte nativement les UUID (type uuid, generation uuid_generate_v4), indispensables pour la synchronisation offline sans collision d'identifiants. Le type JSONB permet de stocker les diagnostics IA a structure variable avec indexation et requetes. La fonction unaccent() simplifie la recherche client tolerante aux accents. MySQL ne propose aucune de ces fonctionnalites nativement.

### Pourquoi Redis ? [CIBLE ROADMAP - non implemente]

Honnetement : Redis est absent du code aujourd'hui (aucune dependance, aucun conteneur dans le docker-compose). La file de synchronisation REALISEE est un simple fichier JSON local (/var/smart-mirror/sync-queue.json) interroge toutes les 30 secondes, avec un heartbeat a 60s (sync.service.ts). Redis est une CIBLE roadmap, justifiee par 8 jobs asynchrones reels identifies dans le code (generation PDF synchrone qui bloque la requete, push CRM dont le flag syncing ne survit pas a un crash, IA mockee a brancher sur OpenRouter, purge RGPD, etc.). Un seul service Redis 7 couvrirait alors quatre besoins : backing store des queues Laravel (Queue/Horizon), cache applicatif, rate-limiting et locks de synchronisation. Tant que Laravel n'est pas en place, ajouter Redis n'aurait aucun sens.

### Pourquoi pas Firebase ou Supabase ?

L'architecture multi-tenant avec isolation par boutique est complexe a implementer sur Firebase/Supabase (Row Level Security limitee, pas de controle fin des policies). La generation PDF de seance est aujourd'hui faite cote serveur par le mock Express (pdfkit, server.js:308-388) ; la cible Laravel la deportera vers un job asynchrone. L'integration n8n pour les workflows asynchrones (CIBLE roadmap) requiert un backend auto-heberge. Enfin, les photos cosmetiques potentiellement sensibles imposent un controle total sur l'hebergement des donnees (et, en CIBLE, un hebergement HDS UE/EEE). Le code conserve d'ailleurs un commentaire "In production, this triggers n8n webhook" (server.js:198) alors que la generation reste synchrone in-process : c'est un marqueur de cible, pas une fonctionnalite en place.

### Pourquoi un backend local sur le miroir ET un CRM distant ?

Le miroir a son propre backend (Express + PostgreSQL) qui tourne directement sur le device. Toutes les ecritures (clients, seances, photos, diagnostics) vont dans cette base locale. Le CRM Laravel est la source de verite partagee entre tous les miroirs et boutiques. Un service de synchronisation (CrmSyncService) detecte quand le reseau est disponible, pousse les donnees non syncees vers le CRM, verifie la reception (reponse 200/201), marque les records comme synces localement, et nettoie les donnees locales confirmees apres 30 jours. Ce design garantit que la seance n'est jamais interrompue par un probleme reseau, et que les donnees finissent toujours dans le CRM central.

### Pourquoi ne pas ecrire directement dans le CRM ?

Si le CRM est la seule base, une coupure reseau pendant une seance bloque tout : impossible de sauvegarder un client, une photo, un diagnostic. Le backend local elimine cette dependance. De plus, les ecritures locales sont instantanees (latence < 1ms), alors qu'un appel API distant peut prendre 100-500ms. Pour une UX fluide sur un kiosque tactile, la reactivite est critique.

### Comment garantissez-vous que les donnees arrivent bien dans le CRM ?

Le pipeline de sync est verifie en 4 etapes : (1) lecture des records non synces via GET /api/sync/pending, (2) push vers le CRM avec verification du code HTTP 200/201, (3) confirmation locale via PATCH /api/sync/confirm qui marque synced_to_crm = TRUE, (4) nettoyage des records confirmes apres 30 jours via DELETE /api/sync/cleanup. Si une etape echoue, le record reste dans la file et sera retente au prochain cycle (toutes les 60 secondes).

### Comment la recherche client fonctionne cross-miroir ?

Quand le praticien cherche un client, l'app interroge d'abord la base locale, puis le CRM distant si le reseau est disponible. Les resultats sont fusionnes et dedupliques par identifiant. Cela permet de retrouver un client qui a fait un soin dans une autre boutique ou sur un autre miroir, tout en garantissant que la recherche fonctionne meme sans reseau.

---

## 2. Choix de Donnees

### Pourquoi des UUID et pas des identifiants auto-incrementes ?

Le miroir fonctionne offline-first : il cree des clients et des seances sans connexion au serveur. Avec des auto-increments, deux miroirs offline genereraient les memes ID, causant des collisions a la synchronisation. Les UUID v4 garantissent l'unicite sans coordination centrale.

### Pourquoi JSONB pour les diagnostics IA ?

La structure du diagnostic varie selon le nombre de zones capturees, les recommandations generees, et le modele de vision qui sera branche en cible (OpenRouter). Aujourd'hui l'IA est MOCKEE : les scores sont produits par Math.random (server.js:514-545), aucun appel reseau a un vrai modele n'est fait. Le format JSONB est neanmoins le bon choix structurel : un schema relationnel rigide obligerait a modifier la base a chaque evolution du prompt ou du modele. JSONB permet de stocker une structure flexible tout en offrant l'indexation et les requetes SQL sur les champs specifiques.

### Pourquoi les photos sont stockees a la fois en local et sur le serveur ?

L'affichage des captures doit etre instantane pendant la seance, sans dependre du reseau. Les photos sont donc d'abord stockees localement pour un acces immediat, puis synchronisees vers le serveur quand le reseau est disponible. Cette double strategie garantit une experience fluide meme en cas de coupure WiFi.

### Pourquoi une retention de 30 jours ?

Le principe de minimisation du RGPD impose de ne conserver les donnees que le temps strictement necessaire. 30 jours couvrent l'intervalle entre deux seances en salon (frequence typique : 2 a 4 semaines) tout en limitant l'exposition des donnees personnelles. Ce delai est un compromis entre utilite clinique et conformite reglementaire.

### Pourquoi stocker la date de naissance et pas l'age ?

La date de naissance est une donnee immutable : elle ne change jamais et n'a pas besoin d'etre mise a jour. L'age est une valeur calculee qui devient fausse des le lendemain de l'anniversaire. Stocker un age obligerait a le recalculer ou le mettre a jour periodiquement, ce qui est une source d'erreur evitable.

---

## 3. Choix Methodologiques

### Pourquoi le design offline-first ?

Le WiFi en salon de coiffure est notoirement instable : equipements electriques, murs epais, reseau partage avec les clients. Un miroir qui affiche "erreur reseau" en pleine seance avec un client est inacceptable. L'offline-first garantit que la seance se deroule sans interruption et que les donnees se synchronisent automatiquement quand le reseau revient.

### Pourquoi le consentement a chaque seance et pas une seule fois ?

Le RGPD (article 7) exige un consentement libre, specifique et eclaire pour chaque traitement de donnees. Chaque seance implique de nouvelles photos du cuir chevelu, qui sont des donnees sensibles. Un consentement unique a l'inscription ne couvrirait pas les traitements futurs et serait juridiquement fragile en cas de controle.

### Pourquoi Merise Agile ?

Merise apporte une modelisation rigoureuse des donnees (MCD) et des traitements (MCT) qui force a penser le schema avant de coder. L'iteration agile (sprints, user stories) permet d'enrichir le modele incrementalement. Cette combinaison evite les deux ecueils : le code sans reflexion prealable (agile pur) et la paralysie d'analyse (Merise classique).

### Pourquoi le TDD et combien de tests ?

Le chiffre exact est 178 cas : 42 tests unitaires Vitest et 136 cas e2e Playwright (4 fichiers). Je le dis precisement car certaines anciennes versions annonçaient a tort "65+ tests". Le nouveau fichier crypto-vault.service.test.ts (7 tests) verrouille le chantier chiffrement : il prouve notamment que le JPEG ecrit sur disque ne commence pas par FF D8 et que le store ne contient pas le token en clair. Je reste transparent sur le plus gros trou de couverture : crm-sync.service.ts (372 lignes, chemin critique de synchronisation) est aujourd'hui a 0 test, et seuls 4 services main sur 9 sont couverts en unitaire. C'est precisement le chantier que je renforce en BC04 (tests crm-sync, integration backend verrouillant la regle RGPD, et CI rendue bloquante apres npm audit fix).

### Pourquoi un microscope dedie (WiFi) et pas la camera d'un telephone ?

L'analyse capillaire necessite un grossissement optique pour observer la structure du cuir chevelu et des follicules. La camera d'un telephone offre au mieux un zoom numerique qui degrade la resolution. Le microscope capillaire fournit un grossissement optique reel, indispensable pour que l'IA produise un diagnostic exploitable. Precision technique : ce microscope se connecte en WiFi/TCP (192.168.34.1:8080, protocole JHCMD), pas en USB ; son flux H.264 est transcode par ffmpeg en MJPEG sur localhost:9100.

### Pourquoi MJPEG et pas WebRTC ?

Le flux microscopique circule exclusivement en local (localhost:9100), entre le proxy et l'application Electron sur la meme machine. WebRTC est concu pour la communication pair-a-pair sur Internet avec signaling, ICE, STUN/TURN -- une complexite inutile pour du localhost. MJPEG est une succession d'images JPEG sur HTTP, trivial a implementer et a consommer dans un tag img.

### Pourquoi n8n pour les workflows ? [CIBLE ROADMAP - non implemente]

n8n est une CIBLE roadmap : aujourd'hui la generation PDF est synchrone in-process (pdfkit), et le code porte un commentaire "In production, this triggers n8n webhook" (server.js:198) qui n'est pas branche. En cible, n8n decouplera les traitements asynchrones (generation PDF, envoi d'email, notifications) du code applicatif : ajouter un nouveau workflow (notification SMS, alerte stock) se ferait visuellement sans deployer une nouvelle version du backend. Cette separation reduira le risque de regression et accelerera les evolutions post-MVP, en s'appuyant sur Laravel Queue et Redis (eux aussi en cible).

### Pourquoi une mock API separee du backend ?

La mock API a permis de developper les 9 ecrans en figeant tot le contrat d'API (endpoints, formats de reponse). A ce jour, ce mock Express EST le backend du MVP : il n'a pas encore ete remplace par Laravel, qui reste la cible. Justement parce que le contrat est fige, la bascule vers Laravel se fera en strangler-fig, endpoint par endpoint, sans toucher au code frontend. Ce decoupage permet un developpement parallele et reduit le chemin critique de la future migration.

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

Le miroir est un dispositif physique fixe, installe dans un salon specifique. L'adresse MAC identifie de maniere unique chaque appareil sans necessiter de login/mot de passe sur un kiosque sans clavier. Lors du provisioning, le miroir transmet son MAC au CRM qui lui delivre un token d'acces lie a la boutique.

### Pourquoi un coffre applicatif AES-256-GCM plutot que safeStorage seul ?

Au depart les secrets passaient par Electron safeStorage, qui s'appuie sur le trousseau natif de l'OS (libsecret sur Linux, Keychain sur macOS). Limite reelle : sur un Pi 5 en kiosque headless, sans session de bureau (pas de gnome-keyring/kwallet, pas de Secret Service deverrouille), safeStorage retombe sur le backend basic_text, qui n'est que de l'obfuscation, et le code retombait alors sur une ecriture en clair du token. J'ai donc supprime safeStorage et la branche plaintext au profit d'un coffre applicatif AES-256-GCM independant du trousseau (cryptoVault, crypto-vault.service.ts). Aujourd'hui device.token, crmToken et crmBearerToken sont persistes chiffres au repos (config.service.ts), avec migration des secrets herites en clair. La cle maitre est resolue par priorite : env -> systemd-creds (lie au TPM en prod Pi) -> keyfile -> fallback dev, avec un THROW explicite en production si aucune cle n'est disponible (jamais de degrade silencieux). Le meme coffre couvre les buffers JPEG et la file de synchronisation.

### Pourquoi Sanctum et pas JWT ? [CIBLE ROADMAP - non implemente]

Sanctum est une CIBLE liee a la bascule Laravel. Aujourd'hui, l'authentification REALISEE est un echange artisanal MAC + token_device produisant un Bearer (crm-sync.service.ts) ; ce token n'est pas revocable proprement. En cible, Sanctum (natif Laravel, sans dependance externe) stockera les tokens en base et permettra une revocation instantanee : si un miroir est vole, son token serait desactive en une requete, avec des abilities/scopes par miroir. Les JWT sont ecartes car irrevocables par nature (valides jusqu'a expiration), ce qui est inacceptable pour un parc de dispositifs physiques exposes au vol.

### Comment les photos sensibles sont-elles protegees ? (etat reel et reste a faire)

Sur le device, c'est desormais REALISE : les photos de cuir chevelu sont ecrites chiffrees au repos en AES-256-GCM (extension .jpg.enc), via cryptoVault appele dans sync.service.ts (savePhotoLocally). Le chiffrement est authentifie (IV aleatoire par photo, tag d'integrite GCM), la cle maitre vient en priorite de systemd-creds (liee au TPM en prod Pi) avec fallback keyfile root 0600, et il n'existe plus aucune ecriture en clair ni de degrade silencieux (THROW explicite en production sans cle). La file de synchronisation est elle aussi chiffree au repos (lecture retrocompatible de l'ancien JSON clair), et la photo n'est dechiffree qu'au moment du push CRM (crm-sync.service.ts, pushPhotoCrm). C'etait l'ecart le plus grave que j'avais identifie (art. 32 RGPD), d'autant qu'une photo de cuir chevelu analysee peut etre requalifiee en donnee de sante (art. 9) : il est traite. Sont aussi en place la retention courte (purge a 30 jours, cleanupExpiredPhotos) et le consentement obligatoire avant seance. Ce qui RESTE A FAIRE : securiser le backend mock (PDF de seance encore servi sans protection, secrets en dur, device_token non hache), ajouter pgcrypto sur les colonnes sensibles, rendre l'audit deps CI bloquant, puis l'object storage chiffre et l'hebergement HDS avant mise en production.

---

## 6. Questions Pieges

### Le WiFi tombe pendant une seance -- que se passe-t-il ?

Rien ne change pour l'utilisateur. Toutes les ecritures vont dans le backend local qui tourne sur le device -- pas de dependance reseau. Les photos sont sauvegardees localement, le diagnostic IA est disponible si le service IA tourne en local. Le CrmSyncService detecte la perte de connexion et met la sync en pause. Quand le WiFi revient, il reprend automatiquement : push des records non synces, verification, confirmation. Le praticien ne voit aucune interruption.

### Que se passe-t-il si le CRM distant est en panne ?

L'app continue de fonctionner normalement. Toutes les operations se font sur le backend local. Les donnees s'accumulent avec synced_to_crm = FALSE. Quand le CRM revient, le prochain cycle de sync (toutes les 60 secondes) pousse tout le backlog. Le pipeline est idempotent : si un push partiel a eu lieu, seuls les records non confirmes sont reessayes.

### Le microscope se deconnecte en pleine capture ?

La StatusBar en haut de l'ecran affiche en temps reel l'etat du microscope. La deconnexion est detectee au niveau du lien WiFi/TCP (perte de la socket vers 192.168.34.1:8080) ou de la sante du flux MJPEG local (localhost:9100), pas d'un branchement USB : un indicateur visuel alerte alors immediatement le praticien. Le proxy (proxy.js) tente une reconnexion automatique et relance le transcodage ffmpeg. Les captures deja realisees sont conservees localement, la seance n'est pas perdue.

### Quelle est la fiabilite de l'IA ?

A ce stade, l'IA est MOCKEE : les scores sont generes par Math.random (server.js:514-545), aucun vrai modele de vision n'est appele. Le mock valide le flux de bout en bout et le contrat d'API (le diagnostic retourne deja un niveau de confiance : ok, a_confirmer, non_concluant). En cible (OpenRouter, LLM vision reel), le modele signalera explicitement son incertitude et persistera modele_ia/latence_ms. Dans tous les cas, le praticien est forme a interpreter ces niveaux et conserve le dernier mot : l'IA est un outil d'aide cosmetique, pas un substitut au jugement professionnel ni un diagnostic medical.

### Comment scaler a 100 salons ?

L'architecture est deja multi-tenant : chaque boutique est isolee au niveau des donnees. Chaque miroir est autonome (offline-first) et ne sollicite le serveur que pour la synchronisation, ce qui limite intrinsequement la charge centrale. En cible, l'API Laravel stateless sera horizontalement scalable derriere un load balancer, et les taches lourdes (PDF, sync, IA) seront deportees vers des queues Redis (CIBLE roadmap) pour absorber les pics. Aujourd'hui, ces taches sont synchrones ou gerees par une file JSON locale poll a 30s ; le passage a Redis/Horizon est precisement le levier de scalabilite identifie pour ce palier.

### Pourquoi pas une application mobile ?

Le miroir est un outil professionnel fixe dans un salon, pas un gadget personnel. L'experience kiosque guidee (ecran par ecran, gros boutons tactiles) est concue pour etre utilisee par le praticien pendant le service, avec le client assis face au miroir. Une application mobile s'integrerait mal au pipeline microscope (socket WiFi/TCP vers 192.168.34.1:8080 + transcodage ffmpeg local), ne controle pas l'environnement d'affichage, et ne garantit pas le mode kiosque securise.

### Le RGPD est-il vraiment respecte ?

Le RGPD est respecte sur plusieurs points DEJA en place, et il reste des exigences a tenir avant la mise en production. En place et verifiable : le consentement explicite avant chaque seance (article 7), verrouille en base par la FK consentement_id NOT NULL et refuse cote serveur (server.js:166-177) ; la retention limitee a 30 jours (minimisation, cleanupExpiredPhotos) ; l'absence de tracking et de cookies tiers ; et desormais le chiffrement AU REPOS des photos sur le device (AES-256-GCM applicatif via cryptoVault, ecriture .jpg.enc dans sync.service.ts), de la file de synchronisation et des tokens. Ce qui reste a tenir : la securisation du backend mock (PDF de seance sans protection, secrets en dur, device_token non hache), pgcrypto sur les colonnes sensibles, le chiffrement en transit (TLS), l'anonymisation/effacement et l'encadrement du transfert hors UE (OpenRouter cible : Zero Data Retention, EU in-region, SCC). Je presente donc la conformite comme une trajectoire maitrisee, avec le chiffrement au repos du device deja acquis, pas comme un acquis total.

### Que faire si l'IA se trompe ?

Le praticien a toujours le dernier mot. L'IA ne pose pas de diagnostic medical, elle fournit une analyse cosmetique avec un niveau de confiance explicite. Si le resultat est marque "a_confirmer" ou "non_concluant", le praticien ajuste ou ignore la suggestion. Le rapport final reflete la decision du praticien, pas celle de l'IA seule.

### Pourquoi ne pas utiliser ChatGPT directement ?

D'abord, rappel d'honnetete : l'IA est aujourd'hui mockee (Math.random, server.js:514-545) ; ces raisons motivent le choix de la CIBLE OpenRouter plutot qu'un appel direct a ChatGPT. Premierement, la confidentialite : les photos de cuir chevelu sont potentiellement sensibles ; les envoyer a une API grand public hors UE poserait un probleme RGPD (transfert hors UE a encadrer : Zero Data Retention, EU in-region, SCC). Deuxiemement, la specialisation : les prompts seront optimises pour l'analyse cosmetique capillaire. Troisiemement, la resilience : OpenRouter permet une strategie multi-modeles avec fallback (par exemple Gemini Flash en defaut, puis GPT-4o mini, puis Claude 3.5 Haiku) garantissant la disponibilite si un fournisseur est en panne. Ce fallback est une cible d'architecture, pas une fonctionnalite deja codee.

### Comment gerez-vous la concurrence sur le marche ?

Le marche n'est pas vide : il faut le dire clairement, il existe des concurrents identifies. Sur l'analyse capillaire/cuir chevelu professionnelle, on trouve par exemple K-Scan, FotoFinder, ARAMO (analyseurs capillaires de salon/clinique), et sur le miroir connecte beaute, des acteurs comme BECON/Samsung, CareOS ou HiMirror. Notre differenciation n'est donc pas un "first-mover" illusoire mais l'integration verticale : un outil professionnel B2B salon, a cout maitrise, combinant capture microscope WiFi, diagnostic cosmetique (IA en cible), CRM/synchronisation offline-first et conformite RGPD pensee des la conception, specifiquement pour les salons K-Beauty. Le positionnement vise le creneau intermediaire entre l'application mobile grand public (sans microscope ni CRM) et le dispositif medical/clinique haut de gamme.

### Quel est le modele economique ?

SaaS B2B par boutique : abonnement mensuel couvrant le miroir (hardware + logiciel), le CRM multi-tenant, et le service IA. Le cout est previsible pour le salon, et le modele recurrent assure la perennite du service. Des options additionnelles (synchronisation Shopify, workflows n8n personnalises, analytics avancees) constituent des leviers d'upsell. Note d'honnetete : Shopify et n8n sont des cibles roadmap, pas des integrations deja livrees.

---

## 7. Banque de reponses honnetes (REALISE vs CIBLE)

Reponses pre-redigees, opposables a un jury qui lit le code. Chaque reponse distingue ce qui est REALISE et verifiable de ce qui est CIBLE roadmap.

### Votre IA fonctionne-t-elle reellement ?

Non, elle est mockee aujourd'hui (server.js:514-545, scores Math.random). OpenRouter est la cible roadmap. Le mock suffit a valider le flux de bout en bout et le contrat d'API ; brancher un vrai LLM vision est un job asynchrone identifie.

### Le microscope est-il en USB ?

Non, il est en WiFi/TCP (192.168.34.1:8080, protocole JHCMD) : le flux H.264 est transcode par ffmpeg en MJPEG servi sur localhost:9100 (proxy.js). La doc qui disait USB/UVC etait une erreur que j'ai corrigee ; il subsiste des vestiges UVC/V4L2 morts dans le repo, sans effet sur le pipeline reel.

### Avez-vous des queues Redis ?

Pas encore. La file actuelle est un simple fichier JSON poll a 30s (sync.service.ts). Je sais exactement quels 8 jobs y migreront (PDF, QR, push CRM, IA, sync catch-up, upload photos, notifications, purge RGPD) et pourquoi : chacun a un point de douleur synchrone ou fragile dans le code. Redis arrivera avec Laravel.

### Les photos de cuir chevelu sont-elles chiffrees ?

Oui, au repos sur le device : sync.service.ts (savePhotoLocally) ecrit un .jpg.enc chiffre AES-256-GCM via cryptoVault (crypto-vault.service.ts), la file de sync est chiffree, et la photo n'est dechiffree qu'avant le push CRM (crm-sync.service.ts, pushPhotoCrm). La cle maitre vient de systemd-creds (liee au TPM) en prod, avec THROW explicite sans cle. Un test dedie prouve que le JPEG sur disque ne commence pas par FF D8. Reste a faire : securiser le backend mock, pgcrypto en base, object storage chiffre et HDS (donnee potentiellement de sante, art. 9).

### Combien de tests ?

42 tests unitaires Vitest et 136 cas e2e Playwright, soit 178 cas, et non 65. Le nouveau crypto-vault.service.test.ts (7 tests) verrouille le chiffrement (JPEG sur disque sans FF D8, store sans token en clair). Le service crm-sync.service.ts (372 lignes) est encore a 0 test : c'est le plus gros trou que je renforce en BC04, avec l'audit deps CI a rendre bloquant.

### Tournez-vous Laravel ?

Non, le backend realise est un mock Express + PostgreSQL 15 (server.js, docker-compose), sans composer.json ni artisan. Laravel 13/PHP 8.4 est la cible roadmap. J'ai fige le contrat d'API avec le mock pour pouvoir basculer en strangler-fig endpoint par endpoint, sans big-bang.

### Le sandbox Electron et la CSP sont-ils en place ?

Oui : sandbox:true (index.ts:51) et CSP appliquee en production (index.ts:121-143, garde if !is.dev). La CI GitHub Actions (ci.yml), l'ESLint flat config et la playwright.config existent aussi. Certains de mes anciens livrables les listaient encore comme gaps : c'est corrige.

### La regle RGPD du consentement est-elle verrouillee ?

Oui, cote schema (init.sql, FK consentement_id NOT NULL) et cote serveur (server.js:166-177 refuse une seance sans consentement valide). Je la verrouille en plus par un test d'integration backend dont la mutation (retirer le garde-fou) ferait passer un test au rouge.

### Vos donnees IA sortent-elles de l'UE ?

En cible, oui : OpenRouter peut router vers des fournisseurs US. C'est un transfert hors UE d'une donnee potentiellement sensible, que j'encadre (Zero Data Retention, routage EU in-region, garanties contractuelles/SCC) ou que je minimise (recadrage, transmission de features plutot que l'image brute). Si les photos sont qualifiees donnees de sante, un hebergement certifie HDS UE/EEE est requis.

### Avez-vous des concurrents ?

Oui, le marche n'est pas vide. En analyse capillaire professionnelle : K-Scan, FotoFinder, ARAMO. En miroir connecte beaute : BECON/Samsung, CareOS, HiMirror. Je ne revendique aucun "first-mover" ; ma differenciation est l'integration verticale (capture microscope WiFi, diagnostic cosmetique en cible, CRM offline-first, RGPD by design) pour le creneau B2B salon K-Beauty a cout maitrise.
