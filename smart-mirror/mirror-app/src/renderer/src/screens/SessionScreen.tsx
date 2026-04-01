import { useState, useRef, useEffect, useCallback } from 'react'
import { useSessionStore, generateThumbnail } from '../stores/session.store'

export function SessionScreen(): JSX.Element {
  const {
    cliente, seance, microscopeConnected, photosAvant, photosApres,
    setScreen, addPhoto, setLastCapture, updatePhotoDiagnostic
  } = useSessionStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [streamActive, setStreamActive] = useState(false)
  const [phase, setPhase] = useState<'avant' | 'apres'>('avant')
  const [capturing, setCapturing] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [lastDiagnostic, setLastDiagnostic] = useState<Diagnostic | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startStream = useCallback(async (): Promise<void> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(d => d.kind === 'videoinput')

      const microscope = videoDevices.find(d =>
        !d.label.toLowerCase().includes('built-in') &&
        !d.label.toLowerCase().includes('integrated') &&
        !d.label.toLowerCase().includes('facetime')
      ) || videoDevices[0]

      if (!microscope) return

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: microscope.deviceId },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setStreamActive(true)
      }
    } catch {
      setStreamActive(false)
    }
  }, [])

  useEffect(() => {
    startStream()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [startStream])

  const handleCapture = async (): Promise<void> => {
    if (!videoRef.current || !canvasRef.current || !seance) return

    setCapturing(true)
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) { setCapturing(false); return }
    ctx.drawImage(video, 0, 0)

    // Efficient base64 encoding via canvas dataURL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    const base64 = dataUrl.split(',')[1]

    // Generate small thumbnail for store (saves RAM)
    const thumbnailBase64 = generateThumbnail(canvas)

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
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              background: '#111',
              borderRadius: 'var(--radius)'
            }}
          />
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
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Cliente</p>
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
