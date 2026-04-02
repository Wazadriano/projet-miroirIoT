import { useEffect, useState } from 'react'
import { useSessionStore } from '../stores/session.store'

export function QRCodeScreen(): JSX.Element {
  const { resetSession, setScreen } = useSessionStore()
  const [countdown, setCountdown] = useState(30)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          resetSession()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [resetSession])

  return (
    <div className="screen" style={{ gap: 24 }}>
      <h2 className="title-xl" style={{ zIndex: 1, maxWidth: 300 }}>
        Retrouvez votre bilan
      </h2>

      {/* QR placeholder */}
      <div style={{
        width: 200,
        height: 200,
        background: '#FFFFFF',
        borderRadius: 25,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        boxShadow: '0px 0px 4px 2px var(--color-shadow-gold-light)'
      }}>
        <svg width="150" height="150" viewBox="0 0 150 150">
          <rect x="10" y="10" width="40" height="40" fill="#000" rx="4"/>
          <rect x="100" y="10" width="40" height="40" fill="#000" rx="4"/>
          <rect x="10" y="100" width="40" height="40" fill="#000" rx="4"/>
          <rect x="60" y="60" width="30" height="30" fill="#000" rx="2"/>
          <rect x="15" y="15" width="30" height="30" fill="#FFF" rx="2"/>
          <rect x="20" y="20" width="20" height="20" fill="#000" rx="2"/>
          <rect x="105" y="15" width="30" height="30" fill="#FFF" rx="2"/>
          <rect x="110" y="20" width="20" height="20" fill="#000" rx="2"/>
          <rect x="15" y="105" width="30" height="30" fill="#FFF" rx="2"/>
          <rect x="20" y="110" width="20" height="20" fill="#000" rx="2"/>
        </svg>
      </div>

      <p className="body-sm" style={{ opacity: 0.5, zIndex: 1 }}>
        Retour automatique dans {countdown}s
      </p>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, zIndex: 1, width: '100%', maxWidth: 250 }}>
        <button className="glass-btn" onClick={() => { resetSession() }} style={{ width: '100%' }}>
          VEILLE
        </button>
        <button className="glass-btn" onClick={() => setScreen('comparison')} style={{ width: '100%' }}>
          AVANT / APRES
        </button>
        <button className="glass-btn" onClick={() => {}} style={{ width: '100%' }}>
          CONSEIL
        </button>
      </div>
    </div>
  )
}
