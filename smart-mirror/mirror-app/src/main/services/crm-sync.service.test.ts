import { describe, it, expect, beforeEach, vi } from 'vitest'

// fs est mocke : pushPhotoCrm lit le fichier local via readFileSync. On controle
// le contenu retourne par test pour simuler un .enc chiffre, un .jpg en clair, ou
// un fichier disparu.
vi.mock('fs', () => ({
  readFileSync: vi.fn()
}))

import { readFileSync } from 'fs'
import { CrmSyncService } from './crm-sync.service'
import { cryptoVault } from './crypto-vault.service'

// Doubles legers : on n'instancie pas ConfigService/ApiClientService reels (qui
// touchent electron-store et le reseau). On expose juste l'interface consommee
// par CrmSyncService.
function makeConfig(overrides: Record<string, unknown> = {}): any {
  return {
    getCrmBaseUrl: vi.fn(() => 'http://crm.test'),
    getCrmToken: vi.fn(() => 'device-token'),
    getCrmBearerToken: vi.fn(() => ''),
    setCrmBearerToken: vi.fn(),
    getMacAddress: vi.fn(() => 'AA:BB:CC:DD:EE:FF'),
    ...overrides
  }
}

function makeLocalApi(overrides: Record<string, unknown> = {}): any {
  return {
    getSyncPending: vi.fn(async () => ({
      clientes: [],
      consentements: [],
      seances: [],
      photos: []
    })),
    confirmSynced: vi.fn(async () => undefined),
    cleanupSynced: vi.fn(async () => undefined),
    ...overrides
  }
}

const JPEG_MAGIC = Buffer.from([0xff, 0xd8])

