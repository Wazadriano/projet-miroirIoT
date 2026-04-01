import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Config
  isProvisioned: (): Promise<boolean> => ipcRenderer.invoke('config:isProvisioned'),
  getDisplayConfig: (): Promise<unknown> => ipcRenderer.invoke('config:getDisplay'),
  getConfig: (): Promise<unknown> => ipcRenderer.invoke('config:getAll'),
  getBoutiqueId: (): Promise<string> => ipcRenderer.invoke('config:getBoutiqueId'),

  // Provisioning
  getWifiNetworks: (): Promise<Array<{ ssid: string; signal: number; security: string }>> =>
    ipcRenderer.invoke('provision:getWifiNetworks'),
  provision: (data: { ssid: string; password: string; boutiqueId: string; apiBaseUrl: string }): Promise<{ success: boolean; error?: string; mirror?: unknown }> =>
    ipcRenderer.invoke('provision:connect', data),

  // Clientes
  searchClientes: (query: string): Promise<unknown[]> =>
    ipcRenderer.invoke('clientes:search', query),
  createCliente: (data: { prenom: string; nom: string; email?: string; telephone?: string; age?: number; sexe?: string }): Promise<unknown> =>
    ipcRenderer.invoke('clientes:create', data),

  // Consentement
  createConsentement: (data: { clienteId: string; texteConsent: string }): Promise<unknown> =>
    ipcRenderer.invoke('consent:create', data),

  // Seances
  startSeance: (data: { clienteId: string; consentementId: string }): Promise<unknown> =>
    ipcRenderer.invoke('seance:start', data),
  endSeance: (seanceId: string): Promise<unknown> =>
    ipcRenderer.invoke('seance:end', seanceId),

  // Photos
  savePhoto: (data: { imageBase64: string; seanceId: string; phase: 'avant' | 'apres' }): Promise<{ localPath: string; photoId: string }> =>
    ipcRenderer.invoke('photo:save', data),
  analyzePhoto: (data: { imageBase64: string; photoId: string }): Promise<{ success: boolean; diagnostic?: unknown; latence?: number; error?: string }> =>
    ipcRenderer.invoke('photo:analyze', data),

  loadFullResPhoto: (localPath: string): Promise<{ success: boolean; imageBase64?: string; error?: string }> =>
    ipcRenderer.invoke('photo:loadFullRes', localPath),

  // Microscope
  getMicroscopeDevice: (): Promise<{ path: string; name: string; isUvc: boolean } | null> =>
    ipcRenderer.invoke('microscope:getDevice'),
  onMicroscopeStatus: (callback: (status: { connected: boolean; device: unknown }) => void): void => {
    ipcRenderer.on('microscope:status', (_event, status) => callback(status))
  },

  // WiFi
  getWifiStatus: (): Promise<{ connected: boolean; ssid: string; signal: number; ip: string }> =>
    ipcRenderer.invoke('wifi:status'),
  onWifiStatusChanged: (callback: (status: { connected: boolean; ssid?: string }) => void): void => {
    ipcRenderer.on('wifi:status-changed', (_event, status) => callback(status))
  },

  // Media playlist
  getPlaylist: (): Promise<{ playlist: Array<{ id: string; type: string; nom_fichier: string; src: string }>; produits: unknown[]; config: unknown }> =>
    ipcRenderer.invoke('media:getPlaylist'),

  // Sync
  getSyncQueueSize: (): Promise<number> =>
    ipcRenderer.invoke('sync:queueSize'),

  // Mirror config
  fetchMirrorConfig: (): Promise<unknown> =>
    ipcRenderer.invoke('mirror:fetchConfig')
}

contextBridge.exposeInMainWorld('mirrorApi', api)

export type MirrorApi = typeof api
