import { useSessionStore } from '../stores/session.store'
import { SideNav } from '../components/SideNav'

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

      {/* Profil boutique */}
      <div style={{
        position: 'absolute',
        bottom: '10vh',
        left: '8vw',
        width: '14.5vw',
        height: '14.5vw',
        borderRadius: '50%',
        background: 'var(--color-glass-bg)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0px 0px 1vw 0.5vw var(--color-shadow-gold-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        overflow: 'hidden'
      }}>
        <span style={{ fontSize: 'var(--fs-body-sm)', opacity: 0.4 }}>Photo</span>
      </div>

      <p className="body-sm" style={{
        position: 'absolute',
        bottom: '4vh',
        left: '5vw',
        opacity: 0.6,
        zIndex: 1
      }}>
        Instagram
      </p>
    </div>
  )
}
