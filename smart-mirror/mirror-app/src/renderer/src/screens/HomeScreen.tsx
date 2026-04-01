import { useState, useEffect } from 'react'
import { useSessionStore } from '../stores/session.store'

export function HomeScreen(): JSX.Element {
  const { setScreen } = useSessionStore()
  const [logoUrl, setLogoUrl] = useState<string>('')

  useEffect(() => {
    window.mirrorApi.getDisplayConfig().then((config) => {
      if (config?.logoUrl) setLogoUrl(config.logoUrl)
    }).catch(() => {})
  }, [])

  return (
    <div className="screen" style={{ gap: '40px' }}>
      <div style={{ textAlign: 'center' }}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo boutique"
            style={{
              maxWidth: '280px',
              maxHeight: '120px',
              objectFit: 'contain',
              marginBottom: '16px'
            }}
          />
        ) : (
          <h1 style={{ fontSize: '2.5rem', fontWeight: 300, marginBottom: '8px' }}>
            K Beauty Cosmetics
          </h1>
        )}
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
          Analyse capillaire par intelligence artificielle
        </p>
      </div>

      <button
        className="btn-primary"
        style={{
          fontSize: '1.3rem',
          padding: '20px 60px',
          borderRadius: '16px'
        }}
        onClick={() => setScreen('search')}
      >
        Nouvelle seance
      </button>

      <p style={{
        position: 'absolute',
        bottom: '40px',
        color: 'var(--color-text-muted)',
        fontSize: '0.85rem'
      }}>
        Bubble Hair Spa
      </p>
    </div>
  )
}
