import { useState, useEffect } from 'react'
import { useSessionStore } from '../stores/session.store'
import { useDebounce } from '../hooks/useDebounce'

export function SearchClientScreen(): JSX.Element {
  const { setScreen, setCliente } = useSessionStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([])
      return
    }

    let cancelled = false
    setLoading(true)

    window.mirrorApi.searchClientes(debouncedQuery)
      .then((data) => {
        if (!cancelled) setResults(data as Cliente[])
      })
      .catch(() => {
        if (!cancelled) setResults([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [debouncedQuery])

  const handleSelect = (cliente: Cliente): void => {
    setCliente(cliente)
    setScreen('consent')
  }

  return (
    <div className="screen" style={{ paddingTop: '80px', justifyContent: 'flex-start', gap: '24px' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 400 }}>Rechercher un client</h2>

      <div style={{ width: '100%', maxWidth: '600px' }}>
        <input
          type="text"
          placeholder="Nom, prenom, email ou telephone..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          style={{ fontSize: '1.2rem' }}
        />
      </div>

      <div style={{ width: '100%', maxWidth: '600px', flex: 1, overflowY: 'auto' }}>
        {loading && <p style={{ color: 'var(--color-text-muted)' }}>Recherche...</p>}

        {results.map((cliente) => (
          <button
            key={cliente.id}
            className="card"
            onClick={() => handleSelect(cliente)}
            style={{
              width: '100%',
              textAlign: 'left',
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <strong>{cliente.prenom} {cliente.nom}</strong>
              {cliente.email && (
                <span style={{ color: 'var(--color-text-muted)', marginLeft: '12px' }}>
                  {cliente.email}
                </span>
              )}
            </div>
            {cliente.telephone && (
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                {cliente.telephone}
              </span>
            )}
          </button>
        ))}

        {query.length >= 2 && !loading && results.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '20px' }}>
            Aucun resultat
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <button className="btn-secondary" onClick={() => setScreen('home')}>
          Retour
        </button>
        <button className="btn-primary" onClick={() => setScreen('new-client')}>
          Nouveau client
        </button>
      </div>
    </div>
  )
}
