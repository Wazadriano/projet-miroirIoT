import { useCallback, useMemo } from 'react'
import Particles from 'react-tsparticles'
import { loadSlim } from 'tsparticles-slim'
import type { Engine } from 'tsparticles-engine'

interface AnimatedBackgroundProps {
  enabled: boolean
  theme: string
  suspended: boolean
}

const THEME_CONFIGS: Record<string, object> = {
  particles: {
    particles: {
      number: { value: 40, density: { enable: true, area: 800 } },
      color: { value: '#8B5CF6' },
      opacity: { value: 0.3, random: true },
      size: { value: { min: 1, max: 4 }, random: true },
      move: {
        enable: true,
        speed: 0.8,
        direction: 'none',
        outModes: { default: 'out' }
      },
      links: {
        enable: true,
        distance: 150,
        color: '#8B5CF6',
        opacity: 0.15,
        width: 1
      }
    }
  },
  aurora: {
    particles: {
      number: { value: 20 },
      color: { value: ['#22C55E', '#06B6D4', '#8B5CF6'] },
      opacity: { value: 0.3, animation: { enable: true, speed: 0.5, minimumValue: 0.1 } },
      size: { value: { min: 50, max: 150 }, random: true },
      move: {
        enable: true,
        speed: 0.3,
        direction: 'top',
        outModes: { default: 'out' }
      },
      shape: { type: 'circle' }
    }
  },
  waves: {
    particles: {
      number: { value: 30 },
      color: { value: '#3B82F6' },
      opacity: { value: 0.2, random: true },
      size: { value: { min: 2, max: 6 } },
      move: {
        enable: true,
        speed: 1.2,
        direction: 'right',
        straight: false,
        outModes: { default: 'out' }
      }
    }
  }
}

export function AnimatedBackground({ enabled, theme, suspended }: AnimatedBackgroundProps): JSX.Element | null {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine)
  }, [])

  const config = useMemo(() => {
    const base = THEME_CONFIGS[theme] || THEME_CONFIGS.particles
    return {
      fullScreen: false,
      detectRetina: true,
      fpsLimit: 30,
      ...base
    }
  }, [theme])

  if (!enabled || suspended) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none'
    }}>
      <Particles
        id="animated-bg"
        init={particlesInit}
        options={config}
      />
    </div>
  )
}
