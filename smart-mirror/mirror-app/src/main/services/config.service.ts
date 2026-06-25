import Store from 'electron-store'
import { networkInterfaces } from 'os'
import { cryptoVault } from './crypto-vault.service'

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
    crmBearerToken: string
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
    crmBaseUrl: process.env.CRM_BASE_URL || 'https://api-kbeauty.a3n.fr/api',
    crmToken: process.env.CRM_TOKEN || '',
    crmBearerToken: ''
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

  // Secrets persistes au repos sous forme chiffree (AES-256-GCM via cryptoVault).
  private static readonly SECRET_KEYS = ['device.token', 'api.crmToken', 'api.crmBearerToken'] as const

  constructor() {
    this.store = new Store<DeviceConfig>({
      name: 'smart-mirror-config',
      defaults: DEFAULTS
    })
    this.migrateSecretsAtRest()
  }

  private looksEncrypted(value: string): boolean {
    if (!value) return false
    try {
      return cryptoVault.isEncrypted(Buffer.from(value, 'base64'))
    } catch {
      return false
    }
  }

  // Re-chiffre au repos les secrets herites en clair, notamment crmToken injecte
  // depuis l'environnement via les valeurs par defaut d'electron-store.
  private migrateSecretsAtRest(): void {
    for (const key of ConfigService.SECRET_KEYS) {
      const raw = this.store.get(key) as string
      if (raw && !this.looksEncrypted(raw)) {
        try {
          this.store.set(key, cryptoVault.encryptString(raw))
        } catch {
          // Cle maitre indisponible : ne pas degrader, laisser tel quel.
        }
      }
    }
  }

  private storeSecret(key: string, value: string): void {
    this.store.set(key, value ? cryptoVault.encryptString(value) : '')
  }

  private readSecret(key: string): string {
    const raw = this.store.get(key) as string
    if (!raw) return ''
    if (!this.looksEncrypted(raw)) return raw // valeur heritee en clair
    try {
      return cryptoVault.decryptString(raw)
    } catch {
      // Chiffre avec une autre cle ou corrompu : ne pas renvoyer de secret errone.
      return ''
    }
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
    return this.readSecret('api.crmToken')
  }

  getCrmBearerToken(): string {
    return this.readSecret('api.crmBearerToken')
  }

  setCrmBearerToken(token: string): void {
    this.storeSecret('api.crmBearerToken', token)
  }

  getDeviceToken(): string {
    return this.readSecret('device.token')
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
    this.storeSecret('device.token', data.token)
  }

  updateDisplayConfig(config: Partial<DeviceConfig['display']>): void {
    const current = this.getDisplayConfig()
    this.store.set('display', { ...current, ...config })
  }

  getAll(): DeviceConfig {
    return this.store.store
  }
}
