import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: '' })
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          background: '#0F0F1A',
          color: '#FFFFFF',
          fontFamily: 'Montserrat, sans-serif'
        }}>
          <p style={{ fontSize: 18, fontFamily: 'Playfair Display, serif' }}>Une erreur est survenue</p>
          <p style={{ fontSize: 12, opacity: 0.5, maxWidth: 300, textAlign: 'center' }}>{this.state.error}</p>
          <button
            onClick={this.handleReset}
            className="glass-btn"
            style={{ marginTop: 16 }}
          >
            RECHARGER
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
