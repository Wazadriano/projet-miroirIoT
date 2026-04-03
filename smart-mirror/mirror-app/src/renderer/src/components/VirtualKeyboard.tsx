import { useState, useRef, useCallback } from 'react'
import Keyboard from 'react-simple-keyboard'
import 'react-simple-keyboard/build/css/index.css'

interface VirtualKeyboardProps {
  visible: boolean
  onInput: (key: string) => void
  onClose: () => void
  layout?: 'default' | 'numeric'
}

type KbSize = 'small' | 'medium' | 'large'

const SIZES: Record<KbSize, { width: string; btnH: string; fontSize: string; gap: string }> = {
  small:  { width: '40vw', btnH: '3.5vw', fontSize: '1.8vw', gap: '0.3vw' },
  medium: { width: '60vw', btnH: '5vw',   fontSize: '2.5vw', gap: '0.5vw' },
  large:  { width: '85vw', btnH: '7vw',   fontSize: '3.5vw', gap: '0.7vw' }
}

export function VirtualKeyboard({ visible, onInput, onClose, layout = 'default' }: VirtualKeyboardProps): JSX.Element | null {
  const [minimized, setMinimized] = useState(false)
  const [size, setSize] = useState<KbSize>('medium')
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })

  const onDragStart = useCallback((e: React.PointerEvent) => {
    isDragging.current = true
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
    dragStart.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onDragMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return
    setPos({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y })
  }, [])

  const onDragEnd = useCallback(() => { isDragging.current = false }, [])

  const cycleSize = (): void => {
    setSize(s => s === 'small' ? 'medium' : s === 'medium' ? 'large' : 'small')
  }

  if (!visible) return null

  const layouts = layout === 'numeric'
    ? { default: ['1 2 3', '4 5 6', '7 8 9', '/ 0 {bksp}', '{enter}'] }
    : {
        default: [
          '1 2 3 4 5 6 7 8 9 0',
          'a z e r t y u i o p',
          'q s d f g h j k l m',
          '{shift} w x c v b n {bksp}',
          '{space} . @ - {enter}'
        ],
        shift: [
          '1 2 3 4 5 6 7 8 9 0',
          'A Z E R T Y U I O P',
          'Q S D F G H J K L M',
          '{shift} W X C V B N {bksp}',
          '{space} . @ - {enter}'
        ]
      }

  const handleKeyPress = (button: string): void => {
    if (button === '{enter}') { onClose(); return }
    onInput(button)
  }

  const s = SIZES[size]

  if (minimized) {
    return (
      <div style={{
        position: 'fixed', bottom: '2vh', left: '50%', transform: 'translateX(-50%)',
        zIndex: 200, display: 'flex', gap: '2vw'
      }}>
        <button className="glass-btn" onClick={() => setMinimized(false)}
          style={{ fontSize: 'var(--fs-body-sm)', padding: '1.5vw 4vw', minHeight: '6vw' }}>
          Clavier
        </button>
      </div>
    )
  }

  const left = pos ? pos.x : `calc(50vw - ${parseInt(s.width) / 2}vw)`

  return (
    <div className="keyboard-container" style={{
      position: 'fixed',
      left: pos ? pos.x : undefined,
      top: pos ? pos.y : undefined,
      bottom: pos ? undefined : '2vh',
      right: pos ? undefined : undefined,
      ...(pos ? {} : { left: '50%', transform: 'translateX(-50%)' }),
      width: s.width,
      zIndex: 200,
      borderRadius: '2vw',
      background: 'rgba(15, 15, 26, 0.95)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(212, 163, 142, 0.3)',
      overflow: 'hidden'
    }}>
      {/* Handle bar */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.8vw 2vw', cursor: 'grab', userSelect: 'none', touchAction: 'none'
        }}
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
      >
        <div style={{ width: '8vw', height: '0.6vw', borderRadius: '1vw', background: 'rgba(212, 163, 142, 0.5)' }} />
        <div style={{ display: 'flex', gap: '2vw', alignItems: 'center' }}>
          <button onClick={cycleSize} style={{
            background: 'transparent', border: '1px solid rgba(212, 163, 142, 0.3)', color: '#E8C9B5',
            fontSize: '1.5vw', cursor: 'pointer', padding: '0.3vw 1.5vw', borderRadius: '1vw',
            minHeight: 'unset', minWidth: 'unset', fontFamily: 'Montserrat, sans-serif'
          }}>{size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L'}</button>
          <button onClick={() => setMinimized(true)} style={{
            background: 'transparent', border: 'none', color: '#E8C9B5',
            fontSize: '2vw', cursor: 'pointer', padding: '0.5vw', minHeight: 'unset', minWidth: 'unset'
          }}>_</button>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: '#E8C9B5',
            fontSize: '2vw', cursor: 'pointer', padding: '0.5vw', minHeight: 'unset', minWidth: 'unset'
          }}>X</button>
        </div>
      </div>

      <div style={{ padding: '0 1.5vw 1.5vw' }}>
        <Keyboard
          layout={layouts}
          onKeyPress={handleKeyPress}
          theme="hg-theme-default kb-glass"
          display={{ '{bksp}': '⌫', '{enter}': '↵', '{space}': ' ', '{shift}': '⇧' }}
        />
      </div>

      <style>{`
        .kb-glass, .kb-glass .hg-rows, .kb-glass .hg-row {
          background: transparent !important;
        }
        .kb-glass .hg-row { gap: ${s.gap} !important; margin-bottom: ${s.gap} !important; }
        .kb-glass .hg-button {
          background: rgba(232, 201, 181, 0.12) !important;
          color: #FFFFFF !important;
          border: 1px solid rgba(212, 163, 142, 0.25) !important;
          box-shadow: inset 0 0 5px rgba(212, 163, 142, 0.15) !important;
          border-radius: 1.2vw !important;
          font-size: ${s.fontSize} !important;
          height: ${s.btnH} !important;
          font-family: 'Montserrat', sans-serif !important;
        }
        .kb-glass .hg-button:active, .kb-glass .hg-button.hg-activeButton {
          background: rgba(232, 201, 181, 0.35) !important;
        }
        .kb-glass .hg-button span { color: #FFFFFF !important; }
      `}</style>
    </div>
  )
}
