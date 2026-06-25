import { describe, it, expect, beforeEach } from 'vitest'
import { ConfigService } from './config.service'

describe('ConfigService', () => {
  let service: ConfigService

  beforeEach(() => {
    service = new ConfigService()
  })

  it('should not be provisioned by default', () => {
    expect(service.isProvisioned()).toBe(false)
  })

  it('should return default API base URL', () => {
    expect(service.getApiBaseUrl()).toBe('http://localhost:8100/api')
  })

  it('should return default IA proxy URL', () => {
    expect(service.getIaProxyUrl()).toBe('http://localhost:3001')
  })

  it('should auto-detect or fallback MAC address', () => {
    const mac = service.getMacAddress()
    expect(mac).toMatch(/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/)
  })

  it('should return empty device ID by default', () => {
    expect(service.getDeviceId()).toBe('')
  })

  it('should return empty boutique ID by default', () => {
    expect(service.getBoutiqueId()).toBe('')
  })

  it('should return default display config', () => {
    const display = service.getDisplayConfig()
    expect(display.animatedBgEnabled).toBe(true)
    expect(display.volume).toBe(70)
    expect(display.mediaMode).toBe('fullscreen')
    expect(display.police).toBe('Inter')
  })

  it('should return default microscope config', () => {
    const micro = service.getMicroscopeConfig()
    expect(micro.devicePath).toBe('')
    expect(micro.resolution).toBe('1920x1080')
  })

  describe('provision', () => {
    it('should store device info and mark as provisioned', () => {
      service.provision({
        deviceId: 'dev-123',
        boutiqueId: 'bout-456',
        token: 'test-token',
        apiBaseUrl: 'http://api.test.com/api'
      })

      expect(service.isProvisioned()).toBe(true)
      expect(service.getDeviceId()).toBe('dev-123')
      expect(service.getBoutiqueId()).toBe('bout-456')
      expect(service.getApiBaseUrl()).toBe('http://api.test.com/api')
    })

    it('should encrypt the device token at rest and restore it on read', () => {
      service.provision({
        deviceId: 'dev-123',
        boutiqueId: 'bout-456',
        token: 'plain-token',
        apiBaseUrl: 'http://localhost:8000/api'
      })

      // Le token est chiffre au repos (AES-256-GCM) : le store ne contient pas le clair
      expect(service.getAll().device.token).not.toBe('plain-token')
      expect(service.getAll().device.token.length).toBeGreaterThan(0)
      // mais getDeviceToken le restitue dechiffre
      expect(service.getDeviceToken()).toBe('plain-token')
    })

    it('should encrypt the CRM bearer token at rest', () => {
      service.setCrmBearerToken('bearer-secret-123')

      expect(service.getAll().api.crmBearerToken).not.toBe('bearer-secret-123')
      expect(service.getCrmBearerToken()).toBe('bearer-secret-123')
    })
  })

  describe('updateDisplayConfig', () => {
    it('should merge partial config with existing', () => {
      service.updateDisplayConfig({ volume: 50, mediaMode: 'hidden' })

      const display = service.getDisplayConfig()
      expect(display.volume).toBe(50)
      expect(display.mediaMode).toBe('hidden')
      expect(display.animatedBgEnabled).toBe(true)
      expect(display.police).toBe('Inter')
    })
  })

  describe('setMicroscopeDevice', () => {
    it('should update microscope device path', () => {
      service.setMicroscopeDevice('/dev/video0')
      expect(service.getMicroscopeConfig().devicePath).toBe('/dev/video0')
    })
  })

  describe('getAll', () => {
    it('should return full config object', () => {
      const all = service.getAll()
      expect(all).toHaveProperty('device')
      expect(all).toHaveProperty('api')
      expect(all).toHaveProperty('microscope')
      expect(all).toHaveProperty('display')
    })
  })
})
