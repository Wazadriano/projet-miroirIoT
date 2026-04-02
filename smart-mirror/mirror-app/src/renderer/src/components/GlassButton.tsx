import { type CSSProperties, type ReactNode } from 'react'

interface GlassButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'default' | 'large' | 'pill'
  style?: CSSProperties
}

export function GlassButton({ children, onClick, disabled, variant = 'default', style }: GlassButtonProps): JSX.Element {
  const baseStyle: CSSProperties = {
    ...(variant === 'large' && { width: 190, height: 50 }),
    ...(variant === 'pill' && { fontSize: 14, padding: '4px 16px', minHeight: 30 }),
    ...style
  }

  return (
    <button
      className="glass-btn"
      onClick={onClick}
      disabled={disabled}
      style={baseStyle}
    >
      {children}
    </button>
  )
}
