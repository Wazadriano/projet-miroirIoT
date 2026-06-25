import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import { Plus, Trash2, Store, Users, Monitor, CalendarDays } from 'lucide-react';
import type { Paginated, Boutique } from '@/lib/types';

export default function Boutiques() {
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['boutiques', page],
    queryFn: () => api<Paginated<Boutique>>('boutiques', { params: { page: String(page) } }),
  });

  const handleDelete = async (b: Boutique) => {
    if (!confirm(`Supprimer la boutique "${b.nom}" ?`)) return;
    await api(`boutiques/${b.id}`, { method: 'DELETE' });
    qc.invalidateQueries({ queryKey: ['boutiques'] });
  };

  return (
    <div>
      <PageHeader
        title="Boutiques"
        subtitle="Administration"
        actions={<button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4" /> Nouvelle</button>}
      />

      {isLoading ? (
        <p className="text-center py-8 text-gray-400">Chargement…</p>
      ) : data?.data.length === 0 ? (
        <p className="text-center py-8 text-gray-400">Aucune boutique</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {data?.data.map((b: Boutique) => (
            <div key={b.id} className="card flex flex-col items-center text-center gap-2 p-4 relative">
              <button onClick={() => handleDelete(b)} className="absolute top-2 right-2 p-1 text-gray-300 hover:text-danger">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 w-full">
                <div className="font-semibold text-sm truncate">{b.nom}</div>
                {b.email_contact && <p className="text-xs text-gray-400 truncate">{b.email_contact}</p>}
              </div>
              <div className="flex items-center justify-center gap-3 text-xs text-gray-500 mt-1">
                <span className="flex items-center gap-0.5" title="Clients"><Users className="w-3 h-3" /> {b.clientes_count ?? 0}</span>
                <span className="flex items-center gap-0.5" title="Miroirs"><Monitor className="w-3 h-3" /> {b.miroirs_count ?? 0}</span>
                <span className="flex items-center gap-0.5" title="Séances"><CalendarDays className="w-3 h-3" /> {b.seances_count ?? 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && <Pagination page={page} lastPage={data.last_page} onPageChange={setPage} />}

      <CreateBoutiqueModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ['boutiques'] }); }} />
    </div>
  );
}

function CreateBoutiqueModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ nom: '', email_contact: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api('boutiques', { method: 'POST', body: JSON.stringify(form) });
      setForm({ nom: '', email_contact: '' });
      onCreated();
    } catch { }
    setLoading(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle boutique">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nom *</label>
          <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="input" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email contact</label>
          <input type="email" value={form.email_contact} onChange={(e) => setForm({ ...form, email_contact: e.target.value })} className="input" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Création…' : 'Créer'}</button>
        </div>
      </form>
    </Modal>
  );
}
