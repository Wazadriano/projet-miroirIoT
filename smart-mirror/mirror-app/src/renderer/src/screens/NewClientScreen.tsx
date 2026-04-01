import { useState } from 'react'
import { useSessionStore } from '../stores/session.store'

export function NewClientScreen(): JSX.Element {
  const { setScreen, setCliente } = useSessionStore()
  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    age: '',
    sexe: ''
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (): Promise<void> => {
    if (!form.prenom.trim() || !form.nom.trim()) {
      setError('Prenom et nom sont obligatoires')
      return
    }

    setSaving(true)
    setError('')

    try {
      const cliente = await window.mirrorApi.createCliente({
        prenom: form.prenom.trim(),
        nom: form.nom.trim(),
        email: form.email.trim() || undefined,
        telephone: form.telephone.trim() || undefined,
        age: form.age ? parseInt(form.age) : undefined,
        sexe: form.sexe || undefined
      })
      setCliente(cliente as Cliente)
      setScreen('consent')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: string, value: string): void => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="screen" style={{ paddingTop: '80px', justifyContent: 'flex-start', gap: '20px' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 400 }}>Nouvelle cliente</h2>

      <div style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            placeholder="Prenom *"
            value={form.prenom}
            onChange={(e) => updateField('prenom', e.target.value)}
            autoFocus
          />
          <input
            placeholder="Nom *"
            value={form.nom}
            onChange={(e) => updateField('nom', e.target.value)}
          />
        </div>

        <input
          type="email"
          placeholder="Email (optionnel)"
          value={form.email}
          onChange={(e) => updateField('email', e.target.value)}
        />

        <input
          type="tel"
          placeholder="Telephone (optionnel)"
          value={form.telephone}
          onChange={(e) => updateField('telephone', e.target.value)}
        />

        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="number"
            placeholder="Age"
            value={form.age}
            onChange={(e) => updateField('age', e.target.value)}
            style={{ maxWidth: '120px' }}
          />
          <select
            value={form.sexe}
            onChange={(e) => updateField('sexe', e.target.value)}
            style={{
              flex: 1,
              padding: '14px 16px',
              borderRadius: 'var(--radius)',
              border: '1px solid #334155',
              background: 'var(--color-surface)',
              color: form.sexe ? 'var(--color-text)' : 'var(--color-text-muted)',
              fontSize: '1.1rem',
              minHeight: '48px'
            }}
          >
            <option value="">Sexe</option>
            <option value="F">Feminin</option>
            <option value="M">Masculin</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        {error && (
          <p style={{ color: 'var(--color-error)', fontSize: '0.9rem' }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button className="btn-secondary" onClick={() => setScreen('search')} style={{ flex: 1 }}>
            Retour
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={saving}
            style={{ flex: 1 }}
          >
            {saving ? 'Enregistrement...' : 'Creer'}
          </button>
        </div>
      </div>
    </div>
  )
}
