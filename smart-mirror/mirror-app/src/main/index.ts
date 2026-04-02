import { app, BrowserWindow, shell } from 'electron'

// Enable CDP remote debugging for Playwright testing
if (process.env.REMOTE_DEBUG === '1') {
  app.commandLine.appendSwitch('remote-debugging-port', '9222')
  app.commandLine.appendSwitch('remote-debugging-address', '0.0.0.0')
}
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc/handlers'
import { ConfigService } from './services/config.service'
import { ApiClientService } from './services/api-client.service'
import { MicroscopeService } from './services/microscope.service'
import { SyncService } from './services/sync.service'
import { MediaCacheService } from './services/media-cache.service'
import { UpdaterService } from './services/updater.service'
import { WifiService } from './services/wifi.service'

let mainWindow: BrowserWindow | null = null

const configService = new ConfigService()
const apiClient = new ApiClientService(configService)
const microscopeService = new MicroscopeService()
const syncService = new SyncService(configService, apiClient)
const mediaCacheService = new MediaCacheService(configService, apiClient)
const updaterService = new UpdaterService()
const wifiService = new WifiService()

function createWindow(): void {
  const isKiosk = !is.dev || process.env.FORCE_KIOSK === '1' || process.argv.includes('--kiosk')

  mainWindow = new BrowserWindow({
    width: 1080,
    height: 1920,
    fullscreen: isKiosk,
    kiosk: isKiosk,
    frame: !isKiosk,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Auto-grant camera/media permissions (kiosk has no dialog)
  mainWindow.webContents.session.setPermissionRequestHandler(
    (_wc, permission, callback) => callback(['media', 'mediaKeySystem'].includes(permission))
  )

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Block navigation outside the app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // Kiosk: prevent Alt+F4, Ctrl+W, etc.
  if (isKiosk) {
    mainWindow.setAlwaysOnTop(true, 'screen-saver')
    mainWindow.setVisibleOnAllWorkspaces(true)
    mainWindow.webContents.on('before-input-event', (_event, input) => {
      const blocked = [
        input.key === 'F4' && input.alt,
        input.key === 'F11',
        input.key === 'w' && (input.control || input.meta),
        input.key === 'q' && (input.control || input.meta),
        input.key === 'Escape'
      ]
      if (blocked.some(Boolean)) {
        _event.preventDefault()
      }
    })

    // Disable context menu (right-click)
    mainWindow.webContents.on('context-menu', (e) => {
      e.preventDefault()
    })
  }

  // Load renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Prevent uncaught errors from crashing the app
process.on('uncaughtException', (err) => {
  console.error('[Main] Uncaught exception:', err.message)
})

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.dreamtech.smartmirror')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Register IPC handlers
  registerIpcHandlers({
    configService,
    apiClient,
    microscopeService,
    syncService,
    mediaCacheService,
    wifiService
  })

  createWindow()

  // Start background services
  microscopeService.startWatching()
  syncService.startPeriodicSync()
  wifiService.startMonitoring()

  // Forward WiFi status changes to renderer
  wifiService.on('disconnected', () => {
    BrowserWindow.getAllWindows().forEach(w =>
      w.webContents.send('wifi:status-changed', { connected: false })
    )
  })
  wifiService.on('connected', (data) => {
    BrowserWindow.getAllWindows().forEach(w =>
      w.webContents.send('wifi:status-changed', { connected: true, ssid: data?.ssid })
    )
  })

  // Media cache sync (playlist checksum-based)
  if (configService.isProvisioned()) {
    mediaCacheService.startPeriodicSync()
  }

  // OTA auto-updater (production only)
  if (!is.dev) {
    updaterService.init()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  microscopeService.stopWatching()
  syncService.stop()
  mediaCacheService.stop()
  updaterService.stop()
  wifiService.stopMonitoring()
  if (process.platform !== 'darwin') app.quit()
})
