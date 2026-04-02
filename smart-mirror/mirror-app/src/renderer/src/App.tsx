import { useEffect, useState, useCallback } from 'react'
import { useSessionStore } from './stores/session.store'
import { StatusBar } from './components/StatusBar'
import { AnimatedBackground } from './components/AnimatedBackground'
import { MediaPlayer } from './components/MediaPlayer'
import { HomeScreen } from './screens/HomeScreen'
import { AccueilScreen } from './screens/AccueilScreen'
import { SearchClientScreen } from './screens/SearchClientScreen'
import { NewClientScreen } from './screens/NewClientScreen'
import { ConsentScreen } from './screens/ConsentScreen'
import { SessionScreen } from './screens/SessionScreen'
import { ComparisonScreen } from './screens/ComparisonScreen'
import { QRCodeScreen } from './screens/QRCodeScreen'
import { ProvisioningScreen } from './screens/ProvisioningScreen'

const SCREENS = {
  home: HomeScreen,
  accueil: AccueilScreen,
  search: SearchClientScreen,
  'new-client': NewClientScreen,
  consent: ConsentScreen,
  session: SessionScreen,
  comparison: ComparisonScreen,
  qrcode: QRCodeScreen,
  provisioning: ProvisioningScreen
} as const

interface DisplayConfig {
  animatedBgEnabled: boolean
  animatedBgTheme: string
  volume: number
  mediaMode: 'fullscreen' | 'side_panel' | 'hidden'
}

interface MediaItem {
  id: string
  type: 'video' | 'image'
  src: string
  nom_fichier: string
}

export default function App(): JSX.Element {
  const { screen, setScreen, setProvisioned, setMicroscope, setWifiConnected } = useSessionStore()
  const [displayConfig, setDisplayConfig] = useState<DisplayConfig>({
    animatedBgEnabled: true,
    animatedBgTheme: 'golden',
    volume: 70,
    mediaMode: 'fullscreen'
  })
  const [playlist, setPlaylist] = useState<MediaItem[]>([])
  const [videoFullscreen, setVideoFullscreen] = useState(false)

  const showMedia = screen === 'home'
  const suspendBg = videoFullscreen && displayConfig.mediaMode === 'fullscreen'

  useEffect(() => {
    const init = async (): Promise<void> => {
      const provisioned = await window.mirrorApi.isProvisioned()
      setProvisioned(provisioned)
      if (!provisioned) {
        setScreen('provisioning')
        return
      }

      const device = await window.mirrorApi.getMicroscopeDevice()
      setMicroscope(device !== null, device)

      const wifi = await window.mirrorApi.getWifiStatus()
      setWifiConnected(wifi.connected)

      try {
        const config = await window.mirrorApi.getDisplayConfig()
        if (config) setDisplayConfig(config as DisplayConfig)
      } catch { /* defaults */ }

      try {
        const data = await window.mirrorApi.getPlaylist()
        if (data?.playlist?.length > 0) {
          setPlaylist(data.playlist.map((item) => ({
            id: item.id,
            type: item.type as 'video' | 'image',
            src: item.src,
            nom_fichier: item.nom_fichier
          })))
        }
      } catch { /* offline */ }
    }

    init()

    window.mirrorApi.onMicroscopeStatus((status) => {
      setMicroscope(status.connected, status.device as MicroscopeDevice | null)
    })

    window.mirrorApi.onWifiStatusChanged((status) => {
      setWifiConnected(status.connected)
    })

    const interval = setInterval(async () => {
      const wifi = await window.mirrorApi.getWifiStatus()
      setWifiConnected(wifi.connected)
      const queueSize = await window.mirrorApi.getSyncQueueSize()
      useSessionStore.getState().setSyncQueueSize(queueSize)
    }, 15_000)

    return () => clearInterval(interval)
  }, [setScreen, setProvisioned, setMicroscope, setWifiConnected])

  const handleFullscreenChange = useCallback((isFullscreen: boolean) => {
    setVideoFullscreen(isFullscreen)
  }, [])

  const ScreenComponent = SCREENS[screen]

  return (
    <>
      <AnimatedBackground
        enabled={displayConfig.animatedBgEnabled}
        theme={displayConfig.animatedBgTheme}
        suspended={suspendBg}
      />

      {/* MediaPlayer disabled - product carousel on HomeScreen replaces it
         TODO: Re-enable when veille mode (idle timeout) is implemented */}

      {screen !== 'provisioning' && screen !== 'home' && <StatusBar />}

      <ScreenComponent />
    </>
  )
}
