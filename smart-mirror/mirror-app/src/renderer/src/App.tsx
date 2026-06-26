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

  const [showMedia, setShowMedia] = useState(false)
  const suspendBg = videoFullscreen && displayConfig.mediaMode === 'fullscreen'

  useEffect(() => {
    // QA / capture : ?screen=<nom> force un ecran et injecte des donnees de
    // demo, pour inspecter chaque vue sans derouler tout le parcours. Inerte en
    // kiosk (aucun query param). N'affecte jamais le fonctionnement reel.
    const qaScreen = new URLSearchParams(window.location.search).get('screen')
    if (qaScreen && qaScreen in SCREENS) {
      const st = useSessionStore.getState()
      st.setProvisioned(true)
      st.setCliente({ id: 'demo', prenom: 'Camille', nom: 'Laurent', email: 'camille.laurent@email.fr', telephone: '06 12 34 56 78', sexe: 'F' } as never)
      st.setConsentement({ id: 'demo-c', cliente_id: 'demo', texte_consent: 'Consentement', date_consentement: '2026-06-26T10:00:00Z' } as never)
      st.setSeance({ id: 'demo-s', cliente_id: 'demo', date_debut: '2026-06-26T10:00:00Z' } as never)
      const photo = (phase: 'avant' | 'apres'): never => ({ photoId: 'p-' + phase, localPath: '', thumbnailBase64: '', phase, diagnostic: { hydratation: 72, sebum: 38, irritation: 15, densite: 64, score_global: 68, recommandations: ['Soin hydratant K-Beauty', 'Serum apaisant'] } } as never)
      st.addPhoto(photo('avant'))
      st.addPhoto(photo('apres'))
      setProvisioned(true)
      setScreen(qaScreen as typeof screen)
      return
    }

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
        suspended={suspendBg || showMedia}
      />

      {showMedia && playlist.length > 0 && (
        <>
          <MediaPlayer
            playlist={playlist}
            mode={displayConfig.mediaMode}
            volume={displayConfig.volume}
            onFullscreenChange={handleFullscreenChange}
          />
          <button onClick={() => setShowMedia(false)} style={{
            position: 'fixed', top: '2vh', right: '2vw', zIndex: 20,
            width: '10vw', height: '10vw', borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 'var(--fs-body)'
          }}>X</button>
        </>
      )}

      {!showMedia && screen !== 'provisioning' && screen !== 'home' && screen !== 'accueil' && playlist.length > 0 && (
        <button onClick={() => setShowMedia(true)} style={{
          position: 'fixed', bottom: '2vh', right: '2vw', zIndex: 15,
          width: '12vw', height: '12vw', borderRadius: '50%',
          background: 'var(--color-glass-bg)', backdropFilter: 'blur(10px)',
          boxShadow: 'inset 0 0 2.5vw 0 var(--color-shadow-gold)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="5vw" height="5vw" viewBox="0 0 24 24" fill="var(--color-accent)">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
        </button>
      )}

      {screen !== 'provisioning' && screen !== 'home' && <StatusBar />}

      <ScreenComponent />
    </>
  )
}
