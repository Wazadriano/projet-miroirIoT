import { useState, useRef, useEffect, useCallback } from 'react'
import { useSessionStore } from '../stores/session.store'
import { Header } from '../components/Header'
import { SideNav } from '../components/SideNav'

export function SessionScreen(): JSX.Element {
  const {
    cliente, seance, photosAvant, photosApres,
    setScreen, addPhoto, setLastCapture, updatePhotoDiagnostic
  } = useSessionStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [streamActive, setStreamActive] = useState(false)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [phase, setPhase] = useState<'avant' | 'apres'>('avant')
  const [capturing, setCapturing] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [lastDiagnostic, setLastDiagnostic] = useState<Diagnostic | null>(null)

  const checkStreamReady = useCallback(async (retries = 10): Promise<void> => {
    for (let i = 0; i < retries; i++) {
      try {
        const device = await window.mirrorApi.getMicroscopeDevice()
        if (device?.connected && device.streamUrl) {
          setStreamUrl(device.streamUrl)
          setStreamActive(true)
          return
        }
      } catch { /* not ready */ }
      await new Promise(r => setTimeout(r, 1000))
    }
    setStreamActive(false)
  }, [])

  const startStream = useCallback(async (): Promise<void> => {
    try {
      const device = await window.mirrorApi.getMicroscopeDevice()
      if (device?.connected) {
        await checkStreamReady()
      } else {
        await window.mirrorApi.connectMicroscope()
        await checkStreamReady()
      }
    } catch {
      setStreamActive(false)
    }
  }, [checkStreamReady])

  useEffect(() => {
    startStream()
    window.mirrorApi.onMicroscopeStatus((status) => {
      if (status.connected && status.streamUrl) {
        setStreamUrl(status.streamUrl)
        setStreamActive(true)
      } else {
        setStreamActive(false)
        setStreamUrl(null)
      }
    })
    return () => { window.mirrorApi.disconnectMicroscope() }
  }, [startStream])

  const makeThumbnail = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = (): void => {
        const canvas = document.createElement('canvas')
        const scale = 70 / Math.max(img.width, img.height)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.6).split(',')[1])
      }
      img.onerror = () => resolve('')
      img.src = `data:image/jpeg;base64,${base64}`
    })
  }

  const handleCapture = async (): Promise<void> => {
    if (!seance) return
    setCapturing(true)
    const snapshot = await window.mirrorApi.captureMicroscopeSnapshot()
    if (!snapshot.success || !snapshot.imageBase64) {
      setCapturing(false)
      return
    }
    const base64 = snapshot.imageBase64
    const thumbnailBase64 = await makeThumbnail(base64)

    try {
      const { localPath, photoId } = await window.mirrorApi.savePhoto({
        imageBase64: base64, seanceId: seance.id, phase
      })
      addPhoto({ photoId, localPath, thumbnailBase64, diagnostic: null, phase })
      setLastCapture(base64)

      setAnalyzing(true)
      const result = await window.mirrorApi.analyzePhoto({ imageBase64: base64, photoId })
      setLastCapture(null)
      if (result.success && result.diagnostic) {
        updatePhotoDiagnostic(photoId, result.diagnostic as Diagnostic)
        setLastDiagnostic(result.diagnostic as Diagnostic)
      }
    } catch {
      setLastCapture(null)
    } finally {
      setCapturing(false)
      setAnalyzing(false)
    }
  }

  const currentPhotos = phase === 'avant' ? photosAvant : photosApres

  return (
    <div className="screen-padded" style={{ justifyContent: 'flex-start', paddingBottom: '1vh' }}>
      <Header subtitle="Diagnostic en cours" />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <SideNav
        onHome={() => setScreen('home')}
        onUser={() => setScreen('search')}
        onCamera={handleCapture}
      />

      {/* Live badge */}
      <div className="glass-pill" style={{ marginTop: '1vh', zIndex: 1 }}>Live</div>

      {/* Microscope stream - circle */}
      <div style={{
        width: '70vw',
        height: '70vw',
        borderRadius: 'var(--radius-circle)',
        overflow: 'hidden',
        boxShadow: '0px 0px 1vw 0.5vw var(--color-shadow-gold-light)',
        marginTop: '1.5vh',
        position: 'relative',
        zIndex: 1,
        background: '#111'
      }}>
        {streamUrl ? (
          <img src={streamUrl} alt="Microscope" style={{
            width: '100%', height: '100%', objectFit: 'cover'
          }} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-warning)', fontSize: 'var(--fs-body)'
          }}>
            Microscope non connecte
          </div>
        )}

        {/* Capture button overlay */}
        <button
          onClick={handleCapture}
          disabled={capturing || analyzing}
          style={{
            position: 'absolute', bottom: '2.5vw', right: '2.5vw',
            width: '10vw', height: '10vw', borderRadius: '50%',
            background: 'var(--color-glass-bg)', backdropFilter: 'blur(10px)',
            border: 'none', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            padding: 0, minWidth: 'unset', minHeight: 'unset'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
            <circle cx="12" cy="13" r="4"/><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
          </svg>
        </button>
      </div>

      {/* Diagnostic text */}
      {(analyzing || lastDiagnostic) && (
        <div className="glass-card-subtle" style={{
          width: '100%', maxWidth: '88vw', marginTop: '1.5vh', zIndex: 1, padding: '3vw'
        }}>
          <p className="title-md" style={{ marginBottom: '1vh' }}>Diagnostic :</p>
          {analyzing ? (
            <p className="body-sm" style={{ opacity: 0.6 }}>Analyse en cours...</p>
          ) : lastDiagnostic && (
            <p className="body-sm" style={{ lineHeight: 1.5 }}>
              {lastDiagnostic.commentaire}
            </p>
          )}
        </div>
      )}

      {/* Thumbnails */}
      <div style={{
        display: 'flex', gap: '2vw', marginTop: '1.5vh', zIndex: 1, justifyContent: 'center', flexWrap: 'wrap'
      }}>
        {currentPhotos.slice(0, 4).map((photo) => (
          <div key={photo.photoId} className="img-gold-shadow" style={{
            width: '17.5vw', height: '17.5vw', overflow: 'hidden', background: '#222'
          }}>
            {photo.thumbnailBase64 && (
              <img src={`data:image/jpeg;base64,${photo.thumbnailBase64}`} alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>
        ))}
      </div>

      {/* Phase toggle + Next */}
      <div style={{ display: 'flex', gap: '2vw', marginTop: '1.5vh', zIndex: 1 }}>
        <button className="glass-btn" onClick={() => setPhase('avant')}
          style={{ fontSize: 'var(--fs-body-sm)', padding: '1.5vw 3.5vw', minHeight: '9vw',
            boxShadow: phase === 'avant' ? 'inset 0px 0px 15px 0px var(--color-shadow-gold-light)' : undefined
          }}>
          Avant ({photosAvant.length})
        </button>
        <button className="glass-btn" onClick={() => setPhase('apres')}
          style={{ fontSize: 'var(--fs-body-sm)', padding: '1.5vw 3.5vw', minHeight: '9vw',
            boxShadow: phase === 'apres' ? 'inset 0px 0px 15px 0px var(--color-shadow-gold-light)' : undefined
          }}>
          Apres ({photosApres.length})
        </button>
      </div>

      <button className="glass-btn" onClick={() => setScreen('comparison')}
        style={{ width: '33vw', height: '10vw', marginTop: '1.5vh', zIndex: 1 }}>
        SUIVANT
      </button>
    </div>
  )
}
