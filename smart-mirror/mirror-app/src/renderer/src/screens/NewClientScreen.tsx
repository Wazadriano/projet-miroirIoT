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
    <div className="screen-padded" style={{ gap: 12 }}>
      <Header subtitle="Inscription Nouveau Client" />

      <div style={{ width: '100%', maxWidth: 350, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 1, marginTop: 10 }}>
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
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button
              className={form.sexe === 'M' ? 'glass-btn' : 'glass-btn'}
              onClick={() => setForm(p => ({ ...p, sexe: 'M' }))}
              style={{
                flex: 1, minHeight: 40,
                boxShadow: form.sexe === 'M' ? 'inset 0px 0px 15px 0px var(--color-shadow-gold-light)' : undefined
              }}
            >H</button>
            <button
              className={form.sexe === 'F' ? 'glass-btn' : 'glass-btn'}
              onClick={() => setForm(p => ({ ...p, sexe: 'F' }))}
              style={{
                flex: 1, minHeight: 40,
                boxShadow: form.sexe === 'F' ? 'inset 0px 0px 15px 0px var(--color-shadow-gold-light)' : undefined
              }}
            >F</button>
          </div>
        </div>

        <div>
          <label className="label">Age :</label>
          <input className="glass-input" type="number" value={form.age} onChange={(e) => setForm(p => ({ ...p, age: e.target.value }))} />
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
