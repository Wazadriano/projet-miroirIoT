import { useState, useRef, useEffect, useCallback } from 'react'
import { useSessionStore, generateThumbnail } from '../stores/session.store'

export function SessionScreen(): JSX.Element {
  const {
    cliente, seance, microscopeConnected, photosAvant, photosApres,
    setScreen, addPhoto, setLastCapture, updatePhotoDiagnostic
  } = useSessionStore()
  const imgRef = useRef<HTMLImageElement>(null)
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
        const res = await fetch('http://localhost:9100/snapshot.jpg', { method: 'HEAD' })
        if (res.ok) {
          setStreamUrl('http://localhost:9100/stream.mjpg')
          setStreamActive(true)
          return
        }
      } catch { /* not ready yet */ }
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
        // Poll until stream is ready
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

    return () => {
      window.mirrorApi.disconnectMicroscope()
    }
  }, [startStream])

  const makeThumbnail = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = (): void => {
        const canvas = document.createElement('canvas')
        const scale = 80 / Math.max(img.width, img.height)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.6).split(',')[1])
      }
      img.onerror = () => resolve(base64.substring(0, 500))
      img.src = `data:image/jpeg;base64,${base64}`
    })
  }

  const handleCapture = async (): Promise<void> => {
    if (!seance) {
      console.warn('No active session for capture')
      return
    }

    setCapturing(true)

    // Capture via IPC snapshot (high quality, from main process)
    const snapshot = await window.mirrorApi.captureMicroscopeSnapshot()
    if (!snapshot.success || !snapshot.imageBase64) {
      console.warn('Snapshot failed:', snapshot.error)
      setCapturing(false)
      return
    }

    const base64 = snapshot.imageBase64
    const thumbnailBase64 = await makeThumbnail(base64)

    try {
      const { localPath, photoId } = await window.mirrorApi.savePhoto({
        imageBase64: base64,
        seanceId: seance.id,
        phase
      })

      // Store only thumbnail in state, keep full-res as lastCapture only
      addPhoto({ photoId, localPath, thumbnailBase64, diagnostic: null, phase })
      setLastCapture(base64)

      // Trigger IA analysis in background
      setAnalyzing(true)
      const result = await window.mirrorApi.analyzePhoto({ imageBase64: base64, photoId })

      // Release full-res from memory after analysis is sent
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

  const handleEndSession = async (): Promise<void> => {
    if (!seance) return
    if (photosApres.length > 0) {
      setScreen('comparison')
    } else {
      try {
        await window.mirrorApi.endSeance(seance.id)
      } catch {
        // Offline - session will be synced later
      }
      setScreen('qrcode')
    }
  }

  const currentPhotos = phase === 'avant' ? photosAvant : photosApres

  return (
    <div className="screen" style={{ padding: '50px 20px 20px', justifyContent: 'flex-start' }}>
      <div style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        gap: '16px'
      }}>
        {/* Video stream area */}
        <div style={{ flex: 2, position: 'relative' }}>
          {streamUrl ? (
            <img
              ref={imgRef}
              src={streamUrl}
              alt="Microscope"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                background: '#111',
                borderRadius: 'var(--radius)'
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              background: '#111',
              borderRadius: 'var(--radius)'
            }} />
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {!streamActive && !microscopeConnected && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#111',
              borderRadius: 'var(--radius)',
              color: 'var(--color-warning)'
            }}>
              Microscope non connecte
            </div>
          )}

          {/* Capture button */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '12px'
          }}>
            <button
              className="btn-primary"
              onClick={handleCapture}
              disabled={capturing || analyzing}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                fontSize: '0.85rem',
                padding: 0
              }}
            >
              {capturing ? '...' : 'Capturer'}
            </button>
          </div>
        </div>

        {/* Right panel */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflowY: 'auto'
        }}>
          <div className="card">
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Client</p>
            <p style={{ fontSize: '1.1rem' }}>{cliente?.prenom} {cliente?.nom}</p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={phase === 'avant' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setPhase('avant')}
              style={{ flex: 1, fontSize: '0.9rem' }}
            >
              Avant soin ({photosAvant.length})
            </button>
            <button
              className={phase === 'apres' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setPhase('apres')}
              style={{ flex: 1, fontSize: '0.9rem' }}
            >
              Apres soin ({photosApres.length})
            </button>
          </div>

          {analyzing && (
            <div className="card" style={{ textAlign: 'center' }}>
              <p>Analyse IA en cours...</p>
            </div>
          )}

          {lastDiagnostic && !analyzing && (
            <div className="card" style={{ fontSize: '0.9rem' }}>
              <p style={{ fontWeight: 600, marginBottom: '8px' }}>
                Score global: {lastDiagnostic.score_global}/100
                {lastDiagnostic.confiance < 60 && (
                  <span style={{ color: 'var(--color-warning)', marginLeft: '8px' }}>
                    Analyse non concluante
                  </span>
                )}
              </p>
              {lastDiagnostic.categories.map((cat) => (
                <div key={cat.nom} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                  borderBottom: '1px solid #1E293B'
                }}>
                  <span>{cat.nom}</span>
                  <span style={{ color: cat.score > 60 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    {cat.score}% ({cat.niveau})
                  </span>
                </div>
              ))}
              <p style={{ marginTop: '8px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                {lastDiagnostic.commentaire}
              </p>
              {lastDiagnostic.produits_recommandes.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>Produits recommandes:</p>
                  {lastDiagnostic.produits_recommandes.map((p) => (
                    <span key={p} style={{
                      display: 'inline-block',
                      background: 'var(--color-surface-light)',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      margin: '4px 4px 0 0',
                      fontSize: '0.8rem'
                    }}>
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentPhotos.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {currentPhotos.map((photo) => (
                <img
                  key={photo.photoId}
                  src={`data:image/jpeg;base64,${photo.thumbnailBase64}`}
                  alt=""
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: photo.diagnostic ? '2px solid var(--color-success)' : '2px solid var(--color-surface)'
                  }}
                />
              ))}
            </div>
          )}

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {photosAvant.length > 0 && photosApres.length > 0 && (
              <button className="btn-secondary" onClick={() => setScreen('comparison')}>
                Voir comparaison
              </button>
            )}
            <button className="btn-primary" onClick={handleEndSession}>
              Terminer la seance
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
