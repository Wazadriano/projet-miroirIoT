import { useState, useEffect } from 'react'
import { useSessionStore } from '../stores/session.store'
import { Header } from '../components/Header'

const DEFAULT_CONSENT_TEXT = `En acceptant ce consentement, vous autorisez K Beauty Cosmetics a :
- Capturer des photographies de votre cuir chevelu a l'aide d'un microscope numerique
- Analyser ces images via un service d'intelligence artificielle a des fins cosmetiques
- Stocker temporairement ces donnees pour generer votre rapport de seance
- Vous transmettre le rapport par email ou QR code

Vos donnees sont traitees conformement au RGPD. Vous pouvez exercer vos droits d'acces, de rectification et de suppression a tout moment en contactant votre salon.

Ce consentement est valable uniquement pour la seance en cours.`

export function ConsentScreen(): JSX.Element {
  const { cliente, setScreen, setConsentement, setSeance } = useSessionStore()
  const [consentText, setConsentText] = useState(DEFAULT_CONSENT_TEXT)
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    window.mirrorApi.fetchMirrorConfig()
      .then((config) => {
        const c = config as { config?: { texte_consentement?: string } }
        if (c?.config?.texte_consentement) {
          setConsentText(c.config.texte_consentement)
        }
      })
      .catch(() => {})
  }, [])

  if (!cliente) {
    return (
      <div className="screen-padded">
        <Header subtitle="Consentement" />
        <p className="body-md" style={{ zIndex: 1, marginTop: 40 }}>Aucun client selectionne</p>
        <button className="glass-btn" onClick={() => setScreen('search')} style={{ marginTop: 16, zIndex: 1 }}>
          Retour
        </button>
      </div>
    )
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
      setConsentement(consent)

      const seance = await window.mirrorApi.startSeance({
        clienteId: cliente.id,
        consentementId: (consent as { id: string }).id
      })
      setSeance(seance)
      setScreen('session')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen-padded" style={{ gap: 16 }}>
      <Header subtitle="Consentement" />

      <p className="title-sm" style={{ zIndex: 1, marginTop: 10 }}>
        {cliente.prenom} {cliente.nom}
      </p>

      <div className="glass-card-subtle" style={{
        width: '100%',
        maxWidth: '88vw',
        maxHeight: '35vh',
        overflowY: 'auto',
        zIndex: 1
      }}>
        <p className="body-sm" style={{ whiteSpace: 'pre-line', lineHeight: 1.6, opacity: 0.8 }}>
          {consentText}
        </p>
      </div>

      <label className="checkbox-row" style={{ zIndex: 1, marginTop: 8 }}>
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
        J'ai lu et j'accepte les conditions ci-dessus
      </label>

      {error && <p style={{ color: 'var(--color-error)', fontSize: 12, zIndex: 1 }}>{error}</p>}

      <button
        className="glass-btn"
        onClick={handleAccept}
        disabled={!accepted || loading}
        style={{ width: '47.5vw', zIndex: 1, marginTop: 8 }}
      >
        {loading ? '...' : 'ACCEPTER'}
      </button>
    </div>
  )
}
