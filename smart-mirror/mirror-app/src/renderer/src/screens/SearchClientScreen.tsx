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

  const handleSelect = async (cliente: Cliente): Promise<void> => {
    setCliente(cliente)
    try {
      const result = await window.mirrorApi.checkValidConsent(cliente.id)
      if (result.valid && result.consent) {
        const seance = await window.mirrorApi.startSeance({
          clienteId: cliente.id,
          consentementId: (result.consent as { id: string }).id
        })
        useSessionStore.getState().setConsentement(result.consent)
        useSessionStore.getState().setSeance(seance)
        setScreen('session')
        return
      }
    } catch { /* no valid consent, show consent screen */ }
    setScreen('consent')
  }

  return (
    <div className="screen-padded">
      <Header subtitle="Recherche Client" />

      {/* Search bar + calendar icon */}
      <div style={{ width: '100%', maxWidth: '88vw', marginTop: '2.5vh', position: 'relative', zIndex: 1, display: 'flex', gap: '2.5vw', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg width="5.25vw" height="5vw" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5"
            style={{ position: 'absolute', left: '4vw', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            className="glass-input"
            placeholder="Rechercher"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: '12vw', fontFamily: 'var(--font-title)', fontWeight: 400, fontSize: 'var(--fs-sm)' }}
          />
        </div>
        {/* Calendar icon */}
        <button className="glass-card-subtle" style={{
          width: '17.5vw', height: '17.5vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 'var(--radius)', padding: 0, border: 'none', cursor: 'pointer', flexShrink: 0
        }}>
          <svg width="11vw" height="7.5vw" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            <rect x="7" y="14" width="3" height="3"/><rect x="14" y="14" width="3" height="3"/>
          </svg>
        </button>
      </div>

      {/* Results */}
      <p className="title-sm" style={{ marginTop: '3vh', zIndex: 1 }}>Resultats Rapides</p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4vw',
        marginTop: '2vh',
        width: '100%',
        maxWidth: '88vw',
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
              {(cliente as Record<string, unknown>).created_at
                ? new Date(String((cliente as Record<string, unknown>).created_at)).toLocaleDateString('fr-FR')
                : ''}
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
