import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ApiClientService } from './api-client.service'
import { ConfigService } from './config.service'

describe('ApiClientService', () => {
  let api: ApiClientService
  let config: ConfigService

  beforeEach(() => {
    config = new ConfigService()
    config.provision({
      deviceId: 'mirror-001',
      boutiqueId: 'bout-001',
      token: 'test-token',
      apiBaseUrl: 'http://localhost:8000/api'
    })
    api = new ApiClientService(config)

    vi.stubGlobal('fetch', vi.fn())
  })

  const mockFetchOk = (data: unknown): void => {
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data })
    })
  }

  const mockFetchError = (status: number, error: string): void => {
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status,
      json: () => Promise.resolve({ error })
    })
  }

  describe('registerDevice', () => {
    it('should POST to /auth/mirror/register with boutique_id', async () => {
      mockFetchOk({ token: 'new-token', mirror: { id: 'm1', nom: 'Mirror 1', boutique_id: 'b1' } })

      const result = await api.registerDevice('b1')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/auth/mirror/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ boutique_id: 'b1' })
        })
      )
      expect(result.token).toBe('new-token')
      expect(result.mirror.id).toBe('m1')
    })
  })

  describe('searchClientes', () => {
    it('should GET /clientes with boutique_id and encoded query', async () => {
      mockFetchOk([{ id: 'c1', prenom: 'Marie' }])

      await api.searchClientes('Marie Dupont')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/clientes?boutique_id=bout-001&q=Marie%20Dupont',
        expect.any(Object)
      )
    })
  })

  describe('createCliente', () => {
    it('should POST to /clientes with boutique_id included', async () => {
      mockFetchOk({ id: 'c2', prenom: 'Sophie', nom: 'Martin' })

      await api.createCliente({ prenom: 'Sophie', nom: 'Martin', email: 's@test.com' })

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/clientes',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            prenom: 'Sophie',
            nom: 'Martin',
            email: 's@test.com',
            boutique_id: 'bout-001'
          })
        })
      )
    })
  })

  describe('createConsentement', () => {
    it('should POST with boutique_id, cliente_id, and texte_consent', async () => {
      mockFetchOk({ id: 'cons-1' })

      await api.createConsentement('c1', 'Je consens au traitement')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/consentements',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            boutique_id: 'bout-001',
            cliente_id: 'c1',
            texte_consent: 'Je consens au traitement'
          })
        })
      )
    })
  })

  describe('createSeance', () => {
    it('should POST with all required IDs including consentement_id', async () => {
      mockFetchOk({ id: 's1' })

      await api.createSeance('c1', 'cons-1')

      const body = JSON.parse(
        (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body
      )
      expect(body.consentement_id).toBe('cons-1')
      expect(body.miroir_id).toBe('mirror-001')
      expect(body.boutique_id).toBe('bout-001')
      expect(body.cliente_id).toBe('c1')
    })
  })

  describe('endSeance', () => {
    it('should POST to /seances/:id/end', async () => {
      mockFetchOk({ id: 's1', date_fin: '2026-01-01' })

      await api.endSeance('s1')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/seances/s1/end',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  describe('analyzePhoto', () => {
    it('should POST to IA proxy with X-Mirror-Token header', async () => {
      ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: { categories: [], score_global: 72, commentaire: 'Test' }
        })
      })

      await api.analyzePhoto('base64data')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/analyze',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-Mirror-Token': expect.any(String)
          }),
          body: JSON.stringify({ image: 'base64data' })
        })
      )
    })
  })

  describe('error handling', () => {
    it('should throw on HTTP error response', async () => {
      mockFetchError(422, 'consentement_id is required')

      await expect(api.createSeance('c1', '')).rejects.toThrow('consentement_id is required')
    })

    it('should throw generic error when no error body', async () => {
      ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('no json'))
      })

      await expect(api.searchClientes('test')).rejects.toThrow('HTTP 500')
    })
  })

  describe('sendHeartbeat', () => {
    it('should POST to /miroirs/:id/heartbeat', async () => {
      mockFetchOk({})

      await api.sendHeartbeat()

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/miroirs/mirror-001/heartbeat',
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should not call API if device is not provisioned', async () => {
      const freshConfig = new ConfigService()
      const freshApi = new ApiClientService(freshConfig)

      await freshApi.sendHeartbeat()

      expect(fetch).not.toHaveBeenCalled()
    })
  })
})
