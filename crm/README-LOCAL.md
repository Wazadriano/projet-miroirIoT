# CRM KBeauty — exécution locale (intégré au projet Smart Mirror)

Ce dossier `crm/` est une **copie vendue** du CRM KBeauty (Laravel 13 / PHP 8.4 /
PostgreSQL 16 / Redis 7 / React 19), le système central vers lequel le miroir
synchronise ses données (endpoints `/api/miroir/*`). Il est embarqué ici pour qu'on
puisse **le faire tourner à la demande** en local et y brancher le device.

> La `docker-compose.yml` d'origine est orientée production (Traefik + domaines
> `*.a3n.fr`). On ne la modifie pas : l'override **`docker-compose.local.yml`** publie
> les ports en `localhost` et réécrit les URLs. Le `.env` (secrets) est généré et
> **gitignoré** — il n'est jamais commité.

## Lancer

```bash
# 1. Démarrer le daemon Docker (demande le mot de passe sudo)
sudo systemctl start docker

# 2. Tout monter + câbler le device automatiquement
cd crm
./run-local.sh            # 1er lancement : build + migrate + seed + provisioning
./run-local.sh --fresh    # repartir d'une base vierge
```

Le script, de façon idempotente :
1. crée le réseau `admin_proxy` (attendu par la compose),
2. build et démarre toute la stack,
3. installe les dépendances PHP (`composer install`),
4. applique les migrations et le seed (données de démo, seedé seulement si la base est vide),
5. détecte le **MAC du device** (exactement comme l'app le calcule) et provisionne un
   miroir CRM aligné dessus avec un token connu,
6. écrit `CRM_BASE_URL` et `CRM_TOKEN` dans `smart-mirror/.env`,
7. teste `POST /api/miroir/auth` de bout en bout.

## Accès

| Service      | URL locale                       |
| ------------ | -------------------------------- |
| API (device) | http://localhost:8000/api        |
| Dashboard    | http://localhost:3000            |
| IA service   | http://localhost:3002            |
| PostgreSQL   | localhost:**5433** (5432 dans le conteneur) |

Compte dashboard de démo : `admin@kbeauty.fr` / `password`.

## Brancher le miroir

Une fois `run-local.sh` passé au vert, `smart-mirror/.env` pointe sur le CRM local.
Lancer le device :

```bash
cd smart-mirror/mirror-app
npm run dev
```

Au démarrage il appelle `/api/miroir/auth`, passe **en ligne**, et `syncAll()`
pousse clientes / consentements / séances + photos (déchiffrées avant upload).

## Arrêter

```bash
cd crm
./stop-local.sh        # conserve les données
./stop-local.sh -v     # efface aussi la base et redis
```

## Passer au vrai CRM distant

Remplacer dans `smart-mirror/.env` :

```
CRM_BASE_URL=https://api-kbeauty.a3n.fr/api
CRM_TOKEN=<token device émis par l'admin du CRM>
```

Le `token_device` doit correspondre à un miroir enregistré côté CRM (table `miroirs`,
couple `adresse_mac` + `token_device`).
