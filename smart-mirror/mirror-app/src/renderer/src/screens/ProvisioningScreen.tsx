import { useState, useEffect } from 'react'
import { useSessionStore } from '../stores/session.store'

export function ProvisioningScreen(): JSX.Element {
  const { setScreen, setProvisioned } = useSessionStore()
  const [networks, setNetworks] = useState<Array<{ ssid: string; signal: number; security: string }>>([])
  const [form, setForm] = useState({
    ssid: '',
    password: '',
    boutiqueId: '',
    apiBaseUrl: ''
  })

  useEffect(() => {
    window.mirrorApi.getConfig().then((config: unknown) => {
      const c = config as { api?: { baseUrl?: string }; device?: { boutiqueId?: string } }
      setForm(prev => ({
        ...prev,
        apiBaseUrl: c?.api?.baseUrl || prev.apiBaseUrl,
        boutiqueId: c?.device?.boutiqueId || prev.boutiqueId
      }))
    })
  }, [])
  const [step, setStep] = useState<'wifi' | 'config' | 'connecting' | 'done' | 'error'>('wifi')
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    scanNetworks()
  }, [])

  const scanNetworks = async (): Promise<void> => {
    if (scanning) return
    setScanning(true)
    try {
      const nets = await window.mirrorApi.getWifiNetworks()
      setNetworks(nets)
    } catch {
      setNetworks([])
    } finally {
      setScanning(false)
    }
  }

  const selectNetwork = (ssid: string): void => {
    setForm(prev => ({ ...prev, ssid }))
    setStep('config')
  }

  const handleConnect = async (): Promise<void> => {
    if (!form.boutiqueId) {
      setError('Boutique ID est obligatoire')
      return
    }

    setStep('connecting')
    setError('')

    try {
      const result = await window.mirrorApi.provision({
        ssid: form.ssid,
        password: form.password,
        boutiqueId: form.boutiqueId,
        apiBaseUrl: form.apiBaseUrl
      })

      if (result.success) {
        setStep('done')
        setTimeout(() => {
          setProvisioned(true)
          setScreen('home')
        }, 2000)
      } else {
        setError(result.error || 'Connection failed')
        setStep('config')
      }
    } catch (err) {
      setError((err as Error).message)
      setStep('config')
    }
  }

  return (
    <div className="screen" style={{ gap: '24px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 300 }}>
        Configuration Smart Mirror
      </h1>

      {step === 'wifi' && (
        <>
          <h3 style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>
            Selectionnez le reseau WiFi
          </h3>

          <div style={{ width: '100%', maxWidth: '500px', maxHeight: '400px', overflowY: 'auto' }}>
            {scanning && <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Recherche des reseaux...</p>}

            {networks.map((net, index) => (
              <button
                key={`${net.ssid}-${index}`}
                className="card"
                onClick={() => selectNetwork(net.ssid)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <span>{net.ssid}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  {net.signal}% | {net.security}
                </span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-secondary" onClick={scanNetworks} disabled={scanning}>
              Rafraichir
            </button>
            <button className="btn-secondary" onClick={() => setStep('config')}>
              Configuration manuelle
            </button>
          </div>
        </>
      )}

      {step === 'config' && (
        <>
          <div style={{ width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>
                Reseau WiFi
              </label>
              <input
                value={form.ssid}
                placeholder="SSID ou laisser vide"
                onChange={(e) => setForm(prev => ({ ...prev, ssid: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>
                Mot de passe WiFi
              </label>
              <input
                type="password"
                placeholder="Mot de passe"
                value={form.password}
                onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>
                Boutique ID (UUID)
              </label>
              <input
                placeholder="a1b2c3d4-0001-4000-8000-000000000001"
                value={form.boutiqueId}
                onChange={(e) => setForm(prev => ({ ...prev, boutiqueId: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>
                URL API
              </label>
              <input
                placeholder="http://api.example.com/api"
                value={form.apiBaseUrl}
                onChange={(e) => setForm(prev => ({ ...prev, apiBaseUrl: e.target.value }))}
              />
            </div>

            {error && <p style={{ color: 'var(--color-error)', fontSize: '0.9rem' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button className="btn-secondary" onClick={() => setStep('wifi')} style={{ flex: 1 }}>
                Retour
              </button>
              <button className="btn-primary" onClick={handleConnect} style={{ flex: 1 }}>
                Connecter
              </button>
            </div>
          </div>
        </>
      )}

      {step === 'connecting' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.2rem' }}>Connexion en cours...</p>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>
            Connexion WiFi et enregistrement aupres du serveur
          </p>
        </div>
      )}

      {step === 'done' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.5rem', color: 'var(--color-success)' }}>
            Configuration terminee
          </p>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>
            Demarrage du miroir...
          </p>
        </div>
      )}
    </div>
  )
}
