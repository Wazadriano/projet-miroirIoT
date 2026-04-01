import { useState, useEffect } from 'react'
import { useSessionStore } from '../stores/session.store'

// Fallback consent text — used when API is unreachable.
// In production, this text is fetched from the API to allow
// marketing/legal to update it without a code deploy.
const DEFAULT_CONSENT_TEXT = `En acceptant ce consentement, vous autorisez K Beauty Cosmetics a realiser une analyse microscopique de votre cuir chevelu a des fins cosmetiques et observationnelles uniquement.

Les images capturees et les resultats de l'analyse seront :
- Stockes de maniere securisee sur nos serveurs en France (RGPD art. 44)
- Utilises uniquement pour votre suivi cosmetique personnel
- Accessibles uniquement au personnel autorise de cette boutique
- Supprimables sur simple demande de votre part

Cette analyse est purement cosmetique et observationnelle. Elle ne constitue en aucun cas un diagnostic medical.

Vous pouvez revoquer ce consentement a tout moment en contactant la boutique.`

export function ConsentScreen(): JSX.Element {
  const { cliente, setScreen, setConsentement, setSeance } = useSessionStore()
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [consentText, setConsentText] = useState(DEFAULT_CONSENT_TEXT)

  // Fetch consent text from API config (allows legal/marketing to update without deploy)
  useEffect(() => {
    window.mirrorApi.fetchMirrorConfig()
      .then((config) => {
        const cfg = config as { config?: { texte_consentement?: string } } | null
        if (cfg?.config?.texte_consentement) {
          setConsentText(cfg.config.texte_consentement)
        }
      })
      .catch(() => {
        // Use default text
      })
  }, [])

  if (!cliente) {
    setScreen('search')
    return <></>
  }

  const handleAccept = async (): Promise<void> => {
    if (!accepted) return

    setLoading(true)
    setError('')

    try {
      const consent = await window.mirrorApi.createConsentement({
        clienteId: cliente.id,
        texteConsent: consentText
      })
      setConsentement(consent as Consentement)

      const seance = await window.mirrorApi.startSeance({
        clienteId: cliente.id,
        consentementId: (consent as Consentement).id
      })
      setSeance(seance as Seance)
      setScreen('session')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen" style={{ paddingTop: '80px', justifyContent: 'flex-start', gap: '24px' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 400 }}>
        Consentement RGPD
      </h2>
      <p style={{ color: 'var(--color-text-muted)' }}>
        {cliente.prenom} {cliente.nom}
      </p>

      <div
        className="card"
        style={{
          maxWidth: '700px',
          maxHeight: '400px',
          overflowY: 'auto',
          whiteSpace: 'pre-line',
          lineHeight: '1.6',
          fontSize: '1rem'
        }}
      >
        {consentText}
      </div>

      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        fontSize: '1.1rem'
      }}>
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          style={{
            width: '24px',
            height: '24px',
            minWidth: '24px',
            minHeight: '24px',
            accentColor: 'var(--color-accent)'
          }}
        />
        J'ai lu et j'accepte les conditions ci-dessus
      </label>

      {error && (
        <p style={{ color: 'var(--color-error)', fontSize: '0.9rem' }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: '16px' }}>
        <button className="btn-secondary" onClick={() => setScreen('search')}>
          Retour
        </button>
        <button
          className="btn-primary"
          onClick={handleAccept}
          disabled={!accepted || loading}
          style={{ opacity: accepted ? 1 : 0.5 }}
        >
          {loading ? 'Validation...' : 'Accepter et commencer la seance'}
        </button>
      </div>
    </div>
  )
}
