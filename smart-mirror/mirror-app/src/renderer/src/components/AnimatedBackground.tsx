interface AnimatedBackgroundProps {
  enabled: boolean
  theme: string
  suspended: boolean
}

export function AnimatedBackground({ enabled, suspended }: AnimatedBackgroundProps): JSX.Element | null {
  if (!enabled || suspended) return null

  return (
    <div className="bg-animated">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />
      <div className="bg-orb bg-orb-4" />
      <div className="bg-orb bg-orb-5" />
    </div>
  )
}
