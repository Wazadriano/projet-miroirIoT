# Runbook - Chiffrement des donnees sensibles (Smart Mirror)

> Pièce de maintenance et de conformité (RNCP 37046, BC04/BC05). Décrit ce qui est
> chiffré, la gestion de la clé maître, la rotation, la rétention RGPD et la migration.
> Source de vérité du code : `smart-mirror/mirror-app/src/main/services/crypto-vault.service.ts`.

## 1. Ce qui est chiffré au repos (RÉALISÉ)

| Donnée | Où | Mécanisme |
|--------|----|-----------|
| Photos de cuir chevelu | `/var/smart-mirror/photos/*.jpg.enc` | AES-256-GCM (`sync.service.ts` → `savePhotoLocally`) |
| File de synchronisation | `/var/smart-mirror/sync-queue.json` | AES-256-GCM (`sync.service.ts` → `saveQueue`) |
| Token device | `electron-store` (`config.service.ts`) | AES-256-GCM via `cryptoVault` |
| Token CRM + bearer | `electron-store` (`config.service.ts`) | AES-256-GCM via `cryptoVault` |

Format du conteneur chiffré : `[version 1o || IV 12o || authTag 16o || ciphertext]`.
GCM fournit la confidentialité ET l'intégrité (toute altération est rejetée au déchiffrement).
Lecture rétrocompatible : un JPEG (`FF D8`) ou un JSON (`[`) hérité en clair est détecté
et lu tel quel, ce qui permet une migration sans perte.

## 2. Clé maître (256 bits) - résolution par priorité

`crypto-vault.service.ts` résout la clé dans cet ordre (`resolveMasterKey`) :

1. `SMART_MIRROR_MASTER_KEY` (base64 de 32 octets) - override explicite (tests, CI, dépannage).
2. `CREDENTIALS_DIRECTORY/smart-mirror-master-key` - **production Pi**, via systemd
   `LoadCredentialEncrypted` (secret lié au TPM2 / à l'installation, jamais en clair sur la
   partition data). **Méthode recommandée en production.**
3. `MASTER_KEY_FILE` - keyfile administré, fichier root `0600` hors du répertoire applicatif.
4. Fallback développement uniquement : clé locale générée dans `~/.smart-mirror/dev-master.key`
   (avertissement explicite). **Inatteignable en production** : si `NODE_ENV=production` (ou
   `SMART_MIRROR_PROD=1`) et qu'aucune clé n'est fournie, le module **lève une erreur** plutôt
   que de stocker en clair.

### Générer une clé

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Provisionner sur le Pi (systemd-creds, recommandé)

```bash
# Chiffre la clé pour ce hôte (liée TPM si disponible)
systemd-creds encrypt --name=smart-mirror-master-key cle.b64 /etc/credstore.encrypted/smart-mirror-master-key
# Dans l'unité systemd du service :
#   LoadCredentialEncrypted=smart-mirror-master-key
# L'app lit alors $CREDENTIALS_DIRECTORY/smart-mirror-master-key
```

## 3. Rotation de clé

1. Générer une nouvelle clé.
2. Pour chaque donnée chiffrée : déchiffrer avec l'ancienne clé, re-chiffrer avec la nouvelle
   (photos `.jpg.enc`, `sync-queue.json`, secrets `electron-store`).
3. Remplacer la clé provisionnée (systemd-creds / keyfile), redémarrer le service.
4. Détruire l'ancienne clé. Note : la destruction de clé permet le **crypto-shredding**
   (effacement par perte de clé), utile pour le droit à l'effacement (art. 17 RGPD).

## 4. Défense en profondeur - chiffrement de volume (LUKS2)

Le chiffrement applicatif est complété par un chiffrement de la partition data du Pi
(dm-crypt/LUKS2, AES matériel sur Pi 5) contre le vol/la perte de l'appareil en boutique.

```bash
cryptsetup luksFormat /dev/<partition-data>
cryptsetup open /dev/<partition-data> smartmirror-data
mkfs.ext4 /dev/mapper/smartmirror-data   # montée sur /var/smart-mirror
```

Déverrouillage au boot : clé liée au TPM (`clevis`/`systemd-cryptenroll`) ou keyfile protégé.

## 5. Rétention RGPD

- Photos supprimées localement au-delà de 30 jours et hors file de sync
  (`sync.service.ts` → `cleanupExpiredPhotos`, `PHOTO_RETENTION_DAYS`).
- Consentement obligatoire et horodaté avant toute capture (verrou schéma + serveur).
- Donnée potentiellement de santé (art. 9 RGPD) : chiffrement au repos + en transit attendu
  (art. 32). Transfert vers l'IA (OpenRouter, cible) hors UE à encadrer (ZDR, EU in-region, SCC)
  ou à minimiser (recadrage / features au lieu de l'image brute).

## 6. Reste à faire (EN COURS / CIBLE)

- Backend mock : protéger l'accès au PDF de séance, hacher `device_token`, sortir les secrets
  du dépôt (fait pour le mot de passe PostgreSQL via `.env`).
- `pgcrypto` sur les colonnes sensibles côté base (arbitrage unicité email à trancher).
- Hébergement HDS UE/EEE si les données sont qualifiées données de santé.
- Upgrade Electron (advisories CVE) dans le cadre de la veille (cf. `SECURITE-CVE-ET-LANCEMENT.md`).
