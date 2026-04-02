interface HeaderProps {
  subtitle?: string
}

export function Header({ subtitle }: HeaderProps): JSX.Element {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{
        width: '100%',
        padding: '20px 20px 10px',
        textAlign: 'center'
      }}>
        <h1 className="title-lg" style={{ letterSpacing: '1px' }}>
          KBEAUTY - BUBBLE HAIR SPA
        </h1>
      </div>
      <div style={{
        width: '100%',
        height: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-glass-bg)',
        backdropFilter: 'blur(10px)',
        boxShadow: 'inset 0px 0px 10px 0px var(--color-shadow-gold)'
      }}>
        {subtitle && (
          <span className="title-sm">{subtitle}</span>
        )}
      </div>
    </div>
  )
}
