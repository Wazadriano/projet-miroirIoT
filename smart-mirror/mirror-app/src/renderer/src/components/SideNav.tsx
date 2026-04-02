interface SideNavProps {
  onHome?: () => void
  onUser?: () => void
  onCamera?: () => void
}

export function SideNav({ onHome, onUser, onCamera }: SideNavProps): JSX.Element {
  const btnStyle: React.CSSProperties = {
    width: '11vw',
    height: '11vw',
    borderRadius: '50%',
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text)',
    padding: 0,
    minWidth: 'unset',
    minHeight: 'unset',
    border: 'none',
    cursor: 'pointer'
  }

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: '15vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4vw',
      padding: '5vw 2vw',
      background: 'var(--color-glass-bg)',
      backdropFilter: 'blur(10px)',
      boxShadow: 'inset 0px 0px 0.5vw 0px var(--color-shadow-gold)',
      borderRadius: '2.5vw 0 0 2.5vw',
      zIndex: 10
    }}>
      {onHome && (
        <button onClick={onHome} style={btnStyle}>
          <svg width="6vw" height="6vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          </svg>
        </button>
      )}
      {onUser && (
        <button onClick={onUser} style={{...btnStyle, color: 'var(--color-accent)'}}>
          <svg width="6vw" height="6vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      )}
      {onCamera && (
        <button onClick={onCamera} style={{...btnStyle, color: 'var(--color-accent)'}}>
          <svg width="5.5vw" height="5.5vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </button>
      )}
    </div>
  )
}
