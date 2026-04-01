import { create } from 'zustand'

type Screen =
  | 'home'
  | 'search'
  | 'new-client'
  | 'consent'
  | 'session'
  | 'comparison'
  | 'qrcode'
  | 'provisioning'

interface PhotoCapture {
  photoId: string
  localPath: string
  thumbnailBase64: string
  diagnostic: Diagnostic | null
  phase: 'avant' | 'apres'
}

interface SessionState {
  screen: Screen
  isProvisioned: boolean

  // Current session data
  cliente: Cliente | null
  consentement: Consentement | null
  seance: Seance | null
  photosAvant: PhotoCapture[]
  photosApres: PhotoCapture[]

  // Last full-res capture (single photo in memory at a time)
  lastCaptureBase64: string | null

  // Microscope
  microscopeConnected: boolean
  microscopeDevice: MicroscopeDevice | null

  // Network
  wifiConnected: boolean
  syncQueueSize: number

  // Actions
  setScreen: (screen: Screen) => void
  setProvisioned: (value: boolean) => void
  setCliente: (cliente: Cliente | null) => void
  setConsentement: (consent: Consentement | null) => void
  setSeance: (seance: Seance | null) => void
  addPhoto: (photo: PhotoCapture) => void
  setLastCapture: (base64: string | null) => void
  updatePhotoDiagnostic: (photoId: string, diagnostic: Diagnostic) => void
  setMicroscope: (connected: boolean, device: MicroscopeDevice | null) => void
  setWifiConnected: (connected: boolean) => void
  setSyncQueueSize: (size: number) => void
  resetSession: () => void
}

const initialSessionState = {
  cliente: null,
  consentement: null,
  seance: null,
  photosAvant: [] as PhotoCapture[],
  photosApres: [] as PhotoCapture[],
  lastCaptureBase64: null as string | null
}

export const useSessionStore = create<SessionState>((set) => ({
  screen: 'home',
  isProvisioned: false,
  ...initialSessionState,
  microscopeConnected: false,
  microscopeDevice: null,
  wifiConnected: true,
  syncQueueSize: 0,

  setScreen: (screen) => set({ screen }),
  setProvisioned: (value) => set({ isProvisioned: value }),
  setCliente: (cliente) => set({ cliente }),
  setConsentement: (consent) => set({ consentement: consent }),
  setSeance: (seance) => set({ seance }),

  addPhoto: (photo) => set((state) => {
    if (photo.phase === 'avant') {
      return { photosAvant: [...state.photosAvant, photo] }
    }
    return { photosApres: [...state.photosApres, photo] }
  }),

  setLastCapture: (base64) => set({ lastCaptureBase64: base64 }),

  updatePhotoDiagnostic: (photoId, diagnostic) => set((state) => ({
    photosAvant: state.photosAvant.map(p =>
      p.photoId === photoId ? { ...p, diagnostic } : p
    ),
    photosApres: state.photosApres.map(p =>
      p.photoId === photoId ? { ...p, diagnostic } : p
    )
  })),

  setMicroscope: (connected, device) => set({
    microscopeConnected: connected,
    microscopeDevice: device
  }),

  setWifiConnected: (connected) => set({ wifiConnected: connected }),
  setSyncQueueSize: (size) => set({ syncQueueSize: size }),

  resetSession: () => set({
    ...initialSessionState,
    screen: 'home'
  })
}))

// Helper: generate a small thumbnail from a canvas to avoid storing full-res in memory
export function generateThumbnail(canvas: HTMLCanvasElement, maxSize = 160): string {
  if (!canvas.width || !canvas.height) {
    // Return 1x1 transparent pixel as safe fallback
    return '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAFBABAAAAAAAAAAAAAAAAAAAAf/aAAwDAQACEQMRAD8AJQD/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/AB//2Q=='
  }
  const thumbCanvas = document.createElement('canvas')
  const ratio = Math.min(maxSize / canvas.width, maxSize / canvas.height)
  thumbCanvas.width = Math.round(canvas.width * ratio)
  thumbCanvas.height = Math.round(canvas.height * ratio)
  const ctx = thumbCanvas.getContext('2d')
  if (ctx) {
    ctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height)
  }
  return thumbCanvas.toDataURL('image/jpeg', 0.6).split(',')[1]
}
