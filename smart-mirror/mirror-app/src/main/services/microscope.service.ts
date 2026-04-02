import { EventEmitter } from 'events'
import http from 'http'

const DEFAULT_STREAM_URL = process.env.MICROSCOPE_STREAM_URL || 'http://localhost:9100/stream.mjpg'
const DEFAULT_SNAPSHOT_URL = DEFAULT_STREAM_URL.replace('stream.mjpg', 'snapshot.jpg')
const HEALTH_URL = DEFAULT_STREAM_URL.replace('/stream.mjpg', '/')
const BUTTON_EVENTS_URL = DEFAULT_STREAM_URL.replace('/stream.mjpg', '/button-events')

export class MicroscopeService extends EventEmitter {
  private connected = false
  private pollInterval: ReturnType<typeof setInterval> | null = null

  getStreamUrl(): string {
    return DEFAULT_STREAM_URL
  }

  getSnapshotUrl(): string {
    return DEFAULT_SNAPSHOT_URL
  }

  isConnected(): boolean {
    return this.connected
  }

  captureSnapshot(): Buffer {
    return Buffer.alloc(0)
  }

  async captureSnapshotAsync(): Promise<Buffer> {
    try {
      const res = await fetch(DEFAULT_SNAPSHOT_URL)
      if (!res.ok) return Buffer.alloc(0)
      const arrayBuf = await res.arrayBuffer()
      return Buffer.from(arrayBuf)
    } catch {
      return Buffer.alloc(0)
    }
  }

  private buttonReq: ReturnType<typeof http.get> | null = null

  startWatching(): void {
    this.checkConnection()
    this.pollInterval = setInterval(() => this.checkConnection(), 5000)
    this.listenButtonEvents()
  }

  stopWatching(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
    if (this.buttonReq) {
      this.buttonReq.destroy()
      this.buttonReq = null
    }
  }

  private listenButtonEvents(): void {
    try {
      this.buttonReq = http.get(BUTTON_EVENTS_URL, (res) => {
        res.on('data', (chunk: Buffer) => {
          const text = chunk.toString()
          if (text.includes('button-press')) {
            console.log('[Microscope] Button pressed - triggering capture')
            this.emit('button-pressed')
          }
        })
        res.on('end', () => {
          setTimeout(() => this.listenButtonEvents(), 3000)
        })
      })
      this.buttonReq.on('error', () => {
        setTimeout(() => this.listenButtonEvents(), 5000)
      })
    } catch {
      setTimeout(() => this.listenButtonEvents(), 5000)
    }
  }

  connect(): void {
    this.checkConnection()
  }

  disconnect(): void {
    if (this.connected) {
      this.connected = false
      this.emit('disconnected')
    }
  }

  private async checkConnection(): Promise<void> {
    try {
      const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(3000) })
      const wasConnected = this.connected
      if (res.ok) {
        this.connected = true
        if (!wasConnected) {
          this.emit('connected', { streamUrl: DEFAULT_STREAM_URL })
        }
      } else {
        this.handleDisconnect()
      }
    } catch {
      this.handleDisconnect()
    }
  }

  private handleDisconnect(): void {
    if (this.connected) {
      this.connected = false
      this.emit('disconnected')
    }
  }
}
