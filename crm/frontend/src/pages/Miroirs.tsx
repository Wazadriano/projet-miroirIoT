import { useState, useEffect } from 'react';
import { useMiroirs, useInvalidate, useBoutiquesList } from '@/lib/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import echo from '@/lib/echo';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import { Plus, Trash2, Settings, Save } from 'lucide-react';
import type { Miroir, ConfigMiroir } from '@/lib/types';

export default function Miroirs() {
  const { data: miroirs, isLoading } = useMiroirs();
  const [showCreate, setShowCreate] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const invalidate = useInvalidate();
  const qc = useQueryClient();

  // Temps réel : mise à jour du statut via WebSocket
  useEffect(() => {
    const channel = echo.channel('miroirs');

    channel.listen('.MiroirStatusChanged', (data: { id: string; en_ligne: boolean; derniere_activite: string }) => {
      qc.setQueriesData<Miroir[]>({ queryKey: ['miroirs'] }, (prev) => {
        if (!prev) return prev;
        return prev.map(m =>
          m.id === data.id
            ? { ...m, en_ligne: data.en_ligne, derniere_activite: data.derniere_activite }
            : m
        );
      });
    });

    // Refetch complet à la reconnexion pour rattraper les events manqués
    echo.connector.pusher.connection.bind('connected', () => {
      qc.invalidateQueries({ queryKey: ['miroirs'] });
    });

    return () => {
      echo.connector.pusher.connection.unbind('connected');
      echo.leaveChannel('miroirs');
    };
  }, [qc]);

  const handleDelete = async (m: Miroir) => {
    if (!confirm(`Supprimer le miroir "${m.nom}" ?`)) return;
    await api(`miroirs/${m.id}`, { method: 'DELETE' });
    invalidate('miroirs');
  };

  return (
    <div>
      <PageHeader
        title="Miroirs"
        subtitle={`${miroirs?.length ?? 0} miroirs — temps réel`}
        actions={
          <div className="flex gap-2">
            <button onClick={() => setShowConfig(true)} className="btn-outline"><Settings className="w-4 h-4" /> Config</button>
            <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4" /> Ajouter</button>
          </div>
        }
      />

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Chargement…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {miroirs?.map((m: Miroir) => (
            <div key={m.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{m.nom}</h3>
                <StatusBadge online={m.en_ligne} />
              </div>
              <div className="text-sm text-gray-500 space-y-1 mb-4">
                {m.boutique && <div className="text-xs font-medium text-primary">{m.boutique.nom}</div>}
                <div>MAC : <span className="font-mono">{m.adresse_mac}</span></div>
                {m.version_app && <div>Version : {m.version_app}</div>}
                {m.derniere_activite && <div>Dernière activité : {new Date(m.derniere_activite).toLocaleString('fr-FR')}</div>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(m)} className="btn-danger text-xs">
                  <Trash2 className="w-3 h-3" /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateMiroirModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); invalidate('miroirs'); }} />
      <ConfigMiroirModal open={showConfig} onClose={() => setShowConfig(false)} />
    </div>
  );
}

function CreateMiroirModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { data: boutiques = [] } = useBoutiquesList();
  const [form, setForm] = useState({ nom: '', adresse_mac: '', boutique_id: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && !form.boutique_id && boutiques.length > 0) {
      setForm(f => ({ ...f, boutique_id: boutiques[0].id }));
    }
  }, [open, boutiques, form.boutique_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: Record<string, string> = { nom: form.nom, adresse_mac: form.adresse_mac, boutique_id: form.boutique_id };
      await api('miroirs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setForm({ nom: '', adresse_mac: '', boutique_id: boutiques[0]?.id ?? '' });
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Ajouter un miroir">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3">{error}</div>}
        {boutiques.length > 1 && (
          <div>
            <label className="block text-sm font-medium mb-1">Boutique *</label>
            <select value={form.boutique_id} onChange={(e) => setForm({ ...form, boutique_id: e.target.value })} className="input" required>
              {boutiques.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Nom *</label>
          <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="input" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Adresse MAC *</label>
          <input value={form.adresse_mac} onChange={(e) => setForm({ ...form, adresse_mac: e.target.value })} className="input font-mono" placeholder="AA:BB:CC:DD:EE:FF" required />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Ajout…' : 'Ajouter'}</button>
        </div>
      </form>
    </Modal>
  );
}

function ConfigMiroirModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: config } = useQuery({
    queryKey: ['config-miroir'],
    queryFn: () => api<ConfigMiroir>('config-miroir'),
    enabled: open,
  });

  const [form, setForm] = useState({
    couleur_primaire: '#8b5cf6',
    couleur_fond: '#ffffff',
    typographie: 'Inter',
    fond_anime: false,
    theme_fond_anime: '',
    logo_url: '',
    volume: 50,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (config) {
      setForm({
        couleur_primaire: config.couleur_primaire || '#8b5cf6',
        couleur_fond: config.couleur_fond || '#ffffff',
        typographie: config.typographie || 'Inter',
        fond_anime: config.fond_anime ?? false,
        theme_fond_anime: config.theme_fond_anime || '',
        logo_url: config.logo_url || '',
        volume: config.volume ?? 50,
      });
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      await api('config-miroir', { method: 'PATCH', body: JSON.stringify(form) });
      qc.invalidateQueries({ queryKey: ['config-miroir'] });
      setMsg('Configuration sauvegardée');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Configuration des miroirs">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Couleur primaire</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.couleur_primaire} onChange={(e) => setForm({ ...form, couleur_primaire: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-0" />
              <input value={form.couleur_primaire} onChange={(e) => setForm({ ...form, couleur_primaire: e.target.value })} className="input font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Couleur de fond</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.couleur_fond} onChange={(e) => setForm({ ...form, couleur_fond: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-0" />
              <input value={form.couleur_fond} onChange={(e) => setForm({ ...form, couleur_fond: e.target.value })} className="input font-mono" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Typographie</label>
          <select value={form.typographie} onChange={(e) => setForm({ ...form, typographie: e.target.value })} className="input">
            {['Inter', 'Roboto', 'Poppins', 'Montserrat', 'Playfair Display', 'Lora'].map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="fond_anime" checked={form.fond_anime} onChange={(e) => setForm({ ...form, fond_anime: e.target.checked })} className="rounded" />
          <label htmlFor="fond_anime" className="text-sm font-medium">Fond animé</label>
        </div>

        {form.fond_anime && (
          <div>
            <label className="block text-sm font-medium mb-1">Thème fond animé</label>
            <input value={form.theme_fond_anime} onChange={(e) => setForm({ ...form, theme_fond_anime: e.target.value })} className="input" placeholder="particles, gradient, waves…" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">URL du logo</label>
          <input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} className="input" placeholder="https://…" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Volume : {form.volume}%</label>
          <input type="range" min={0} max={100} value={form.volume} onChange={(e) => setForm({ ...form, volume: Number(e.target.value) })} className="w-full" />
        </div>

        {/* Preview */}
        <div className="rounded-xl p-6 flex flex-col items-center justify-center min-h-[200px] transition-all border"
          style={{ backgroundColor: form.couleur_fond, fontFamily: form.typographie }}>
          {form.logo_url && <img src={form.logo_url} alt="Logo" className="max-h-12 mb-4" />}
          <h2 className="text-xl font-bold mb-1" style={{ color: form.couleur_primaire }}>Bienvenue</h2>
          <p className="text-xs opacity-60" style={{ color: form.couleur_primaire }}>Découvrez votre diagnostic beauté</p>
          <button className="mt-4 px-4 py-1.5 rounded-full text-white text-xs font-medium" style={{ backgroundColor: form.couleur_primaire }}>
            Commencer
          </button>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            <Save className="w-4 h-4" /> {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
          {msg && <span className="text-sm text-emerald-600">{msg}</span>}
        </div>
      </div>
    </Modal>
  );
}
