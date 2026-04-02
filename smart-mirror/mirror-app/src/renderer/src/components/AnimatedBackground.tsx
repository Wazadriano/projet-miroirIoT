import backgroundImage from '../assets/background-golden-1874d7.png'

interface AnimatedBackgroundProps {
  enabled: boolean
  theme: string
  suspended: boolean
}

export function AnimatedBackground({ enabled, suspended }: AnimatedBackgroundProps): JSX.Element | null {
  if (!enabled || suspended) return null

  return (
    <div className="bg-animated">
      <img src={backgroundImage} alt="" className="bg-animate-img" />
    </div>
  )
}
