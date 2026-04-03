import { ipcMain, BrowserWindow } from 'electron'
import { readFileSync } from 'fs'
import { ConfigService } from '../services/config.service'
import { ApiClientService } from '../services/api-client.service'
import { MicroscopeService } from '../services/microscope.service'
import { SyncService } from '../services/sync.service'
import { WifiService } from '../services/wifi.service'
import { MediaCacheService } from '../services/media-cache.service'
import { CrmSyncService } from '../services/crm-sync.service'

interface Services {
  configService: ConfigService
  apiClient: ApiClientService
  microscopeService: MicroscopeService
  syncService: SyncService
  mediaCacheService: MediaCacheService
  wifiService: WifiService
  crmSync: CrmSyncService
}

function safeHandle(
  channel: string,
  handler: (event: Electron.IpcMainInvokeEvent, ...args: unknown[]) => unknown
): void {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      return await handler(event, ...args)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[IPC:${channel}] ${message}`)
      return { success: false, error: message }
    }
  })
}

export function registerIpcHandlers(services: Services): void {
  const { configService, apiClient, microscopeService, syncService, mediaCacheService, wifiService, crmSync } = services

  // --- Config (sync, no network) ---

  safeHandle('config:isProvisioned', () => {
    return configService.isProvisioned()
  })

  safeHandle('config:getDisplay', () => {
    return configService.getDisplayConfig()
  })

  safeHandle('config:getAll', () => {
    return configService.getAll()
  })

  safeHandle('config:getBoutiqueId', () => {
    return configService.getBoutiqueId()
  })

  // --- Provisioning ---

  safeHandle('provision:getWifiNetworks', async () => {
    return wifiService.scanNetworks()
  })

  safeHandle('provision:connect', async (_event, ...args) => {
    const data = args[0] as {
      ssid: string; password: string; boutiqueId: string; apiBaseUrl: string
    }
    const ssid = data.ssid?.trim()
    if (ssid) {
      const connected = await wifiService.connect(ssid, data.password)
      if (!connected) return { success: false, error: 'WiFi connection failed' }
    }

    const result = await apiClient.registerDevice(data.boutiqueId)
    configService.provision({
      deviceId: result.mirror.id,
      boutiqueId: result.mirror.boutique_id,
      token: result.token,
      apiBaseUrl: data.apiBaseUrl
    })
    return { success: true, mirror: result.mirror }
  })

  // --- Clientes ---

  safeHandle('clientes:search', async (_event, ...args) => {
    const query = args[0] as string

    // Local search first (always available)
    let results: Array<{ id: string; [k: string]: unknown }> = []
    try {
      const local = await apiClient.searchClientes(query) as Array<{ id: string; [k: string]: unknown }>
      if (Array.isArray(local)) results = local
    } catch { /* local unavailable */ }

    // CRM search when online: merge + upsert CRM clients into local DB
    if (crmSync.isOnline()) {
      try {
        const crmResults = await crmSync.searchClientesCrm(query) as Array<{ id: string; prenom?: string; nom?: string; email?: string; telephone?: string; date_de_naissance?: string; sexe?: string; [k: string]: unknown }>
        if (Array.isArray(crmResults)) {
          const localIds = new Set(results.map(c => c.id))
          for (const client of crmResults) {
            if (!localIds.has(client.id)) {
              // Upsert CRM client into local DB with same ID so FK constraints work
              try {
                await apiClient.createCliente({
                  id: client.id,
                  prenom: String(client.prenom || ''),
                  nom: String(client.nom || ''),
                  email: client.email ? String(client.email) : undefined,
                  telephone: client.telephone ? String(client.telephone) : undefined,
                  date_de_naissance: client.date_de_naissance ? String(client.date_de_naissance).split('T')[0] : undefined,
                  sexe: client.sexe ? String(client.sexe) : undefined
                })
              } catch { /* already exists or insert failed, still show in results */ }
              results.push(client)
            }
          }
        }
      } catch { /* CRM unavailable */ }
    }

    return results
  })

  safeHandle('clientes:create', async (_event, ...args) => {
    const data = args[0] as {
      prenom: string; nom: string; email?: string; telephone?: string; date_de_naissance?: string; sexe?: string
    }
    return apiClient.createCliente(data)
  })

  // --- Consentement ---

  safeHandle('consent:checkValid', async (_event, ...args) => {
    const clienteId = args[0] as string
    return apiClient.checkValidConsent(clienteId)
  })

  safeHandle('consent:create', async (_event, ...args) => {
    const data = args[0] as { clienteId: string; texteConsent: string }
    return apiClient.createConsentement(data.clienteId, data.texteConsent)
  })

  // --- Seances ---

  safeHandle('seance:start', async (_event, ...args) => {
    const data = args[0] as { clienteId: string; consentementId: string }
    return apiClient.createSeance(data.clienteId, data.consentementId)
  })

  safeHandle('seance:end', async (_event, ...args) => {
    const seanceId = args[0] as string
    return apiClient.endSeance(seanceId)
  })

  safeHandle('seance:generateReport', async (_event, ...args) => {
    const seanceId = args[0] as string
    return apiClient.generateReport(seanceId)
  })

  safeHandle('seance:getQRCode', async (_event, ...args) => {
    const seanceId = args[0] as string

    // Try CRM first: sync session, get report with public URL
    if (crmSync.isOnline()) {
      try {
        await crmSync.syncSessionNow(seanceId)
        const crmReport = await crmSync.getReportFromCrm(seanceId)
        if (crmReport?.rapport_url) {
          const qrDataUrl = crmReport.qr_svg
            ? `data:image/svg+xml;base64,${Buffer.from(crmReport.qr_svg).toString('base64')}`
            : ''
          return { qrcode: qrDataUrl, reportUrl: crmReport.rapport_url }
        }
      } catch { /* CRM unavailable, fall back to local */ }
    }

    // Fallback: local QR (localhost URL, only works on same network)
    return apiClient.getQRCode(seanceId)
  })

  safeHandle('seance:updateNotes', async (_event, ...args) => {
    const data = args[0] as { seanceId: string; noteSeance: string }
    return apiClient.updateSeance(data.seanceId, { note_seance: data.noteSeance })
  })

  // --- Photos ---

  safeHandle('photo:save', async (_event, ...args) => {
    const data = args[0] as {
      imageBase64: string; seanceId: string; phase: 'avant' | 'apres'
    }
    const buffer = Buffer.from(data.imageBase64, 'base64')
    const localPath = syncService.savePhotoLocally(buffer, data.seanceId, data.phase)

    // Upload metadata to local backend (non-blocking)
    let photoId = ''
    try {
      const photoMeta = await apiClient.uploadPhotoMetadata({
        seanceId: data.seanceId,
        cheminLocal: localPath,
        phase: data.phase
      })
      photoId = photoMeta.id
    } catch {
      // Offline — generate temp ID, will sync later
      photoId = `local-${Date.now()}`
    }

    return { success: true, localPath, photoId }
  })

  safeHandle('photo:analyze', async (_event, ...args) => {
    const data = args[0] as { imageBase64: string; photoId: string }
    const start = Date.now()
    const result = await apiClient.analyzePhoto(data.imageBase64)
    const latence = Date.now() - start

    // Update diagnostic in local backend (non-critical if it fails)
    apiClient.updatePhotoDiagnostic(data.photoId, {
      diagnostic_ia: result,
      modele_ia: result.modele,
      latence_ms: latence
    }).catch(() => {})

    return { success: true, diagnostic: result, latence }
  })

  // --- Photo: load full-res from disk ---

  safeHandle('photo:loadFullRes', async (_event, ...args) => {
    const localPath = args[0] as string
    try {
      const buffer = readFileSync(localPath)
      return { success: true, imageBase64: buffer.toString('base64') }
    } catch {
      return { success: false, error: 'File not found' }
    }
  })

  // --- Microscope ---

  safeHandle('microscope:getDevice', () => {
    return {
      connected: microscopeService.isConnected(),
      streamUrl: microscopeService.getStreamUrl(),
      snapshotUrl: microscopeService.getSnapshotUrl()
    }
  })

  safeHandle('microscope:connect', async () => {
    microscopeService.connect()
    return { success: true }
  })

  safeHandle('microscope:disconnect', () => {
    microscopeService.disconnect()
    return { success: true }
  })

  safeHandle('microscope:snapshot', async () => {
    const frame = await microscopeService.captureSnapshotAsync()
    if (frame.length === 0) return { success: false, error: 'No frame available' }
    return { success: true, imageBase64: frame.toString('base64') }
  })

  microscopeService.on('connected', (info) => {
    BrowserWindow.getAllWindows().forEach(w =>
      w.webContents.send('microscope:status', { connected: true, ...info })
    )
  })

  microscopeService.on('disconnected', () => {
    BrowserWindow.getAllWindows().forEach(w =>
      w.webContents.send('microscope:status', { connected: false, streamUrl: null })
    )
  })

  microscopeService.on('button-pressed', () => {
    BrowserWindow.getAllWindows().forEach(w =>
      w.webContents.send('microscope:button-pressed')
    )
  })

  // --- Media Cache ---

  safeHandle('media:getPlaylist', async () => {
    const mirrorId = configService.getDeviceId()
    if (!mirrorId) return { playlist: [], produits: [] }

    try {
      const config = await apiClient.fetchAndUpdateConfig(mirrorId) as {
        playlist?: Array<{ id: string; type: string; nom_fichier: string; chemin_serveur: string; checksum: string; ordre_affichage: number }>
        produits?: unknown[]
        config?: unknown
      }
      return {
        playlist: (config?.playlist || []).map((item) => ({
          id: item.id,
          type: item.type,
          nom_fichier: item.nom_fichier,
          src: item.chemin_serveur,
          ordre_affichage: item.ordre_affichage
        })),
        produits: config?.produits || [],
        config: config?.config || null
      }
    } catch {
      // Offline — return cached file paths
      const localFiles = mediaCacheService.getLocalPlaylist()
      return {
        playlist: localFiles.map((filePath, i) => ({
          id: `local-${i}`,
          type: filePath.match(/\.(mp4|webm)$/i) ? 'video' : 'image',
          nom_fichier: filePath.split('/').pop() || '',
          src: `file://${filePath}`,
          ordre_affichage: i
        })),
        produits: [],
        config: null
      }
    }
  })

  // --- WiFi ---

  safeHandle('wifi:status', () => {
    return wifiService.getStatus()
  })

  // --- Sync ---

  safeHandle('sync:queueSize', () => {
    return syncService.getQueueSize()
  })

  safeHandle('sync:status', () => {
    return {
      online: crmSync.isOnline(),
      queueSize: syncService.getQueueSize(),
      lastSync: crmSync.getLastSyncTime()
    }
  })

  // --- Mirror Config (remote) ---

  safeHandle('mirror:fetchConfig', async () => {
    const mirrorId = configService.getDeviceId()
    if (!mirrorId) return null
    return apiClient.fetchAndUpdateConfig(mirrorId)
  })
}
