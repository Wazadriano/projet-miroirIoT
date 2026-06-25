import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync } from 'fs'
import { homedir } from 'os'
import { join, dirname } from 'path'

// Chiffrement applicatif AES-256-GCM des donnees sensibles au repos (photos de
// cuir chevelu, tokens). On n'utilise PAS safeStorage comme barriere unique : sur
// un Pi 5 en mode kiosk headless, safeStorage retombe sur le backend basic_text
// (cle codee en dur), soit de l'obfuscation, pas du chiffrement. Un module crypto
// natif Node est independant du trousseau/D-Bus, donc fiable sans session de bureau,
// authentifie (tag GCM = detection d'alteration) et utilisable sur les buffers JPEG.
//
// Format de sortie : [version 1o || IV 12o || authTag 16o || ciphertext].

const ALGO = 'aes-256-gcm'
const VERSION = 0x01
const IV_LEN = 12
const TAG_LEN = 16
const KEY_LEN = 32

export class CryptoVault {
  private key: Buffer | null = null

  // La cle est resolue paresseusement au premier usage : on ne veut pas faire
  // echouer le boot de l'app si la cle est temporairement indisponible.
  private getKey(): Buffer {
    if (!this.key) this.key = this.resolveMasterKey()
    return this.key
  }

  // Resolution par ordre de priorite. POURQUOI cet ordre : l'override explicite
  // (env) prime pour les tests/CI, puis la source de prod (systemd-creds liee au
  // TPM), puis un keyfile administre ; le fallback dev n'existe JAMAIS en prod.
  private resolveMasterKey(): Buffer {
    const fromEnv = process.env.SMART_MIRROR_MASTER_KEY
    if (fromEnv) {
      const k = Buffer.from(fromEnv, 'base64')
      if (k.length !== KEY_LEN) {
        throw new Error(`[CryptoVault] SMART_MIRROR_MASTER_KEY doit encoder ${KEY_LEN} octets en base64`)
      }
      return k
    }

    // Prod Pi : systemd LoadCredentialEncrypted expose le secret dechiffre ici.
    const credDir = process.env.CREDENTIALS_DIRECTORY
    if (credDir) {
      const credPath = join(credDir, 'smart-mirror-master-key')
      if (existsSync(credPath)) return this.readKeyFile(credPath)
    }

    // Keyfile administre (fichier root 0600 hors du repertoire applicatif).
    const keyFile = process.env.MASTER_KEY_FILE
    if (keyFile && existsSync(keyFile)) return this.readKeyFile(keyFile)

    // En production, l'absence de cle est une erreur : on refuse plutot que de
    // degrader silencieusement vers du stockage en clair.
    if (process.env.NODE_ENV === 'production' || process.env.SMART_MIRROR_PROD === '1') {
      throw new Error('[CryptoVault] Aucune cle maitre en production : systemd-creds ou MASTER_KEY_FILE requis')
    }

    return this.getOrCreateDevKey()
  }

  private readKeyFile(path: string): Buffer {
    const raw = readFileSync(path)
    if (raw.length === KEY_LEN) return raw
    const text = raw.toString('utf-8').trim()
    const b64 = Buffer.from(text, 'base64')
    if (b64.length === KEY_LEN) return b64
    const hex = Buffer.from(text, 'hex')
    if (hex.length === KEY_LEN) return hex
    throw new Error(`[CryptoVault] Keyfile ${path} invalide : ${KEY_LEN} octets attendus`)
  }

  // Fallback developpement uniquement : cle locale persistee 0600. Avertissement
  // explicite (pas de degrade silencieux). En prod, cette branche est inatteignable.
  private getOrCreateDevKey(): Buffer {
    const devPath = join(homedir(), '.smart-mirror', 'dev-master.key')
    try {
      if (existsSync(devPath)) return this.readKeyFile(devPath)
      const k = randomBytes(KEY_LEN)
      mkdirSync(dirname(devPath), { recursive: true })
      writeFileSync(devPath, k, { mode: 0o600 })
      try {
        chmodSync(devPath, 0o600)
      } catch {
        // FS non-POSIX : permissions ignorees, acceptable en dev.
      }
      console.warn('[CryptoVault] Cle de DEVELOPPEMENT generee (~/.smart-mirror/dev-master.key). Ne pas utiliser en production : fournir une cle via systemd-creds.')
      return k
    } catch {
      // Environnement sans FS persistant (tests sans env de cle) : cle ephemere.
      console.warn('[CryptoVault] Cle ephemere en memoire (pas de FS persistant).')
      return randomBytes(KEY_LEN)
    }
  }

  isEnabled(): boolean {
    try {
      this.getKey()
      return true
    } catch {
      return false
    }
  }

  encryptBuffer(plain: Buffer): Buffer {
    const iv = randomBytes(IV_LEN)
    const cipher = createCipheriv(ALGO, this.getKey(), iv)
    const enc = Buffer.concat([cipher.update(plain), cipher.final()])
    const tag = cipher.getAuthTag()
    return Buffer.concat([Buffer.from([VERSION]), iv, tag, enc])
  }

  decryptBuffer(payload: Buffer): Buffer {
    if (payload.length < 1 + IV_LEN + TAG_LEN) {
      throw new Error('[CryptoVault] payload chiffre trop court')
    }
    if (payload[0] !== VERSION) {
      throw new Error(`[CryptoVault] version de format inconnue : ${payload[0]}`)
    }
    const iv = payload.subarray(1, 1 + IV_LEN)
    const tag = payload.subarray(1 + IV_LEN, 1 + IV_LEN + TAG_LEN)
    const enc = payload.subarray(1 + IV_LEN + TAG_LEN)
    const decipher = createDecipheriv(ALGO, this.getKey(), iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(enc), decipher.final()])
  }

  encryptString(plain: string): string {
    return this.encryptBuffer(Buffer.from(plain, 'utf-8')).toString('base64')
  }

  decryptString(payloadB64: string): string {
    return this.decryptBuffer(Buffer.from(payloadB64, 'base64')).toString('utf-8')
  }

  // Permet une migration sans perte : un JPEG en clair (FF D8) ou un JSON ('[')
  // ne commencent pas par notre octet de version, donc sont reconnus non chiffres.
  isEncrypted(payload: Buffer): boolean {
    return payload.length >= 1 + IV_LEN + TAG_LEN && payload[0] === VERSION
  }
}

export const cryptoVault = new CryptoVault()
