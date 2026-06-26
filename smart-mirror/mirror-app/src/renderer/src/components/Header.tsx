interface HeaderProps {
  subtitle?: string
}

export function Header({ subtitle }: HeaderProps): JSX.Element {
  return (
    <div style={{
      position: 'fixed',
      top: '4.4vh',
      left: 0,
      right: 0,
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{
        width: '100%',
        padding: '1.6vw 5vw 1.2vw',
        textAlign: 'center'
      }}>
        <h1 className="title-md" style={{
          letterSpacing: '0.15vw',
          whiteSpace: 'nowrap',
          textAlign: 'center'
        }}>
          KBEAUTY - BUBBLE HAIR SPA
        </h1>
      </div>
      <div style={{
        width: '100%',
        height: '4.2vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-glass-bg)',
        backdropFilter: 'blur(10px)',
        boxShadow: 'inset 0px 0px 2.5vw 0px var(--color-shadow-gold)'
      }}>
        {subtitle && (
          <span className="title-sm">{subtitle}</span>
        )}
      </div>
    </div>
  )
}
