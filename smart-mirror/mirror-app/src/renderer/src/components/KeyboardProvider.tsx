import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { VirtualKeyboard } from './VirtualKeyboard'

interface KeyboardContextType {
  showKeyboard: boolean
  minimized: boolean
  toggleMinimize: () => void
}

const KeyboardContext = createContext<KeyboardContextType>({ showKeyboard: false, minimized: false, toggleMinimize: () => {} })

export function useKeyboard(): KeyboardContextType {
  return useContext(KeyboardContext)
}

export function KeyboardProvider({ children }: { children: ReactNode }): JSX.Element {
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const activeInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const [layout, setLayout] = useState<'default' | 'numeric'>('default')

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent): void => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const input = target as HTMLInputElement | HTMLTextAreaElement
        if (input.closest('.keyboard-container')) return
        activeInputRef.current = input
        setLayout(input.type === 'number' ? 'numeric' : 'default')
        setShowKeyboard(true)
      }
    }

    document.addEventListener('focusin', handleFocusIn)
    return () => document.removeEventListener('focusin', handleFocusIn)
  }, [])

  const handleInput = useCallback((key: string) => {
    const input = activeInputRef.current
    if (!input) return

    input.focus()

    const start = input.selectionStart ?? input.value.length
    const end = input.selectionEnd ?? input.value.length
    const val = input.value

    let newVal: string
    let cursorPos: number

    if (key === '{bksp}') {
      if (start === 0 && start === end) return
      newVal = val.substring(0, Math.max(0, start - 1)) + val.substring(end)
      cursorPos = Math.max(0, start - 1)
    } else if (key === '{shift}') {
      return
    } else if (key === '{space}') {
      newVal = val.substring(0, start) + ' ' + val.substring(end)
      cursorPos = start + 1
    } else {
      newVal = val.substring(0, start) + key + val.substring(end)
      cursorPos = start + 1
    }

    const nativeSetter = Object.getOwnPropertyDescriptor(
      input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
      'value'
    )?.set

    if (nativeSetter) {
      nativeSetter.call(input, newVal)
    } else {
      input.value = newVal
    }

    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))

    requestAnimationFrame(() => {
      input.setSelectionRange(cursorPos, cursorPos)
    })
  }, [])

  const handleClose = useCallback(() => {
    setShowKeyboard(false)
    setMinimized(false)
    activeInputRef.current = null
  }, [])

  const toggleMinimize = useCallback(() => {
    setMinimized(m => !m)
  }, [])

  return (
    <KeyboardContext.Provider value={{ showKeyboard, minimized, toggleMinimize }}>
      {children}
      <VirtualKeyboard
        visible={showKeyboard}
        minimized={minimized}
        onInput={handleInput}
        onClose={handleClose}
        onToggleMinimize={toggleMinimize}
        layout={layout}
      />
    </KeyboardContext.Provider>
  )
}
