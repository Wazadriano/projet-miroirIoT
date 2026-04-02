import { useState, useEffect } from 'react'
import { useSessionStore } from '../stores/session.store'
import { useDebounce } from '../hooks/useDebounce'
import { Header } from '../components/Header'

export function SearchClientScreen(): JSX.Element {
  const { setScreen, setCliente } = useSessionStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Cliente[]>([])
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (!debouncedQuery) { setResults([]); return }
    let cancelled = false
    window.mirrorApi.searchClientes(debouncedQuery)
      .then((data) => {
        if (!cancelled) setResults(data as Cliente[])
      })
      .catch(() => setResults([]))
    return () => { cancelled = true }
  }, [debouncedQuery])

  const handleSelect = (cliente: Cliente): void => {
    setCliente(cliente)
    setScreen('consent')
  }

  return (
    <div className="screen-padded">
      <Header subtitle="Recherche Client" />

      {/* Search bar */}
      <div style={{ width: '100%', maxWidth: 350, marginTop: 20, position: 'relative', zIndex: 1 }}>
        <div style={{ position: 'relative' }}>
          <svg width="21" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5"
            style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            className="glass-input"
            placeholder="Rechercher"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: 48, fontFamily: 'var(--font-title)', fontWeight: 400, fontSize: 15 }}
          />
        </div>
      </div>

      {/* Results */}
      <p className="title-sm" style={{ marginTop: 24, zIndex: 1 }}>Resultats Rapides</p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        marginTop: 16,
        width: '100%',
        maxWidth: 350,
        flex: 1,
        overflowY: 'auto',
        zIndex: 1
      }}>
        {results.map((cliente) => (
          <button
            key={cliente.id}
            onClick={() => handleSelect(cliente)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              minWidth: 'unset',
              minHeight: 'unset'
            }}
          >
            <div className="img-gold-shadow" style={{
              width: '100%',
              aspectRatio: '4/5',
              background: 'var(--color-glass-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span className="body-sm" style={{ opacity: 0.4 }}>Photo</span>
            </div>
            <span className="title-sm">{cliente.prenom} {cliente.nom}</span>
            <span className="body-sm" style={{ opacity: 0.6 }}>
              {cliente.created_at ? new Date(cliente.created_at).toLocaleDateString('fr-FR') : ''}
            </span>
          </button>
        ))}
      </div>

      {/* New client button */}
      <button
        onClick={() => setScreen('new-client')}
        style={{
          position: 'absolute',
          bottom: 30,
          right: 30,
          width: 46,
          height: 46,
          borderRadius: '50%',
          background: 'var(--color-glass-bg)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0px 0px 4px 3px var(--color-shadow-gold-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer',
          zIndex: 1,
          padding: 0,
          minWidth: 'unset',
          minHeight: 'unset'
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
    </div>
  )
}
