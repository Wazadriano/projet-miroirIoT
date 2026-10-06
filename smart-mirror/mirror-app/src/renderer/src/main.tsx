import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { KeyboardProvider } from './components/KeyboardProvider'
import './styles/global.css'

// Borne tactile : le pointeur est masqué (index.html). En développement, on le montre.
if (import.meta.env.DEV) document.body.classList.add('pointeur-visible')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <KeyboardProvider>
        <App />
      </KeyboardProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
