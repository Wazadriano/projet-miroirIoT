import { useState } from 'react'
import { useSessionStore } from '../stores/session.store'
import { Header } from '../components/Header'

export function ComparisonScreen(): JSX.Element {
  const { cliente, seance, photosAvant, photosApres, setScreen } = useSessionStore()
  const [noteSeance, setNoteSeance] = useState('')

  const handleNext = async (): Promise<void> => {
    if (seance) {
      try {
        await window.mirrorApi.endSeance(seance.id)
      } catch { /* offline */ }
    }
    setScreen('qrcode')
  }

  const latestAvant = photosAvant[photosAvant.length - 1]
  const latestApres = photosApres[photosApres.length - 1]

  return (
    <div className="screen-padded" style={{ gap: 12, justifyContent: 'flex-start' }}>
      <Header subtitle="Bilan" />

      {/* Before/After comparison */}
      <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 350, marginTop: 10, zIndex: 1 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p className="body-sm" style={{ marginBottom: 6, opacity: 0.6 }}>Avant</p>
          <div className="img-gold-shadow" style={{
            width: '100%', aspectRatio: '1', background: '#222', overflow: 'hidden'
          }}>
            {latestAvant?.thumbnailBase64 && (
              <img src={`data:image/jpeg;base64,${latestAvant.thumbnailBase64}`} alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p className="body-sm" style={{ marginBottom: 6, opacity: 0.6 }}>Apres</p>
          <div className="img-gold-shadow" style={{
            width: '100%', aspectRatio: '1', background: '#222', overflow: 'hidden'
          }}>
            {latestApres?.thumbnailBase64 && (
              <img src={`data:image/jpeg;base64,${latestApres.thumbnailBase64}`} alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>
        </div>
      </div>

      {/* Diagnostic results */}
      {latestAvant?.diagnostic && (
        <div className="glass-card-subtle" style={{ width: '100%', maxWidth: 350, zIndex: 1 }}>
          <p className="body-sm" style={{ lineHeight: 1.6 }}>
            {latestAvant.diagnostic.categories?.map((cat: { nom: string; score: number; niveau: string }) => (
              <span key={cat.nom}>&#8226; {cat.nom}: {cat.score}% ({cat.niveau})<br/></span>
            ))}
          </p>
          {latestAvant.diagnostic.commentaire && (
            <p className="body-sm" style={{ marginTop: 8, opacity: 0.7 }}>
              {(latestAvant.diagnostic as Diagnostic).commentaire}
            </p>
          )}
        </div>
      )}

      {/* Note praticien */}
      <div style={{ width: '100%', maxWidth: 350, zIndex: 1 }}>
        <p className="label" style={{ marginBottom: 6 }}>Note praticien :</p>
        <textarea
          className="glass-input"
          placeholder="Ajouter une note de seance..."
          value={noteSeance}
          onChange={(e) => setNoteSeance(e.target.value)}
          style={{ minHeight: 60, borderRadius: 'var(--radius)', resize: 'none' }}
        />
      </div>

      <button className="glass-btn" onClick={handleNext}
        style={{ width: 190, height: 50, zIndex: 1, marginTop: 8 }}>
        SUIVANT
      </button>
    </div>
  )
}
