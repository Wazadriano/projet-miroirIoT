import { execSync, execFile, execFileSync } from 'child_process'
import { randomBytes } from 'crypto'
import { EventEmitter } from 'events'

interface WifiNetwork {
  ssid: string
  signal: number
  security: string
}

interface WifiStatus {
  connected: boolean
  ssid: string
  signal: number
  ip: string
}

export class WifiService extends EventEmitter {
  private monitorInterval: ReturnType<typeof setInterval> | null = null

  getStatus(): WifiStatus {
    try {
      const output = execSync('nmcli -t -f GENERAL.STATE,GENERAL.CONNECTION,WIFI.SIGNAL,IP4.ADDRESS device show wlan0 2>/dev/null', {
        encoding: 'utf-8',
        timeout: 5000
      })

      const connected = output.includes('connected') && !output.includes('disconnected')
      const ssid = output.match(/GENERAL\.CONNECTION:(.+)/)?.[1]?.trim() || ''
      const signal = parseInt(output.match(/WIFI\.SIGNAL:(\d+)/)?.[1] || '0')
      const ip = output.match(/IP4\.ADDRESS\[1\]:(.+)/)?.[1]?.split('/')[0]?.trim() || ''

      return { connected, ssid, signal, ip }
    } catch {
      // Non-Linux dev environment
      return { connected: true, ssid: 'dev-network', signal: 100, ip: '127.0.0.1' }
    }
  }

  async scanNetworks(): Promise<WifiNetwork[]> {
    try {
      const output = execSync('nmcli -t -f SSID,SIGNAL,SECURITY device wifi list 2>/dev/null', {
        encoding: 'utf-8',
        timeout: 10000
      })

      const networks = output
        .split('\n')
        .filter(Boolean)
        .map(line => {
          const [ssid, signal, security] = line.split(':')
          return { ssid, signal: parseInt(signal || '0'), security: security || 'open' }
        })
        .filter(n => n.ssid)

      const deduped = new Map<string, WifiNetwork>()
      for (const net of networks) {
        const existing = deduped.get(net.ssid)
        if (!existing || net.signal > existing.signal) {
          deduped.set(net.ssid, net)
        }
      }
      return Array.from(deduped.values()).sort((a, b) => b.signal - a.signal)
    } catch {
      return [{ ssid: 'dev-network', signal: 100, security: 'WPA2' }]
    }
  }

  async connect(ssid: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      // execFile (sans shell) : ni ssid ni password ne sont interpoles dans une
      // ligne de commande, ce qui elimine le risque d'injection shell.
      execFile(
        'nmcli',
        ['device', 'wifi', 'connect', ssid, 'password', password],
        { timeout: 30000 },
        (error, stdout) => {
          if (error) {
            this.emit('connection-failed', { ssid, error: stdout || error.message })
            resolve(false)
          } else {
            this.emit('connected', { ssid })
            resolve(true)
          }
        }
      )
    })
  }

  startHotspot(deviceId: string): boolean {
    const suffix = deviceId.slice(-4).toUpperCase()
    const ssid = `SmartMirror-Setup-${suffix}`
    // Mot de passe aleatoire par appareil : plus de secret partage en dur.
    // Diffuse via 'hotspot-started' pour affichage a l'ecran de provisioning.
    const password = randomBytes(6).toString('hex')

    try {
      execFileSync('nmcli', [
        'device', 'wifi', 'hotspot',
        'con-name', 'smart-mirror-setup',
        'ssid', ssid,
        'band', 'bg',
        'channel', '6',
        'password', password
      ], { timeout: 10000 })
      this.emit('hotspot-started', { ssid, password })
      return true
    } catch {
      return false
    }
  }

  stopHotspot(): void {
    try {
      execSync('nmcli connection down smart-mirror-setup 2>/dev/null', { timeout: 5000 })
    } catch {
      // Already stopped or doesn't exist
    }
  }

  startMonitoring(): void {
    if (this.monitorInterval) return
    this.monitorInterval = setInterval(() => {
      const status = this.getStatus()
      this.emit('status', status)

      if (!status.connected) {
        this.emit('disconnected')
        // Auto-reconnect attempt
        try {
          execSync('nmcli device wifi connect --ask 2>/dev/null', { timeout: 10000 })
        } catch {
          // Will retry next interval
        }
      }
    }, 30_000)
  }

  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval)
      this.monitorInterval = null
    }
  }
}
