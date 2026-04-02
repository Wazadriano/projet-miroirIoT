import { type CSSProperties, type ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  opacity?: number
  borderRadius?: number | string
  className?: string
  style?: CSSProperties
  subtle?: boolean
}

export function GlassCard({ children, opacity, borderRadius, className, style, subtle }: GlassCardProps): JSX.Element {
  return (
    <div
      className={subtle ? 'glass-card-subtle' : 'glass-card'}
      style={{
        ...(opacity !== undefined && { opacity }),
        ...(borderRadius !== undefined && { borderRadius }),
        ...style
      }}
    >
      {children}
    </div>
  )
}