describe('CrmSyncService', () => {
  let config: any
  let localApi: any
  let crm: CrmSyncService

  beforeEach(() => {
    vi.clearAllMocks()
    config = makeConfig()
    localApi = makeLocalApi()
    crm = new CrmSyncService(config, localApi)
    vi.stubGlobal('fetch', vi.fn())
  })

  const okResponse = (body: unknown = {}): any => ({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body)
  })

  describe('syncAll - chemin nominal', () => {
    it('pousse clientes/consentements/seances et confirme les ids synces', async () => {
      localApi.getSyncPending.mockResolvedValue({
        clientes: [{ id: 'c1', prenom: 'Marie', nom: 'Dupont', email: 'm@test.com' }],
        consentements: [{ id: 'cons1', cliente_id: 'c1', texte_consent: 'oui' }],
        seances: [{ id: 's1', cliente_id: 'c1', consentement_id: 'cons1' }],
        photos: []
      })
      ;(fetch as any).mockResolvedValue(okResponse())

      const report = await crm.syncAll()

      expect(report.clientes.synced).toBe(1)
      expect(report.consentements.synced).toBe(1)
      expect(report.seances.synced).toBe(1)
      expect(report.errors).toHaveLength(0)

      // Chaque table confirmee avec ses ids
      expect(localApi.confirmSynced).toHaveBeenCalledWith('clientes', ['c1'])
      expect(localApi.confirmSynced).toHaveBeenCalledWith('consentements', ['cons1'])
      expect(localApi.confirmSynced).toHaveBeenCalledWith('seances', ['s1'])

      // POST clientes vers le bon endpoint CRM
      expect(fetch).toHaveBeenCalledWith(
        'http://crm.test/miroir/clientes',
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('ne synchronise rien si le CRM n est pas configure (pas d url)', async () => {
      config.getCrmBaseUrl.mockReturnValue('')
      const report = await crm.syncAll()
      expect(fetch).not.toHaveBeenCalled()
      expect(report.clientes.synced).toBe(0)
    })

    it('verrou de reentrance : un second syncAll concurrent retourne un rapport vide', async () => {
      // getSyncPending suspend le premier appel jusqu a ce qu on le libere
      let release: () => void = () => {}
      const gate = new Promise<void>((r) => { release = r })
      localApi.getSyncPending.mockImplementation(async () => {
        await gate
        return { clientes: [], consentements: [], seances: [], photos: [] }
      })

      const first = crm.syncAll()
      const second = await crm.syncAll() // syncing === true => sortie immediate
      expect(second.errors).toHaveLength(0)
      expect(localApi.getSyncPending).toHaveBeenCalledTimes(1)

      release()
      await first
    })
  })

  describe('pushPhotoCrm - dechiffrement avant envoi au CRM', () => {
    it('dechiffre un .jpg.enc et envoie un buffer commencant par les magic bytes JPEG', async () => {
      const clearJpeg = Buffer.concat([JPEG_MAGIC, Buffer.from([0xff, 0xe0, 0x10, 0x20, 0x30])])
      const encrypted = cryptoVault.encryptBuffer(clearJpeg)
      expect(cryptoVault.isEncrypted(encrypted)).toBe(true)
      ;(readFileSync as any).mockReturnValue(encrypted)

      localApi.getSyncPending.mockResolvedValue({
        clientes: [], consentements: [], seances: [],
        photos: [{ id: 'p1', seance_id: 's1', phase: 'avant', chemin_local: '/data/s1_avant.jpg.enc' }]
      })
      ;(fetch as any).mockResolvedValue(okResponse())

      const report = await crm.syncAll()
      expect(report.photos.synced).toBe(1)

      // Recupere le FormData envoye au CRM
      const photoCall = (fetch as any).mock.calls.find((c: any[]) =>
        String(c[0]).endsWith('/miroir/photos'))
      expect(photoCall).toBeDefined()
      const form = photoCall[1].body as FormData
      const blob = form.get('image') as Blob
      const sentBuffer = Buffer.from(await blob.arrayBuffer())

      // PREUVE du dechiffrement : le buffer envoye = JPEG en clair (FF D8 ...),
      // pas le payload chiffre (qui commence par l octet de version 0x01).
      expect(sentBuffer.subarray(0, 2).equals(JPEG_MAGIC)).toBe(true)
      expect(sentBuffer.equals(clearJpeg)).toBe(true)
      expect(encrypted[0]).toBe(0x01)

      expect(localApi.confirmSynced).toHaveBeenCalledWith('photos', ['p1'])
    })

    it('retire le suffixe .enc du nom de fichier distant', async () => {
      const encrypted = cryptoVault.encryptBuffer(Buffer.concat([JPEG_MAGIC, Buffer.from([1, 2, 3])]))
      ;(readFileSync as any).mockReturnValue(encrypted)
      localApi.getSyncPending.mockResolvedValue({
        clientes: [], consentements: [], seances: [],
        photos: [{ id: 'p1', seance_id: 's1', phase: 'avant', chemin_local: '/data/seance-s1_avant.jpg.enc' }]
      })
      ;(fetch as any).mockResolvedValue(okResponse())

      await crm.syncAll()

      const photoCall = (fetch as any).mock.calls.find((c: any[]) =>
        String(c[0]).endsWith('/miroir/photos'))
      const form = photoCall[1].body as FormData
      const blob = form.get('image') as any
      // Le nom du Blob (3e arg de append) ne doit plus porter .enc
      expect(blob.name).toBe('seance-s1_avant.jpg')
      expect(blob.name.endsWith('.enc')).toBe(false)
    })

    it('lit un fichier en clair (retrocompat, non chiffre) sans tenter de dechiffrer', async () => {
      const clearJpeg = Buffer.concat([JPEG_MAGIC, Buffer.from([0xff, 0xe0, 0xaa, 0xbb])])
      ;(readFileSync as any).mockReturnValue(clearJpeg)
      localApi.getSyncPending.mockResolvedValue({
        clientes: [], consentements: [], seances: [],
        photos: [{ id: 'p1', seance_id: 's1', phase: 'apres', chemin_local: '/data/old_clear.jpg' }]
      })
      ;(fetch as any).mockResolvedValue(okResponse())

      const report = await crm.syncAll()
      expect(report.photos.synced).toBe(1)

      const photoCall = (fetch as any).mock.calls.find((c: any[]) =>
        String(c[0]).endsWith('/miroir/photos'))
      const form = photoCall[1].body as FormData
      const blob = form.get('image') as any
      const sentBuffer = Buffer.from(await (blob as Blob).arrayBuffer())
      expect(sentBuffer.equals(clearJpeg)).toBe(true)
      expect(blob.name).toBe('old_clear.jpg')
    })

    it('envoie les champs metier attendus dans le FormData', async () => {
      const encrypted = cryptoVault.encryptBuffer(Buffer.concat([JPEG_MAGIC, Buffer.from([1])]))
      ;(readFileSync as any).mockReturnValue(encrypted)
      localApi.getSyncPending.mockResolvedValue({
        clientes: [], consentements: [], seances: [],
        photos: [{
          id: 'p1', seance_id: 's42', phase: 'avant', chemin_local: '/d/a.jpg.enc',
          diagnostic_ia: { score: 72 }, modele_ia: 'gemini', latence_ms: 350
        }]
      })
      ;(fetch as any).mockResolvedValue(okResponse())

      await crm.syncAll()

      const photoCall = (fetch as any).mock.calls.find((c: any[]) =>
        String(c[0]).endsWith('/miroir/photos'))
      const form = photoCall[1].body as FormData
      expect(form.get('seance_id')).toBe('s42')
      expect(form.get('phase')).toBe('avant')
      expect(form.get('zone')).toBe('cuir_chevelu')
      expect(form.get('diagnostic_ia')).toBe(JSON.stringify({ score: 72 }))
      expect(form.get('modele_ia')).toBe('gemini')
      expect(form.get('latence_ms')).toBe('350')
      // Header Authorization Bearer present
      expect(photoCall[1].headers.Authorization).toMatch(/^Bearer /)
    })

    it('si le fichier local a disparu, marque comme synced sans erreur ni upload', async () => {
      ;(readFileSync as any).mockImplementation(() => { throw new Error('ENOENT') })
      localApi.getSyncPending.mockResolvedValue({
        clientes: [], consentements: [], seances: [],
        photos: [{ id: 'p1', seance_id: 's1', phase: 'avant', chemin_local: '/gone.jpg.enc' }]
      })

      const report = await crm.syncAll()

      expect(report.photos.synced).toBe(1)
      expect(report.photos.failed).toBe(0)
      // Aucun POST photo n a ete tente
      const photoCall = (fetch as any).mock.calls.find((c: any[]) =>
        String(c[0]).endsWith('/miroir/photos'))
      expect(photoCall).toBeUndefined()
      expect(localApi.confirmSynced).toHaveBeenCalledWith('photos', ['p1'])
    })
  })

  describe('gestion d erreur upload photo', () => {
    it('compte un echec et remonte l erreur si le CRM rejette l upload (HTTP 500)', async () => {
      const encrypted = cryptoVault.encryptBuffer(Buffer.concat([JPEG_MAGIC, Buffer.from([1])]))
      ;(readFileSync as any).mockReturnValue(encrypted)
      localApi.getSyncPending.mockResolvedValue({
        clientes: [], consentements: [], seances: [],
        photos: [{ id: 'p1', seance_id: 's1', phase: 'avant', chemin_local: '/d/a.jpg.enc' }]
      })
      ;(fetch as any).mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) })

      const report = await crm.syncAll()

      expect(report.photos.synced).toBe(0)
      expect(report.photos.failed).toBe(1)
      expect(report.errors.some((e) => e.includes('photo p1'))).toBe(true)
      expect(report.errors.some((e) => e.includes('500'))).toBe(true)
      // Pas de confirmation de sync pour une photo en echec
      expect(localApi.confirmSynced).not.toHaveBeenCalledWith('photos', ['p1'])
    })

    it('une erreur reseau pendant le push d une table est captee dans report.errors', async () => {
      localApi.getSyncPending.mockResolvedValue({
        clientes: [{ id: 'c1', prenom: 'X', nom: 'Y' }],
        consentements: [], seances: [], photos: []
      })
      ;(fetch as any).mockRejectedValue(new Error('network down'))

      const report = await crm.syncAll()

      expect(report.clientes.synced).toBe(0)
      expect(report.clientes.failed).toBe(1)
      expect(report.errors.some((e) => e.includes('network down'))).toBe(true)
      // La table n est pas confirmee
      expect(localApi.confirmSynced).not.toHaveBeenCalledWith('clientes', ['c1'])
    })
  })

  describe('authenticate', () => {
    it('echange MAC + device_token contre un Bearer et le persiste', async () => {
      ;(fetch as any).mockResolvedValue(okResponse({ token: 'bearer-xyz', miroir: { nom: 'M1' } }))

      const ok = await crm.authenticate()

      expect(ok).toBe(true)
      expect(crm.bearerToken).toBe('bearer-xyz')
      expect(config.setCrmBearerToken).toHaveBeenCalledWith('bearer-xyz')
      expect(fetch).toHaveBeenCalledWith(
        'http://crm.test/miroir/auth',
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('retourne false sur reponse non-ok', async () => {
      ;(fetch as any).mockResolvedValue({ ok: false, status: 401, json: () => Promise.resolve({}) })
      expect(await crm.authenticate()).toBe(false)
      expect(config.setCrmBearerToken).not.toHaveBeenCalled()
    })

    it('retourne false si fetch jette (reseau)', async () => {
      ;(fetch as any).mockRejectedValue(new Error('timeout'))
      expect(await crm.authenticate()).toBe(false)
    })
  })

  describe('checkOnline', () => {
    it('passe online si le heartbeat repond ok', async () => {
      ;(fetch as any).mockResolvedValue(okResponse())
      expect(await crm.checkOnline()).toBe(true)
      expect(crm.isOnline()).toBe(true)
    })

    it('re-authentifie si le heartbeat renvoie 401', async () => {
      ;(fetch as any)
        .mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({}) })
        .mockResolvedValueOnce(okResponse({ token: 'bearer-new' }))

      const online = await crm.checkOnline()
      expect(online).toBe(true)
      expect(crm.bearerToken).toBe('bearer-new')
    })

    it('reste offline sur erreur reseau', async () => {
      ;(fetch as any).mockRejectedValue(new Error('no net'))
      expect(await crm.checkOnline()).toBe(false)
      expect(crm.isOnline()).toBe(false)
    })
  })

  describe('searchClientesCrm', () => {
    it('retourne les resultats wrappes dans {data:[...]}', async () => {
      ;(fetch as any).mockResolvedValue(okResponse({ data: [{ id: 'c1' }] }))
      const result = await crm.searchClientesCrm('Marie')
      expect(result).toEqual([{ id: 'c1' }])
      expect(fetch).toHaveBeenCalledWith(
        'http://crm.test/miroir/clientes?search=Marie',
        expect.any(Object)
      )
    })

    it('retourne [] sur reponse non-ok', async () => {
      ;(fetch as any).mockResolvedValue({ ok: false, status: 500 })
      expect(await crm.searchClientesCrm('x')).toEqual([])
    })
  })
})
