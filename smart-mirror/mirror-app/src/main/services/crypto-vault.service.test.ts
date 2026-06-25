import { describe, it, expect } from 'vitest'
import { CryptoVault, cryptoVault } from './crypto-vault.service'

describe('CryptoVault', () => {
  it('round-trip sur un buffer (photo)', () => {
    const data = Buffer.from('donnees-binaires-photo-cuir-chevelu')
    const enc = cryptoVault.encryptBuffer(data)
    expect(enc.equals(data)).toBe(false)
    expect(cryptoVault.decryptBuffer(enc).equals(data)).toBe(true)
  })

  it('round-trip sur une chaine (token)', () => {
    const secret = 'crm-bearer-token-abcdef0123456789'
    const enc = cryptoVault.encryptString(secret)
    expect(enc).not.toContain(secret)
    expect(cryptoVault.decryptString(enc)).toBe(secret)
  })

  it('le chiffre ne commence pas par les magic bytes JPEG et est reconnu chiffre', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x01, 0x02, 0x03])
    const enc = cryptoVault.encryptBuffer(jpeg)
    expect(enc[0]).not.toBe(0xff)
    expect(cryptoVault.isEncrypted(enc)).toBe(true)
    expect(cryptoVault.isEncrypted(jpeg)).toBe(false)
  })

  it('IV unique entre deux chiffrements du meme clair', () => {
    const data = Buffer.from('valeur-constante')
    const a = cryptoVault.encryptBuffer(data)
    const b = cryptoVault.encryptBuffer(data)
    expect(a.equals(b)).toBe(false)
  })

  it('rejette un tag d authentification altere', () => {
    const enc = cryptoVault.encryptBuffer(Buffer.from('integrite'))
    enc[enc.length - 1] ^= 0xff
    expect(() => cryptoVault.decryptBuffer(enc)).toThrow()
  })

  it('rejette un payload de version inconnue', () => {
    const enc = cryptoVault.encryptBuffer(Buffer.from('x'))
    enc[0] = 0x99
    expect(() => cryptoVault.decryptBuffer(enc)).toThrow(/version/)
  })

  it('refuse de fonctionner en production sans cle maitre', () => {
    const savedKey = process.env.SMART_MIRROR_MASTER_KEY
    delete process.env.SMART_MIRROR_MASTER_KEY
    process.env.SMART_MIRROR_PROD = '1'
    try {
      const vault = new CryptoVault()
      expect(vault.isEnabled()).toBe(false)
      expect(() => vault.encryptString('x')).toThrow(/cle maitre/i)
    } finally {
      process.env.SMART_MIRROR_MASTER_KEY = savedKey
      delete process.env.SMART_MIRROR_PROD
    }
  })
})
