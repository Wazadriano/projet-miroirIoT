import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'fs'
import { join } from 'path'
import { ConfigService } from './config.service'
import { ApiClientService } from './api-client.service'

const PHOTOS_DIR = '/var/smart-mirror/photos'
const QUEUE_FILE = '/var/smart-mirror/sync-queue.json'
const PHOTO_RETENTION_DAYS = 30

interface SyncQueueItem {
  localPath: string
  seanceId: string
  phase: 'avant' | 'apres'
  createdAt: string
}

export class SyncService {
  private interval: ReturnType<typeof setInterval> | null = null
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null

  constructor(
    private config: ConfigService,
    private api: ApiClientService
  ) {
    this.ensureDirectories()
  }

  private ensureDirectories(): void {
    try {
      if (!existsSync(PHOTOS_DIR)) {
        mkdirSync(PHOTOS_DIR, { recursive: true })
      }
    } catch {
      // Non-Linux env or permission issue - use temp dir in dev
    }
  }

  startPeriodicSync(): void {
    // Sync pending photos every 30 seconds
    this.interval = setInterval(() => {
      this.processQueue()
      this.cleanupExpiredPhotos()
    }, 30_000)

    // Heartbeat every 60 seconds
    this.heartbeatInterval = setInterval(() => {
      this.api.sendHeartbeat()
    }, 60_000)
  }

  stop(): void {
    if (this.interval) clearInterval(this.interval)
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval)
  }

  savePhotoLocally(photoData: Buffer, seanceId: string, phase: 'avant' | 'apres'): string {
    const filename = `${Date.now()}-${phase}.jpg`
    const localPath = join(PHOTOS_DIR, filename)

    try {
      writeFileSync(localPath, photoData)
    } catch {
      // Fallback for dev environment
      try {
        const devDir = join(process.cwd(), '.smart-mirror-photos')
        mkdirSync(devDir, { recursive: true })
        const devPath = join(devDir, filename)
        writeFileSync(devPath, photoData)
        this.addToQueue({ localPath: devPath, seanceId, phase, createdAt: new Date().toISOString() })
        return devPath
      } catch (err) {
        console.error('[SyncService] Failed to save photo locally:', err instanceof Error ? err.message : err)
        throw new Error('Photo save failed on both primary and fallback paths')
      }
    }

    this.addToQueue({ localPath, seanceId, phase, createdAt: new Date().toISOString() })
    return localPath
  }

  private addToQueue(item: SyncQueueItem): void {
    const queue = this.getQueue()
    queue.push(item)
    this.saveQueue(queue)
  }

  private getQueue(): SyncQueueItem[] {
    try {
      if (existsSync(QUEUE_FILE)) {
        return JSON.parse(readFileSync(QUEUE_FILE, 'utf-8'))
      }
    } catch {
      // Corrupted queue file - start fresh
    }
    return []
  }

  private saveQueue(queue: SyncQueueItem[]): void {
    try {
      writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2))
    } catch {
      // Dev env fallback
      const devQueue = join(process.cwd(), '.smart-mirror-sync-queue.json')
      writeFileSync(devQueue, JSON.stringify(queue, null, 2))
    }
  }

  private async processQueue(): Promise<void> {
    if (!this.config.isProvisioned()) return

    const queue = this.getQueue()
    if (queue.length === 0) return

    const remaining: SyncQueueItem[] = []

    for (const item of queue) {
      try {
        await this.api.uploadPhotoMetadata({
          seanceId: item.seanceId,
          cheminLocal: item.localPath,
          phase: item.phase
        })
        // Upload successful - photo synced
      } catch {
        // Network error - keep in queue for retry
        remaining.push(item)
      }
    }

    this.saveQueue(remaining)
  }

  getQueueSize(): number {
    return this.getQueue().length
  }

  private cleanupExpiredPhotos(): void {
    const dirs = [PHOTOS_DIR, join(process.cwd(), '.smart-mirror-photos')]
    const cutoff = Date.now() - PHOTO_RETENTION_DAYS * 24 * 60 * 60 * 1000
    const pendingPaths = new Set(this.getQueue().map(q => q.localPath))

    for (const dir of dirs) {
      try {
        if (!existsSync(dir)) continue
        const files = readdirSync(dir).filter(f => f.endsWith('.jpg'))

        for (const file of files) {
          const filePath = join(dir, file)
          // Never delete photos still in the sync queue
          if (pendingPaths.has(filePath)) continue

          try {
            const stat = statSync(filePath)
            if (stat.mtimeMs < cutoff) {
              unlinkSync(filePath)
            }
          } catch {
            // File already deleted or inaccessible
          }
        }
      } catch {
        // Directory not accessible
      }
    }
  }
}
