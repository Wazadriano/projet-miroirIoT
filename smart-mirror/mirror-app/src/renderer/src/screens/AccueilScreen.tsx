import { useState, useEffect } from 'react'
import { useSessionStore } from '../stores/session.store'
import { SideNav } from '../components/SideNav'

function InstagramQR(): JSX.Element {
  // QR code for Instagram - rendered as img from local backend at startup
  const [qrSrc, setQrSrc] = useState<string | null>(null)
  useEffect(() => {
    // Generate QR via local API endpoint or use a static fallback
    const url = 'https://www.instagram.com/koreancosmetics.fr/?hl=fr'
    import('qrcode').then(QRCode => {
      QRCode.toDataURL(url, { width: 200, margin: 1, color: { dark: '#000000', light: '#FFFFFF' } })
        .then((dataUrl: string) => setQrSrc(dataUrl))
        .catch(() => {})
    }).catch(() => {})
  }, [])

  if (qrSrc) {
    return <img src={qrSrc} alt="Instagram QR" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
  }

  // Fallback: Instagram icon
  return (
    <svg viewBox="0 0 24 24" width="60%" height="60%" fill="none" stroke="#000" strokeWidth="1.5">
      <rect x="2" y="2" width="20" height="20" rx="5"/>
      <circle cx="12" cy="12" r="5"/>
      <circle cx="17.5" cy="6.5" r="1.5" fill="#000" stroke="none"/>
    </svg>
  )
}

export function AccueilScreen(): JSX.Element {
  const { setScreen } = useSessionStore()

  return (
    <div className="screen" style={{ justifyContent: 'center', gap: '3vh' }}>
      <h1 className="title-xl" style={{ maxWidth: '82vw', zIndex: 1, whiteSpace: 'pre-line' }}>
        {'Vivez l\'experience\nBubble Hair Spa\nCoreen'}
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3vh', marginTop: '5vh', zIndex: 1 }}>
        <button
          className="glass-btn"
          onClick={() => setScreen('search')}
          style={{ width: '47.5vw' }}
        >
          CONNEXION
        </button>
        <button
          className="glass-btn"
          onClick={() => setScreen('new-client')}
          style={{ width: '47.5vw' }}
        >
          INSCRIPTION
        </button>
      </div>

      <SideNav
        onHome={() => setScreen('home')}
        onUser={() => setScreen('search')}
      />

      {/* QR Instagram */}
      <div style={{
        position: 'absolute',
        bottom: '8vh',
        left: '6vw',
        width: '18vw',
        height: '18vw',
        borderRadius: '3vw',
        background: '#FFFFFF',
        boxShadow: '0px 0px 1vw 0.5vw var(--color-shadow-gold-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        overflow: 'hidden'
      }}>
        <InstagramQR />
      </div>

      <p className="body-sm" style={{
        position: 'absolute',
        bottom: '4vh',
        left: '6vw',
        width: '18vw',
        textAlign: 'center',
        opacity: 0.6,
        zIndex: 1
      }}>
        Instagram
      </p>
    </div>
  )
}
