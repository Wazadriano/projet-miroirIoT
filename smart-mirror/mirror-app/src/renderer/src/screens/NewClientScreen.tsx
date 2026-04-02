import { useState } from 'react'
import { useSessionStore } from '../stores/session.store'
import { Header } from '../components/Header'

export function NewClientScreen(): JSX.Element {
  const { setScreen, setCliente } = useSessionStore()
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', sexe: '', age: ''
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
      const cliente = await window.mirrorApi.createCliente({
        prenom: form.prenom,
        nom: form.nom,
        email: form.email || undefined,
        age: form.age ? parseInt(form.age) : undefined,
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
          <label className="label">Age :</label>
          <input
            className="glass-input"
            type="number"
            min="0"
            max="120"
            value={form.age}
            onChange={(e) => {
              const val = e.target.value
              if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 120)) {
                setForm(p => ({ ...p, age: val }))
              }
            }}
          />
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
