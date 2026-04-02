import { useSessionStore } from '../stores/session.store'
import { SideNav } from '../components/SideNav'

export function AccueilScreen(): JSX.Element {
  const { setScreen } = useSessionStore()

  return (
    <div className="screen" style={{ justifyContent: 'center', gap: 24 }}>
      <h1 className="title-xl" style={{ maxWidth: 330, zIndex: 1 }}>
        Vivez l'experience{'\n'}Bubble Hair Spa{'\n'}Coreen
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 40, zIndex: 1 }}>
        <button
          className="glass-btn"
          onClick={() => setScreen('search')}
          style={{ width: 190, height: 50 }}
        >
          CONNEXION
        </button>
        <button
          className="glass-btn"
          onClick={() => setScreen('new-client')}
          style={{ width: 190, height: 50 }}
        >
          INSCRIPTION
        </button>
      </div>

      <SideNav
        onHome={() => setScreen('home')}
        onUser={() => setScreen('search')}
      />

      <p className="body-sm" style={{
        position: 'absolute',
        bottom: 30,
        left: 20,
        opacity: 0.6,
        zIndex: 1
      }}>
        Instagram
      </p>
    </div>
  )
}
