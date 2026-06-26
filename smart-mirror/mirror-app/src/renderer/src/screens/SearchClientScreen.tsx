import { useState, useEffect } from 'react'
import { useSessionStore } from '../stores/session.store'
import { useDebounce } from '../hooks/useDebounce'
import { Header } from '../components/Header'

export function SearchClientScreen(): JSX.Element {
  const { setScreen, setCliente } = useSessionStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Cliente[]>([])
  const [recent, setRecent] = useState<Cliente[]>([])
  const debouncedQuery = useDebounce(query, 300)

  // Clientes recentes chargees a l'ouverture : l'ecran n'est jamais vide, la
  // praticienne peut selectionner sans taper (usage tactile au miroir).
  useEffect(() => {
    let cancelled = false
    window.mirrorApi.searchClientes('')
      .then((data) => { if (!cancelled) setRecent(data as Cliente[]) })
      .catch(() => setRecent([]))
    return () => { cancelled = true }
  }, [])

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

  const shown = query ? results : recent
  const sectionLabel = query
    ? (results.length ? 'Resultats' : 'Aucun resultat')
    : 'Clientes recentes'

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
      <div className="content" style={{ marginTop: '2.5vh', position: 'relative', zIndex: 1, flexDirection: 'row', gap: '2vw', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg width="3.5vw" height="3.5vw" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5"
            style={{ position: 'absolute', left: '3vw', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            className="glass-input"
            placeholder="Rechercher une cliente"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: '8vw', fontFamily: 'var(--font-title)', fontWeight: 400, fontSize: 'var(--fs-sm)', maxWidth: 'none' }}
          />
        </div>
        {/* Calendar icon */}
        <button className="glass-card-subtle" style={{
          width: 'var(--control-h)', height: 'var(--control-h)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 'var(--radius)', padding: 0, border: 'none', cursor: 'pointer', flexShrink: 0
        }}>
          <svg width="3.5vw" height="3.5vw" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            <rect x="7" y="14" width="3" height="3"/><rect x="14" y="14" width="3" height="3"/>
          </svg>
        </button>
      </div>

      {/* Results / recent */}
      <p className="title-sm" style={{ marginTop: '3vh', zIndex: 1, alignSelf: 'flex-start', maxWidth: 'var(--content-max)', width: '100%', marginInline: 'auto', textAlign: 'left' }}>{sectionLabel}</p>

      {shown.length === 0 ? (
        <div className="content" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: '2vh', zIndex: 1, opacity: 0.7 }}>
          <p className="body-md" style={{ textAlign: 'center' }}>
            {query ? 'Aucune cliente ne correspond a cette recherche.' : 'Commencez a taper ou creez une nouvelle fiche cliente.'}
          </p>
        </div>
      ) : (
      <div className="content" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '3vw',
        marginTop: '2vh',
        marginInline: 'auto',
        flex: 1,
        overflowY: 'auto',
        alignContent: 'start',
        zIndex: 1
      }}>
        {shown.map((cliente) => (
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
      )}

      {/* Bottom actions : libelles explicites plutot que des fleches en coin */}
      <div className="content" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '3vw', marginTop: '2vh', marginBottom: '1vh', marginInline: 'auto', zIndex: 1 }}>
        <button className="glass-btn" onClick={() => setScreen('accueil')} style={{ fontWeight: 500, flex: 1, maxWidth: '40%' }}>Retour</button>
        <button className="glass-btn" onClick={() => setScreen('new-client')} style={{ flex: 1, maxWidth: '55%' }}>+ Nouvelle cliente</button>
      </div>
    </div>
  )
}
