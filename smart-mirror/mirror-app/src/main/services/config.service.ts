import Store from 'electron-store'
import { safeStorage } from 'electron'
import { networkInterfaces } from 'os'

interface DeviceConfig {
  device: {
    id: string
    boutiqueId: string
    token: string
    macAddress: string
  }
  api: {
    baseUrl: string
    iaProxyUrl: string
    crmBaseUrl: string
    crmToken: string
  }
  microscope: {
    devicePath: string
    resolution: string
  }
  display: {
    animatedBgEnabled: boolean
    animatedBgTheme: string
    volume: number
    mediaMode: 'fullscreen' | 'side_panel' | 'hidden'
    couleurPrimaire: string
    couleurSecondaire: string
    police: string
    logoUrl: string
  }
}

const DEFAULTS: DeviceConfig = {
  device: {
    id: '',
    boutiqueId: '',
    token: '',
    macAddress: ''
  },
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:8100/api',
    iaProxyUrl: process.env.IA_PROXY_URL || 'http://localhost:3001',
    crmBaseUrl: process.env.CRM_BASE_URL || 'https://crm-kbeauty.a3n.fr/api',
    crmToken: process.env.CRM_TOKEN || ''
  },
  microscope: {
    devicePath: '',
    resolution: '1920x1080'
  },
  display: {
    animatedBgEnabled: true,
    animatedBgTheme: 'particles',
    volume: 70,
    mediaMode: 'fullscreen',
    couleurPrimaire: '#000000',
    couleurSecondaire: '#FFFFFF',
    police: 'Inter',
    logoUrl: ''
  }
}

export class ConfigService {
  private store: Store<DeviceConfig>

  constructor() {
    this.store = new Store<DeviceConfig>({
      name: 'smart-mirror-config',
      defaults: DEFAULTS
    })
  }

  isProvisioned(): boolean {
    const id = this.store.get('device.id')
    const token = this.store.get('device.token')
    return Boolean(id && token)
  }

  getDeviceId(): string {
    return this.store.get('device.id')
  }

  getBoutiqueId(): string {
    return this.store.get('device.boutiqueId')
  }

  getApiBaseUrl(): string {
    return this.store.get('api.baseUrl')
  }

  getIaProxyUrl(): string {
    return this.store.get('api.iaProxyUrl')
  }

  getCrmBaseUrl(): string {
    return this.store.get('api.crmBaseUrl')
  }

  getCrmToken(): string {
    return this.store.get('api.crmToken')
  }

  getDeviceToken(): string {
    const encrypted = this.store.get('device.token')
    if (!encrypted) return ''
    if (!safeStorage.isEncryptionAvailable()) {
      // Dev/VM env without keyring: token stored as plaintext
      return encrypted as string
    }
    try {
      return safeStorage.decryptString(Buffer.from(encrypted as string, 'base64'))
    } catch {
      // Token was stored before safeStorage was available
      return encrypted as string
    }
  }

  getMacAddress(): string {
    const stored = this.store.get('device.macAddress')
    if (stored) return stored
    // Auto-detect from first non-internal interface
    const ifaces = networkInterfaces()
    for (const name of Object.keys(ifaces)) {
      for (const iface of ifaces[name] || []) {
        if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
          return iface.mac.toUpperCase()
        }
      }
    }
    return 'AA:BB:CC:DD:EE:FF'
  }

  setMacAddress(mac: string): void {
    this.store.set('device.macAddress', mac)
  }

  getMicroscopeConfig(): { devicePath: string; resolution: string } {
    return {
      devicePath: this.store.get('microscope.devicePath'),
      resolution: this.store.get('microscope.resolution')
    }
  }

  getDisplayConfig(): DeviceConfig['display'] {
    return this.store.get('display')
  }

  setMicroscopeDevice(devicePath: string): void {
    this.store.set('microscope.devicePath', devicePath)
  }

  provision(data: { deviceId: string; boutiqueId: string; token: string; apiBaseUrl: string }): void {
    this.store.set('device.id', data.deviceId)
    this.store.set('device.boutiqueId', data.boutiqueId)
    this.store.set('api.baseUrl', data.apiBaseUrl)

    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(data.token).toString('base64')
      this.store.set('device.token', encrypted)
    } else {
      console.warn('[ConfigService] safeStorage unavailable - storing token without encryption (dev only)')
      this.store.set('device.token', data.token)
    }
  }

  updateDisplayConfig(config: Partial<DeviceConfig['display']>): void {
    const current = this.getDisplayConfig()
    this.store.set('display', { ...current, ...config })
  }

  getAll(): DeviceConfig {
    return this.store.store
  }
}
