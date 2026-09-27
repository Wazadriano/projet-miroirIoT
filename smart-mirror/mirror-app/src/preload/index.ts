import { contextBridge, ipcRenderer } from 'electron'
import type { MirrorApi, MicroscopeStatus } from '../shared/mirror-api'

const api: MirrorApi = {
  // Config
  isProvisioned: () => ipcRenderer.invoke('config:isProvisioned'),
  getDisplayConfig: () => ipcRenderer.invoke('config:getDisplay'),
  getConfig: () => ipcRenderer.invoke('config:getAll'),
  getBoutiqueId: () => ipcRenderer.invoke('config:getBoutiqueId'),

  // Provisioning
  getWifiNetworks: () => ipcRenderer.invoke('provision:getWifiNetworks'),
  provision: (data) => ipcRenderer.invoke('provision:connect', data),

  // Clientes
  searchClientes: (query) => ipcRenderer.invoke('clientes:search', query),
  createCliente: (data) => ipcRenderer.invoke('clientes:create', data),

  // Consentement
  checkValidConsent: (clienteId) => ipcRenderer.invoke('consent:checkValid', clienteId),
  createConsentement: (data) => ipcRenderer.invoke('consent:create', data),

  // Seances
  startSeance: (data) => ipcRenderer.invoke('seance:start', data),
  endSeance: (seanceId) => ipcRenderer.invoke('seance:end', seanceId),
  generateReport: (seanceId) => ipcRenderer.invoke('seance:generateReport', seanceId),
  getQRCode: (seanceId) => ipcRenderer.invoke('seance:getQRCode', seanceId),
  updateSeanceNotes: (data) => ipcRenderer.invoke('seance:updateNotes', data),

  // Photos
  savePhoto: (data) => ipcRenderer.invoke('photo:save', data),
  analyzePhoto: (data) => ipcRenderer.invoke('photo:analyze', data),
  loadFullResPhoto: (localPath) => ipcRenderer.invoke('photo:loadFullRes', localPath),

  // Microscope
  getMicroscopeDevice: () => ipcRenderer.invoke('microscope:getDevice'),
  connectMicroscope: (ip) => ipcRenderer.invoke('microscope:connect', ip),
  disconnectMicroscope: () => ipcRenderer.invoke('microscope:disconnect'),
  captureMicroscopeSnapshot: () => ipcRenderer.invoke('microscope:snapshot'),
  onMicroscopeStatus: (callback) => {
    const handler = (_event: unknown, status: MicroscopeStatus): void => callback(status)
    ipcRenderer.on('microscope:status', handler)
    return () => ipcRenderer.removeListener('microscope:status', handler)
  },
  onMicroscopeButton: (callback) => {
    const handler = (): void => callback()
    ipcRenderer.on('microscope:button-pressed', handler)
    return () => ipcRenderer.removeListener('microscope:button-pressed', handler)
  },

  // WiFi
  getWifiStatus: () => ipcRenderer.invoke('wifi:status'),
  onWifiStatusChanged: (callback) => {
    ipcRenderer.on('wifi:status-changed', (_event, status) => callback(status))
  },

  // Media playlist
  getPlaylist: () => ipcRenderer.invoke('media:getPlaylist'),

  // Sync
  getSyncQueueSize: () => ipcRenderer.invoke('sync:queueSize'),

  // Mirror config
  fetchMirrorConfig: () => ipcRenderer.invoke('mirror:fetchConfig')
}

contextBridge.exposeInMainWorld('mirrorApi', api)

export type { MirrorApi }
