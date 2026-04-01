import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync, statSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import { ConfigService } from './config.service'
import { ApiClientService } from './api-client.service'

const MEDIA_DIR = '/var/smart-mirror/media'
const MAX_CACHE_BYTES = 2 * 1024 * 1024 * 1024 // 2 GB

interface PlaylistItem {
  id: string
  type: 'video' | 'image'
  nom_fichier: string
  chemin_serveur: string
  checksum: string
  ordre_affichage: number
}

export class MediaCacheService {
  private cacheDir: string
  private syncInterval: ReturnType<typeof setInterval> | null = null

  constructor(
    private config: ConfigService,
    private api: ApiClientService
  ) {
    this.cacheDir = existsSync(MEDIA_DIR) ? MEDIA_DIR : join(process.cwd(), '.smart-mirror-media')
    this.ensureDir()
  }

  private ensureDir(): void {
    try {
      if (!existsSync(this.cacheDir)) {
        mkdirSync(this.cacheDir, { recursive: true })
      }
    } catch {
      // Permission issue - use local fallback
      this.cacheDir = join(process.cwd(), '.smart-mirror-media')
      mkdirSync(this.cacheDir, { recursive: true })
    }
  }

  startPeriodicSync(): void {
    // Sync every 30 minutes
    this.syncPlaylist()
    this.syncInterval = setInterval(() => this.syncPlaylist(), 30 * 60 * 1000)
  }

  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  async syncPlaylist(): Promise<void> {
    if (!this.config.isProvisioned()) return

    try {
      const mirrorId = this.config.getDeviceId()
      const configData = await this.api.fetchAndUpdateConfig(mirrorId) as {
        playlist?: PlaylistItem[]
      }

      if (!configData?.playlist) return

      const remoteFiles = new Map<string, PlaylistItem>()
      for (const item of configData.playlist) {
        remoteFiles.set(item.nom_fichier, item)
      }

      // Check local cache: delete files no longer in playlist
      const localFiles = this.getLocalFiles()
      for (const localFile of localFiles) {
        if (!remoteFiles.has(localFile)) {
          this.deleteLocal(localFile)
        }
      }

      // Download new or changed files
      for (const [filename, item] of remoteFiles) {
        const localPath = join(this.cacheDir, filename)
        if (existsSync(localPath)) {
          const localChecksum = this.computeChecksum(localPath)
          if (localChecksum === item.checksum) continue
        }

        // Check cache size before downloading
        if (this.getCacheSize() >= MAX_CACHE_BYTES) {
          console.warn('[MediaCache] Cache size limit reached, skipping download')
          break
        }

        await this.downloadFile(item.chemin_serveur, localPath)
      }
    } catch (err) {
      console.error('[MediaCache] Sync failed:', err instanceof Error ? err.message : err)
    }
  }

  getLocalPlaylist(): string[] {
    return this.getLocalFiles().map(f => join(this.cacheDir, f))
  }

  private getLocalFiles(): string[] {
    try {
      return readdirSync(this.cacheDir).filter(f => !f.startsWith('.'))
    } catch {
      return []
    }
  }

  private deleteLocal(filename: string): void {
    try {
      unlinkSync(join(this.cacheDir, filename))
    } catch {
      // Already deleted
    }
  }

  private computeChecksum(filePath: string): string {
    const content = readFileSync(filePath)
    return createHash('sha256').update(content).digest('hex')
  }

  private getCacheSize(): number {
    return this.getLocalFiles().reduce((total, file) => {
      try {
        return total + statSync(join(this.cacheDir, file)).size
      } catch {
        return total
      }
    }, 0)
  }

  private async downloadFile(url: string, localPath: string): Promise<void> {
    try {
      const response = await fetch(url)
      if (!response.ok) return

      const buffer = Buffer.from(await response.arrayBuffer())
      writeFileSync(localPath, buffer)
    } catch {
      // Network error - will retry next sync
    }
  }
}
