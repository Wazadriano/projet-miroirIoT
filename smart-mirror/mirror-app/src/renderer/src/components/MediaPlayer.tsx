import { useState, useRef, useEffect, useCallback } from 'react'

interface MediaItem {
  id: string
  type: 'video' | 'image'
  src: string
  nom_fichier: string
}

interface MediaPlayerProps {
  playlist: MediaItem[]
  mode: 'fullscreen' | 'side_panel' | 'hidden'
  volume: number
  onFullscreenChange?: (isFullscreen: boolean) => void
}

const IMAGE_DISPLAY_DURATION = 8000

export function MediaPlayer({ playlist, mode, volume, onFullscreenChange }: MediaPlayerProps): JSX.Element | null {
  const [currentIndex, setCurrentIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentItem = playlist[currentIndex]

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % playlist.length)
  }, [playlist.length])

  // Handle video end -> next
  useEffect(() => {
    const video = videoRef.current
    if (!video || !currentItem || currentItem.type !== 'video') return

    video.volume = volume / 100
    const handleEnded = (): void => goToNext()
    video.addEventListener('ended', handleEnded)
    return () => video.removeEventListener('ended', handleEnded)
  }, [currentIndex, currentItem, volume, goToNext])

  // Handle image timer -> next
  useEffect(() => {
    if (!currentItem || currentItem.type !== 'image') return

    timerRef.current = setTimeout(goToNext, IMAGE_DISPLAY_DURATION)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [currentIndex, currentItem, goToNext])

  // Notify parent about fullscreen state
  useEffect(() => {
    onFullscreenChange?.(mode === 'fullscreen')
  }, [mode, onFullscreenChange])

  if (mode === 'hidden' || playlist.length === 0) return null

  const containerStyle: React.CSSProperties = mode === 'fullscreen'
    ? { position: 'fixed', inset: 0, zIndex: 5, background: '#000' }
    : {
        position: 'fixed',
        right: 0,
        top: '40px',
        bottom: 0,
        width: '33.33%',
        zIndex: 5,
        background: '#000',
        borderLeft: '1px solid #1E293B'
      }

  if (!currentItem) return null

  return (
    <div style={containerStyle}>
      {currentItem.type === 'video' ? (
        <video
          ref={videoRef}
          key={currentItem.id}
          src={currentItem.src}
          autoPlay
          muted={volume === 0}
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />
      ) : (
        <img
          key={currentItem.id}
          src={currentItem.src}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />
      )}
    </div>
  )
}
