import { useSessionStore } from '../stores/session.store'

export function StatusBar(): JSX.Element {
  const { wifiConnected, microscopeConnected, syncQueueSize } = useSessionStore()

  const isDegraded = !wifiConnected || syncQueueSize > 0

  return (
    <>
      {/* Degraded mode banner */}
      {!wifiConnected && (
        <div style={{
          position: 'fixed',
          top: '40px',
          left: 0,
          right: 0,
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-error)',
          color: '#fff',
          fontSize: '0.8rem',
          fontWeight: 600,
          zIndex: 51,
          letterSpacing: '0.05em'
        }}>
          MODE HORS LIGNE — reconnexion automatique en cours
        </div>
      )}

      <div className="status-bar">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ color: wifiConnected ? 'var(--color-success)' : 'var(--color-error)' }}>
            WiFi {wifiConnected ? 'OK' : 'OFF'}
          </span>
          <span style={{ color: microscopeConnected ? 'var(--color-success)' : 'var(--color-warning)' }}>
            Microscope {microscopeConnected ? 'OK' : '--'}
          </span>
          {syncQueueSize > 0 && (
            <span style={{ color: 'var(--color-warning)' }}>
              Sync: {syncQueueSize} en attente
            </span>
          )}
          {isDegraded && wifiConnected && (
            <span style={{ color: 'var(--color-warning)' }}>
              Mode degrade
            </span>
          )}
        </div>
        <div>
          {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </>
  )
}
