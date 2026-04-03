# DreamTech Smart Mirror -- Preparation Soutenance Jury

Document de preparation aux questions du jury. Chaque reponse est directe, argumentee techniquement, et formulee en 2 a 4 phrases.

---

## 1. Choix d'Architecture

### Pourquoi Electron et pas une webapp ?

Le miroir doit acceder a un microscope USB (protocole UVC/V4L2), ce qui est impossible depuis un navigateur web standard. Electron permet egalement le mode kiosque natif (plein ecran sans barre d'adresse), le stockage securise des tokens via safeStorage (keychain OS), et le fonctionnement offline-first avec persistance locale. Une webapp necessite un navigateur ouvert, une connexion permanente, et n'a pas acces aux peripheriques USB.

### Pourquoi React et pas Vue ou Angular ?

React 19 offre l'ecosysteme le plus mature pour Electron via electron-vite, avec un hot-reload fiable et une compatibilite native. Zustand (state management choisi) est concu specifiquement pour React. L'equipe avait deja une experience React, ce qui a reduit le temps de montee en competence sur un projet au calendrier serre.

### Pourquoi Zustand et pas Redux ?

Le flux de l'application est lineaire (ecran par ecran, une seule seance active a la fois). Redux impose un boilerplate considerable (actions, reducers, middleware) injustifie pour un state aussi simple. Zustand offre un store minimaliste, sans boilerplate, avec une API directe qui correspond exactement au pattern single-session du miroir.

### Pourquoi TypeScript ?

Le projet comprend quatre composants (Electron, mock-API, proxy microscope, service IA) qui partagent des interfaces de donnees (clients, seances, diagnostics). TypeScript garantit la coherence des types aux frontieres entre composants et detecte les erreurs de contrat a la compilation, pas en production. Sur un projet multi-brique, le type safety n'est pas optionnel.

### Pourquoi Laravel et pas Node.js/Express pour le backend ?

Laravel fournit nativement tout ce dont le CRM a besoin : Eloquent (ORM avec relations complexes multi-tenant), Sanctum (authentification par tokens revocables), DomPDF (generation PDF cote serveur), queues Redis, et un systeme de migrations robuste. Construire ces fonctionnalites from scratch en Express aurait represente des semaines de developpement supplementaires sans valeur ajoutee.

### Pourquoi PostgreSQL et pas MySQL ?

PostgreSQL supporte nativement les UUID (type uuid, generation uuid_generate_v4), indispensables pour la synchronisation offline sans collision d'identifiants. Le type JSONB permet de stocker les diagnostics IA a structure variable avec indexation et requetes. La fonction unaccent() simplifie la recherche client tolerante aux accents. MySQL ne propose aucune de ces fonctionnalites nativement.

### Pourquoi Redis ?

Redis remplit trois roles : backing store pour les queues Laravel (generation PDF asynchrone, synchronisation), cache applicatif (configurations boutique, sessions), et backend pour Laravel Reverb (WebSocket temps reel). Un seul service couvre trois besoins au lieu de trois outils separes.

### Pourquoi pas Firebase ou Supabase ?

L'architecture multi-tenant avec isolation par boutique est complexe a implementer sur Firebase/Supabase (Row Level Security limitee, pas de controle fin des policies). La generation PDF cote serveur via DomPDF necessite un backend PHP. L'integration N8N pour les workflows asynchrones requiert un backend auto-heberge. Enfin, les photos medicales/cosmetiques sensibles imposent un controle total sur l'hebergement des donnees.

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

La structure du diagnostic varie selon le modele IA utilise (Llama, Phi, GPT-4o mini), le nombre de zones capturees, et les recommandations generees. Un schema relationnel rigide obligerait a modifier la base a chaque evolution du prompt IA. JSONB permet de stocker une structure flexible tout en offrant l'indexation et les requetes SQL sur les champs specifiques.

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

### Pourquoi le TDD avec 65+ tests ?

Les tests ont deja prouve leur valeur concrete : lors de la migration mock-API vers CRM reel, les 65+ tests (Vitest + Playwright) ont detecte des regressions que l'inspection visuelle aurait manquees. Sur un projet a quatre composants, les tests sont le filet de securite qui permet de refactorer et evoluer sans casser l'existant.

### Pourquoi un microscope USB et pas la camera d'un telephone ?

L'analyse capillaire necessite un grossissement x50 a x200 pour observer la structure du cuir chevelu et des follicules. La camera d'un telephone offre au mieux un zoom numerique qui degrade la resolution. Le microscope Ninyoon 4K fournit un grossissement optique reel en 4K, indispensable pour que l'IA produise un diagnostic exploitable.

### Pourquoi MJPEG et pas WebRTC ?

Le flux microscopique circule exclusivement en local (localhost:9100), entre le proxy et l'application Electron sur la meme machine. WebRTC est concu pour la communication pair-a-pair sur Internet avec signaling, ICE, STUN/TURN -- une complexite inutile pour du localhost. MJPEG est une succession d'images JPEG sur HTTP, trivial a implementer et a consommer dans un tag img.

### Pourquoi N8N pour les workflows ?

N8N decouple les traitements asynchrones (generation PDF, envoi d'email, notifications) du code applicatif. Ajouter un nouveau workflow (ex: notification SMS, alerte stock produit) se fait visuellement dans N8N sans deployer une nouvelle version du backend. Cette separation reduit le risque de regression et accelere les evolutions post-MVP.

### Pourquoi une mock API separee du backend ?

La mock API a permis a l'equipe frontend de developper les 9 ecrans sans attendre que le backend Laravel soit pret. Les contrats d'API (endpoints, formats de reponse) ont ete definis en amont, puis la mock API a ete remplacee par le vrai backend sans modifier le code frontend. Ce decoupage a permis un developpement parallele et a reduit le chemin critique.

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

### Pourquoi Electron safeStorage ?

safeStorage utilise le keychain natif du systeme d'exploitation (libsecret sur Linux, Keychain sur macOS) pour chiffrer les donnees sensibles. Le token d'authentification n'est jamais stocke en clair sur le disque. Meme si le disque du miroir est compromis physiquement, le token reste chiffre par une cle geree par l'OS.

### Pourquoi Sanctum et pas JWT ?

Sanctum est natif a Laravel, sans dependance externe. Les tokens Sanctum sont stockes en base de donnees et revocables instantanement : si un miroir est vole, son token est desactive en une requete. Les JWT sont irrevocables par nature (valides jusqu'a expiration), ce qui est un risque de securite inacceptable pour un dispositif physique deploye en salon.

### Comment les photos sensibles sont-elles protegees ?

Les photos du cuir chevelu sont chiffrees localement via safeStorage, transmises exclusivement en TLS (HTTPS) vers le serveur, stockees avec acces restreint par tenant cote serveur, et automatiquement supprimees apres 30 jours. L'API d'anonymisation permet une suppression sur demande. A aucun moment les photos ne transitent en clair sur un reseau non securise.

---

## 6. Questions Pieges

### Le WiFi tombe pendant une seance -- que se passe-t-il ?

Rien ne change pour l'utilisateur. Toutes les ecritures vont dans le backend local qui tourne sur le device -- pas de dependance reseau. Les photos sont sauvegardees localement, le diagnostic IA est disponible si le service IA tourne en local. Le CrmSyncService detecte la perte de connexion et met la sync en pause. Quand le WiFi revient, il reprend automatiquement : push des records non synces, verification, confirmation. Le praticien ne voit aucune interruption.

### Que se passe-t-il si le CRM distant est en panne ?

L'app continue de fonctionner normalement. Toutes les operations se font sur le backend local. Les donnees s'accumulent avec synced_to_crm = FALSE. Quand le CRM revient, le prochain cycle de sync (toutes les 60 secondes) pousse tout le backlog. Le pipeline est idempotent : si un push partiel a eu lieu, seuls les records non confirmes sont reessayes.

### Le microscope se deconnecte en pleine capture ?

La StatusBar en haut de l'ecran affiche en temps reel l'etat du microscope. En cas de deconnexion USB, un indicateur visuel alerte immediatement le praticien. Le proxy tente une reconnexion automatique. Les captures deja realisees sont conservees localement, la seance n'est pas perdue.

### Quelle est la fiabilite de l'IA ?

Le diagnostic IA retourne systematiquement un niveau de confiance (ok, a_confirmer, non_concluant). Lorsque le modele est incertain, il le signale explicitement. Le praticien est forme a interpreter ces niveaux et conserve toujours le dernier mot. L'IA est un outil d'aide, pas un substitut au jugement professionnel.

### Comment scaler a 100 salons ?

L'architecture est deja multi-tenant : chaque boutique est isolee au niveau des donnees. Chaque miroir est autonome (offline-first) et ne sollicite le serveur que pour la synchronisation. L'API est stateless et horizontalement scalable derriere un load balancer. Les taches lourdes (PDF, sync) sont gerees par des queues Redis, ce qui absorbe les pics de charge.

### Pourquoi pas une application mobile ?

Le miroir est un outil professionnel fixe dans un salon, pas un gadget personnel. L'experience kiosque guidee (ecran par ecran, gros boutons tactiles) est concue pour etre utilisee par le praticien pendant le service, avec le client assis face au miroir. Une application mobile ne peut pas acceder au microscope USB, ne controle pas l'environnement d'affichage, et ne garantit pas le mode kiosque securise.

### Le RGPD est-il vraiment respecte ?

Oui, par conception : consentement explicite avant chaque seance (article 7), retention limitee a 30 jours (minimisation), API d'anonymisation (droit a l'effacement), export des donnees (droit a la portabilite), chiffrement en transit et au repos, pas de tracking ni de cookies tiers, pas de partage de photos avec des tiers non declares. Chaque point est implementable et verifiable techniquement.

### Que faire si l'IA se trompe ?

Le praticien a toujours le dernier mot. L'IA ne pose pas de diagnostic medical, elle fournit une analyse cosmetique avec un niveau de confiance explicite. Si le resultat est marque "a_confirmer" ou "non_concluant", le praticien ajuste ou ignore la suggestion. Le rapport final reflete la decision du praticien, pas celle de l'IA seule.

### Pourquoi ne pas utiliser ChatGPT directement ?

Trois raisons. Premierement, la confidentialite : les photos de cuir chevelu sont des donnees personnelles sensibles, les envoyer a l'API OpenAI grand public pose un probleme RGPD. Deuxiemement, la specialisation : nos prompts sont optimises pour l'analyse cosmetique capillaire avec des modeles de vision specifiques. Troisiemement, la resilience : le fallback a trois modeles (Llama, Phi, GPT-4o mini) garantit la disponibilite meme si un fournisseur est en panne.

### Comment gerez-vous la concurrence sur le marche ?

Le positionnement est B2B salon, pas grand public. Les solutions concurrentes sont soit des applications mobiles (pas de microscope, pas d'integration CRM), soit des dispositifs medicaux hors de prix. DreamTech se positionne sur le creneau intermediaire : un outil professionnel abordable avec CRM integre, IA cosmetique, et conformite RGPD native, specifiquement concu pour les salons K-Beauty.

### Quel est le modele economique ?

SaaS B2B par boutique : abonnement mensuel couvrant le miroir (hardware + logiciel), le CRM multi-tenant, et le service IA. Le cout est previsible pour le salon, et le modele recurrent assure la perennite du service. Des options additionnelles (synchronisation Shopify, workflows N8N personnalises, analytics avancees) constituent des leviers d'upsell.
