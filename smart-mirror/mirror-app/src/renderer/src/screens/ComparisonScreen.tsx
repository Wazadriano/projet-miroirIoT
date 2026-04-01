import { useState, useEffect } from 'react'
import { useSessionStore } from '../stores/session.store'

export function ComparisonScreen(): JSX.Element {
  const { cliente, seance, photosAvant, photosApres, setScreen } = useSessionStore()

  const lastAvant = photosAvant[photosAvant.length - 1]
  const lastApres = photosApres[photosApres.length - 1]

  // Load full-res from disk for comparison display
  const [fullResAvant, setFullResAvant] = useState<string | null>(null)
  const [fullResApres, setFullResApres] = useState<string | null>(null)

  useEffect(() => {
    if (lastAvant?.localPath) {
      window.mirrorApi.loadFullResPhoto(lastAvant.localPath).then((res) => {
        if (res.success && res.imageBase64) setFullResAvant(res.imageBase64)
      })
    }
    if (lastApres?.localPath) {
      window.mirrorApi.loadFullResPhoto(lastApres.localPath).then((res) => {
        if (res.success && res.imageBase64) setFullResApres(res.imageBase64)
      })
    }
  }, [lastAvant?.localPath, lastApres?.localPath])

  const handleFinish = async (): Promise<void> => {
    if (seance) {
      try {
        await window.mirrorApi.endSeance(seance.id)
      } catch {
        // Offline - will sync later
      }
    }
    setScreen('qrcode')
  }

  const avantSrc = fullResAvant
    ? `data:image/jpeg;base64,${fullResAvant}`
    : lastAvant?.thumbnailBase64
      ? `data:image/jpeg;base64,${lastAvant.thumbnailBase64}`
      : null

  const apresSrc = fullResApres
    ? `data:image/jpeg;base64,${fullResApres}`
    : lastApres?.thumbnailBase64
      ? `data:image/jpeg;base64,${lastApres.thumbnailBase64}`
      : null

  return (
    <div className="screen" style={{ paddingTop: '60px', justifyContent: 'flex-start', gap: '20px' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 400 }}>
        Comparaison avant / apres
      </h2>
      <p style={{ color: 'var(--color-text-muted)' }}>
        {cliente?.prenom} {cliente?.nom}
      </p>

      <div style={{
        display: 'flex',
        gap: '24px',
        width: '100%',
        maxWidth: '1200px',
        flex: 1
      }}>
        {/* Before */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 400 }}>
            Avant soin
          </h3>
          {avantSrc ? (
            <>
              <img
                src={avantSrc}
                alt="Avant soin"
                style={{
                  width: '100%',
                  height: '300px',
                  objectFit: 'contain',
                  borderRadius: 'var(--radius)',
                  background: '#111'
                }}
              />
              {lastAvant?.diagnostic && (
                <DiagnosticSummary diagnostic={lastAvant.diagnostic} />
              )}
            </>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              Aucune capture avant soin
            </div>
          )}
        </div>

        {/* After */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 400 }}>
            Apres soin
          </h3>
          {apresSrc ? (
            <>
              <img
                src={apresSrc}
                alt="Apres soin"
                style={{
                  width: '100%',
                  height: '300px',
                  objectFit: 'contain',
                  borderRadius: 'var(--radius)',
                  background: '#111'
                }}
              />
              {lastApres?.diagnostic && (
                <DiagnosticSummary diagnostic={lastApres.diagnostic} />
              )}
            </>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              Aucune capture apres soin
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <button className="btn-secondary" onClick={() => setScreen('session')}>
          Retour a la seance
        </button>
        <button className="btn-primary" onClick={handleFinish}>
          Terminer et generer le rapport
        </button>
      </div>
    </div>
  )
}

function DiagnosticSummary({ diagnostic }: { diagnostic: Diagnostic }): JSX.Element {
  return (
    <div className="card" style={{ fontSize: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontWeight: 600 }}>Score global</span>
        <span style={{
          color: diagnostic.score_global > 60 ? 'var(--color-success)' : 'var(--color-warning)'
        }}>
          {diagnostic.score_global}/100
        </span>
      </div>
      {diagnostic.categories.map((cat) => (
        <div key={cat.nom} style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '2px 0'
        }}>
          <span style={{ color: 'var(--color-text-muted)' }}>{cat.nom}</span>
          <span>{cat.score}%</span>
        </div>
      ))}
    </div>
  )
}
