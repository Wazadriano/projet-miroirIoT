import { autoUpdater } from 'electron-updater'
import { app, BrowserWindow } from 'electron'
import Store from 'electron-store'

const MAX_CRASHES_BEFORE_ROLLBACK = 3

interface UpdateState {
  crashCount: number
  lastVersion: string
  currentVersion: string
  lastBootTime: number
}

const updateStore = new Store<UpdateState>({
  name: 'smart-mirror-updater',
  defaults: {
    crashCount: 0,
    lastVersion: '',
    currentVersion: '',
    lastBootTime: 0
  }
})

export class UpdaterService {
  private checkInterval: ReturnType<typeof setInterval> | null = null

  init(): void {
    this.trackCrashes()

    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true

    autoUpdater.on('update-available', (info) => {
      console.log(`[Updater] Update available: ${info.version}`)
    })

    autoUpdater.on('update-downloaded', (info) => {
      console.log(`[Updater] Update downloaded: ${info.version} — will install on quit`)
      BrowserWindow.getAllWindows().forEach(w =>
        w.webContents.send('app:update-ready', { version: info.version })
      )
    })

    autoUpdater.on('error', (err) => {
      console.error('[Updater] Error:', err.message)
    })

    // Check immediately, then every 4 hours
    this.checkForUpdates()
    this.checkInterval = setInterval(() => this.checkForUpdates(), 4 * 60 * 60 * 1000)
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  private trackCrashes(): void {
    const currentVersion = app.getVersion()
    const storedVersion = updateStore.get('currentVersion')
    const lastBoot = updateStore.get('lastBootTime')
    const now = Date.now()

    // If version changed, reset crash counter
    if (storedVersion !== currentVersion) {
      updateStore.set('lastVersion', storedVersion)
      updateStore.set('currentVersion', currentVersion)
      updateStore.set('crashCount', 0)
    }

    // If last boot was < 10 seconds ago, count as crash (rapid restart = crash recovery)
    if (lastBoot > 0 && (now - lastBoot) < 10_000) {
      const crashes = updateStore.get('crashCount') + 1
      updateStore.set('crashCount', crashes)
      console.warn(`[Updater] Rapid restart detected (crash #${crashes})`)

      if (crashes >= MAX_CRASHES_BEFORE_ROLLBACK) {
        const previousVersion = updateStore.get('lastVersion')
        console.error(`[Updater] ${crashes} consecutive crashes — rollback needed to ${previousVersion || 'unknown'}`)
        // Signal that rollback is needed (electron-updater handles version management)
        // In practice, the previous .AppImage or .deb would need to be restored
        // For now, reset crash counter to avoid infinite loop and log the event
        updateStore.set('crashCount', 0)
      }
    } else {
      // Clean boot (> 10s since last) — reset crash counter
      updateStore.set('crashCount', 0)
    }

    updateStore.set('lastBootTime', now)
  }

  private checkForUpdates(): void {
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.error('[Updater] Check failed:', err.message)
    })
  }
}
