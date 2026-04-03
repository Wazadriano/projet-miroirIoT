import { useSessionStore } from '../stores/session.store'
import { SideNav } from '../components/SideNav'

function InstagramQR(): JSX.Element {
  return (
    <svg viewBox="0 0 29 29" width="100%" height="100%" style={{ padding: '8%' }}>
      <rect width="29" height="29" fill="white" rx="2"/>
      <g fill="black">
        <rect x="1" y="1" width="7" height="7"/><rect x="2" y="2" width="5" height="5" fill="white"/><rect x="3" y="3" width="3" height="3"/>
        <rect x="21" y="1" width="7" height="7"/><rect x="22" y="2" width="5" height="5" fill="white"/><rect x="23" y="3" width="3" height="3"/>
        <rect x="1" y="21" width="7" height="7"/><rect x="2" y="22" width="5" height="5" fill="white"/><rect x="3" y="23" width="3" height="3"/>
        <rect x="9" y="1" width="1" height="1"/><rect x="11" y="1" width="1" height="1"/><rect x="13" y="1" width="1" height="1"/>
        <rect x="9" y="3" width="1" height="1"/><rect x="11" y="3" width="3" height="1"/><rect x="15" y="2" width="1" height="1"/>
        <rect x="9" y="5" width="3" height="1"/><rect x="13" y="5" width="1" height="1"/><rect x="17" y="5" width="1" height="1"/>
        <rect x="9" y="7" width="1" height="1"/><rect x="12" y="7" width="1" height="1"/><rect x="15" y="7" width="2" height="1"/>
        <rect x="1" y="9" width="1" height="1"/><rect x="3" y="9" width="2" height="1"/><rect x="7" y="9" width="1" height="1"/>
        <rect x="10" y="9" width="1" height="1"/><rect x="13" y="9" width="1" height="1"/><rect x="16" y="9" width="1" height="1"/>
        <rect x="19" y="9" width="2" height="1"/><rect x="22" y="9" width="1" height="1"/><rect x="25" y="9" width="1" height="1"/>
        <rect x="1" y="11" width="2" height="1"/><rect x="5" y="11" width="1" height="1"/><rect x="9" y="11" width="1" height="1"/>
        <rect x="12" y="11" width="3" height="1"/><rect x="17" y="11" width="1" height="1"/><rect x="20" y="11" width="2" height="1"/>
        <rect x="2" y="13" width="1" height="1"/><rect x="5" y="13" width="2" height="1"/><rect x="9" y="13" width="2" height="1"/>
        <rect x="13" y="13" width="3" height="3"/><rect x="18" y="13" width="1" height="1"/><rect x="21" y="13" width="1" height="1"/>
        <rect x="1" y="15" width="1" height="1"/><rect x="4" y="15" width="1" height="1"/><rect x="7" y="15" width="1" height="1"/>
        <rect x="10" y="15" width="1" height="1"/><rect x="18" y="15" width="2" height="1"/><rect x="22" y="15" width="1" height="1"/>
        <rect x="2" y="17" width="2" height="1"/><rect x="6" y="17" width="1" height="1"/><rect x="9" y="17" width="1" height="1"/>
        <rect x="12" y="17" width="1" height="1"/><rect x="15" y="17" width="2" height="1"/><rect x="19" y="17" width="1" height="1"/>
        <rect x="1" y="19" width="1" height="1"/><rect x="4" y="19" width="2" height="1"/><rect x="8" y="19" width="1" height="1"/>
        <rect x="11" y="19" width="1" height="1"/><rect x="14" y="19" width="1" height="1"/><rect x="17" y="19" width="2" height="1"/>
        <rect x="9" y="21" width="2" height="1"/><rect x="13" y="21" width="1" height="1"/><rect x="16" y="21" width="1" height="1"/>
        <rect x="19" y="21" width="2" height="1"/><rect x="23" y="21" width="1" height="1"/><rect x="26" y="21" width="1" height="1"/>
        <rect x="9" y="23" width="1" height="1"/><rect x="12" y="23" width="2" height="1"/><rect x="16" y="23" width="1" height="1"/>
        <rect x="20" y="23" width="1" height="1"/><rect x="24" y="23" width="2" height="1"/>
        <rect x="9" y="25" width="2" height="1"/><rect x="14" y="25" width="1" height="1"/><rect x="18" y="25" width="1" height="1"/>
        <rect x="21" y="25" width="2" height="1"/><rect x="25" y="25" width="1" height="1"/>
        <rect x="10" y="27" width="1" height="1"/><rect x="13" y="27" width="2" height="1"/><rect x="17" y="27" width="1" height="1"/>
        <rect x="20" y="27" width="3" height="1"/><rect x="25" y="27" width="2" height="1"/>
      </g>
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
