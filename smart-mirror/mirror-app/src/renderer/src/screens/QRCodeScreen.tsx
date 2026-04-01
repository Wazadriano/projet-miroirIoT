import { useEffect, useState } from 'react'
import { useSessionStore } from '../stores/session.store'

export function QRCodeScreen(): JSX.Element {
  const { resetSession } = useSessionStore()
  const [countdown, setCountdown] = useState(60)

  // Auto-return to home after 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          resetSession()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="screen" style={{ gap: '30px' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 400 }}>
        Seance terminee
      </h2>

      <div className="card" style={{
        width: '280px',
        height: '280px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff'
      }}>
        {/* QR code will be generated server-side by n8n */}
        {/* This is a placeholder - in production, the rapport_url from the API */}
        <div style={{
          width: '200px',
          height: '200px',
          background: '#e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#475569',
          fontSize: '0.9rem',
          textAlign: 'center',
          borderRadius: '8px'
        }}>
          QR Code du rapport<br />
          (genere par n8n)
        </div>
      </div>

      <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: '400px' }}>
        Scannez ce QR code pour acceder a votre rapport d'analyse capillaire.
        Le rapport sera egalement envoye par email si disponible.
      </p>

      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
        Retour automatique dans {countdown}s
      </p>

      <button className="btn-secondary" onClick={resetSession}>
        Retour a l'accueil
      </button>
    </div>
  )
}
