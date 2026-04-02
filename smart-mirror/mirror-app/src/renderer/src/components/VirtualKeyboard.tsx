import { useRef, useEffect } from 'react'
import Keyboard from 'react-simple-keyboard'
import 'react-simple-keyboard/build/css/index.css'

interface VirtualKeyboardProps {
  visible: boolean
  onInput: (value: string) => void
  onClose: () => void
  layout?: 'default' | 'numeric'
}

export function VirtualKeyboard({ visible, onInput, onClose, layout = 'default' }: VirtualKeyboardProps): JSX.Element | null {
  const keyboardRef = useRef<typeof Keyboard>(null)

  useEffect(() => {
    if (!visible) return
    const handleClickOutside = (e: MouseEvent): void => {
      const target = e.target as HTMLElement
      if (!target.closest('.keyboard-container') && !target.closest('input') && !target.closest('textarea')) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [visible, onClose])

  if (!visible) return null

  const layouts = layout === 'numeric'
    ? { default: ['1 2 3', '4 5 6', '7 8 9', '{bksp} 0 {enter}'] }
    : {
        default: [
          'a z e r t y u i o p',
          'q s d f g h j k l m',
          '{shift} w x c v b n {bksp}',
          '{space} . @ {enter}'
        ],
        shift: [
          'A Z E R T Y U I O P',
          'Q S D F G H J K L M',
          '{shift} W X C V B N {bksp}',
          '{space} . @ {enter}'
        ]
      }

  return (
    <div className="keyboard-container" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 200,
      background: 'rgba(15, 15, 26, 0.95)',
      backdropFilter: 'blur(10px)',
      padding: '2vw',
      borderTop: '1px solid var(--color-shadow-gold)'
    }}>
      <Keyboard
        keyboardRef={(r: typeof Keyboard) => { keyboardRef.current = r }}
        layout={layouts}
        onChange={onInput}
        theme="hg-theme-default keyboard-glass"
        display={{
          '{bksp}': '⌫',
          '{enter}': '↵',
          '{space}': ' ',
          '{shift}': '⇧'
        }}
      />
      <style>{`
        .keyboard-glass .hg-button {
          background: var(--color-glass-bg) !important;
          color: var(--color-text) !important;
          border: none !important;
          box-shadow: inset 0 0 5px rgba(212, 163, 142, 0.3) !important;
          border-radius: 8px !important;
          font-size: 3.5vw !important;
          height: 8vw !important;
          font-family: var(--font-body) !important;
        }
        .keyboard-glass .hg-button:active {
          background: rgba(232, 201, 181, 0.2) !important;
        }
        .keyboard-glass .hg-row {
          gap: 1vw !important;
          margin-bottom: 1vw !important;
        }
        .keyboard-glass {
          background: transparent !important;
        }
      `}</style>
    </div>
  )
}
