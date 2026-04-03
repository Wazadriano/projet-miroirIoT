import { useState } from 'react'
import { useSessionStore } from '../stores/session.store'
import { Header } from '../components/Header'

export function NewClientScreen(): JSX.Element {
  const { setScreen, setCliente } = useSessionStore()
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', sexe: '', dateNaissance: ''
  })
  const [rgpd1, setRgpd1] = useState(false)
  const [rgpd2, setRgpd2] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (): Promise<void> => {
    if (!form.prenom || !form.nom) {
      setError('Nom et prenom obligatoires')
      return
    }
    if (!rgpd1 || !rgpd2) {
      setError('Veuillez accepter les conditions')
      return
    }
    setError('')
    try {
      // Convert JJ/MM/AAAA to YYYY-MM-DD for API
      let date_de_naissance: string | undefined
      if (form.dateNaissance) {
        const parts = form.dateNaissance.split('/')
        if (parts.length === 3) {
          date_de_naissance = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
        }
      }
      const cliente = await window.mirrorApi.createCliente({
        prenom: form.prenom,
        nom: form.nom,
        email: form.email || undefined,
        date_de_naissance,
        sexe: form.sexe || undefined
      })
      setCliente(cliente as Cliente)
      setScreen('consent')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="screen-padded" style={{ gap: '1.5vh' }}>
      <Header subtitle="Inscription Nouveau Client" />

      {/* Bouton retour recherche */}
      <button className="glass-btn" onClick={() => setScreen('search')}
        style={{ fontSize: 'var(--fs-body-sm)', padding: '1vw 4vw', minHeight: '8vw', alignSelf: 'flex-start', zIndex: 1 }}>
        Recherche
      </button>

      <div style={{ width: '100%', maxWidth: '88vw', display: 'flex', flexDirection: 'column', gap: '2.5vw', zIndex: 1 }}>
        <div>
          <label className="label">Nom :</label>
          <input className="glass-input" value={form.nom} onChange={(e) => setForm(p => ({ ...p, nom: e.target.value }))} />
        </div>
        <div>
          <label className="label">Prenom :</label>
          <input className="glass-input" value={form.prenom} onChange={(e) => setForm(p => ({ ...p, prenom: e.target.value }))} />
        </div>
        <div>
          <label className="label">Adresse mail :</label>
          <input className="glass-input" type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} />
        </div>

        {/* Sexe selector */}
        <div>
          <label className="label">Sexe :</label>
          <div style={{ display: 'flex', gap: '2.5vw', marginTop: '1.5vw' }}>
            {[
              { value: 'M', label: 'Homme' },
              { value: 'F', label: 'Femme' },
              { value: 'autre', label: 'Non-Precise' }
            ].map((opt) => (
              <button
                key={opt.value}
                className="glass-btn"
                onClick={() => setForm(p => ({ ...p, sexe: opt.value }))}
                style={{
                  flex: 1,
                  minHeight: '10vw',
                  fontSize: 'var(--fs-body-sm)',
                  background: form.sexe === opt.value ? 'rgba(232, 201, 181, 0.2)' : undefined,
                  boxShadow: form.sexe === opt.value
                    ? 'inset 0px 0px 3.75vw 0px var(--color-shadow-gold-light)'
                    : undefined
                }}
              >{opt.label}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Date de naissance (JJ/MM/AAAA) :</label>
          <input
            className="glass-input"
            type="text"
            inputMode="numeric"
            placeholder="JJ/MM/AAAA"
            value={form.dateNaissance}
            onChange={(e) => {
              let val = e.target.value.replace(/[^0-9/]/g, '')
              // Auto-insert slashes
              if (val.length === 2 && !val.includes('/')) val += '/'
              if (val.length === 5 && val.split('/').length === 2) val += '/'
              if (val.length <= 10) setForm(p => ({ ...p, dateNaissance: val }))
            }}
          />
          {form.dateNaissance.length === 10 && (() => {
            const parts = form.dateNaissance.split('/')
            if (parts.length === 3) {
              const birth = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
              const today = new Date()
              let age = today.getFullYear() - birth.getFullYear()
              const m = today.getMonth() - birth.getMonth()
              if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
              if (age >= 0 && age <= 120) return <p className="body-sm" style={{ marginTop: '1vw', opacity: 0.6 }}>{age} ans</p>
            }
            return null
          })()}
        </div>

        {/* RGPD checkboxes */}
        <label className="checkbox-row" style={{ marginTop: 8 }}>
          <input type="checkbox" checked={rgpd1} onChange={(e) => setRgpd1(e.target.checked)} />
          J'accepte le traitement de mes donnees
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={rgpd2} onChange={(e) => setRgpd2(e.target.checked)} />
          J'accepte la politique de confidentialite
        </label>

        {error && <p style={{ color: 'var(--color-error)', fontSize: 12 }}>{error}</p>}

        <button
          className="glass-btn"
          onClick={handleSubmit}
          disabled={!form.prenom || !form.nom || !rgpd1 || !rgpd2}
          style={{ width: '100%', marginTop: 8 }}
        >
          INSCRIPTION
        </button>
      </div>
    </div>
  )
}
