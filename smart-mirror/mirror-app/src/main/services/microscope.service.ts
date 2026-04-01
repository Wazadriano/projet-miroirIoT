import { EventEmitter } from 'events'
import { readdir, watch, FSWatcher } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface VideoDevice {
  path: string
  name: string
  capabilities: string[]
  isUvc: boolean
}

export class MicroscopeService extends EventEmitter {
  private watcher: FSWatcher | null = null
  private pollInterval: ReturnType<typeof setInterval> | null = null
  private currentDevice: VideoDevice | null = null
  private scanning = false

  startWatching(): void {
    this.scanDevices()

    try {
      this.watcher = watch('/dev', (_eventType, filename) => {
        if (filename && filename.startsWith('video')) {
          setTimeout(() => this.scanDevices(), 500)
        }
      })
    } catch {
      // /dev watch not available (dev machine) - fallback to polling
      this.pollInterval = setInterval(() => this.scanDevices(), 5000)
    }
  }

  stopWatching(): void {
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
  }

  getCurrentDevice(): VideoDevice | null {
    return this.currentDevice
  }

  private async scanDevices(): Promise<void> {
    if (this.scanning) return
    this.scanning = true

    try {
      const entries = await new Promise<string[]>((resolve) => {
        readdir('/dev', (err, files) => {
          if (err) { resolve([]); return }
          resolve(files.filter(e => e.startsWith('video')))
        })
      })

      const devices: VideoDevice[] = []
      for (const entry of entries) {
        const device = await this.queryDevice(`/dev/${entry}`)
        if (device) devices.push(device)
      }

      const microscope = this.identifyMicroscope(devices)

      if (microscope && (!this.currentDevice || this.currentDevice.path !== microscope.path)) {
        this.currentDevice = microscope
        this.emit('connected', microscope)
      } else if (!microscope && this.currentDevice) {
        this.currentDevice = null
        this.emit('disconnected')
      }
    } catch {
      // Non-Linux dev environment — emit mock device
      if (!this.currentDevice) {
        const mockDevice: VideoDevice = {
          path: '/dev/video0',
          name: 'Mock Microscope (dev)',
          capabilities: ['video/capture'],
          isUvc: true
        }
        this.currentDevice = mockDevice
        this.emit('connected', mockDevice)
      }
    } finally {
      this.scanning = false
    }
  }

  private async queryDevice(devicePath: string): Promise<VideoDevice | null> {
    try {
      const { stdout } = await execAsync(
        `v4l2-ctl --device=${devicePath} --info 2>/dev/null`,
        { timeout: 3000 }
      )

      const name = stdout.match(/Card type\s*:\s*(.+)/)?.[1]?.trim() || 'Unknown'
      const capabilities = stdout.match(/Capabilities\s*:\s*(.+)/)?.[1]?.trim()?.split(/\s+/) || []
      const isUvc = stdout.toLowerCase().includes('uvc') || name.toLowerCase().includes('uvc')

      return { path: devicePath, name, capabilities, isUvc }
    } catch {
      return null
    }
  }

  private identifyMicroscope(devices: VideoDevice[]): VideoDevice | null {
    const uvcDevices = devices.filter(d => d.isUvc)
    if (uvcDevices.length > 0) return uvcDevices[0]

    const external = devices.filter(d =>
      !d.name.toLowerCase().includes('built-in') &&
      !d.name.toLowerCase().includes('integrated')
    )
    if (external.length > 0) return external[0]

    return devices[0] || null
  }
}
