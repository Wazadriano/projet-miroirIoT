import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllClientes, useDashboardStats, useBoutiquesList } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { api, getToken } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import { Search, Plus, Download, UserCircle, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { Cliente } from '@/lib/types';

const SEXE_LABELS: Record<string, string> = { F: 'Femme', M: 'Homme', 'Non précisé': 'Non précisé' };
const SEXE_COLORS: Record<string, string> = { F: 'bg-[var(--color-primary)] text-white', M: 'bg-[var(--color-primary-deeper)] text-white', 'Non précisé': 'bg-[var(--color-primary-dark)] text-white' };
const stripKbeauty = (name: string) => name.replace(/Kbeauty\s*/i, '').trim();
const calcAge = (dob: string | null): number | null => {
  if (!dob) return null;
  const d = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  if (today.getMonth() < d.getMonth() || (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())) age--;
  return age;
};
const formatDob = (dob: string | null): string => {
  if (!dob) return '—';
  const age = calcAge(dob);
  return `${new Date(dob).toLocaleDateString('fr-FR')}${age !== null ? ` (${age} ans)` : ''}`;
};
const formatPhone = (phone: string | null) => {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('0')) {
    return `+33 ${digits[1]} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  }
  if (digits.length === 11 && digits.startsWith('33')) {
    const d = digits.slice(2);
    return `+33 ${d[0]} ${d.slice(1, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
  }
  if (digits.length === 12 && digits.startsWith('330')) {
    const d = digits.slice(3);
    return `+33 ${d[0]} ${d.slice(1, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
  }
  return phone;
};

export default function Clientes() {
  const navigate = useNavigate();
  const { isGerant } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sexeFilter, setSexeFilter] = useState('');
  const [boutiqueFilter, setBoutiqueFilter] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showModal, setShowModal] = useState(false);
  const { data, isLoading } = useAllClientes(page, debouncedSearch, {
    sexe: sexeFilter || undefined,
    boutique_id: boutiqueFilter || undefined,
    sort_by: sortBy || undefined,
    sort_dir: sortBy ? sortDir : undefined,
  });
  const { data: stats } = useDashboardStats();
  const qc = useQueryClient();

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(v); setPage(1); }, 300);
  };

  const handleExportCsv = async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (sexeFilter) params.set('sexe', sexeFilter);
      if (boutiqueFilter) params.set('boutique_id', boutiqueFilter);
      if (sortBy) { params.set('sort_by', sortBy); params.set('sort_dir', sortDir); }
      const qs = params.toString();
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/clientes/export/csv${qs ? `?${qs}` : ''}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'clients.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  };

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={`${data?.total ?? 0} clients`}
        actions={
          <div className="flex gap-2">
            {isGerant && (
              <>
                <button onClick={handleExportCsv} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors" style={{ backgroundColor: 'var(--color-primary-dark)' }}><Download className="w-4 h-4" /> CSV</button>
                <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Nouveau client</button>
              </>
            )}
          </div>
        }
      />

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-primary-dark)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Rechercher par nom ou adresse email…"
          className="w-full rounded-xl border border-gray-200 bg-white px-10 py-2.5 text-sm shadow-sm outline-none transition-all focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgb(212_163_142/0.2)]"
        />
      </div>

      {/* Mobile filters (boutique + sexe) — hidden on md+ */}
      <div className="flex gap-2 mb-3 md:hidden">
        <select
          value={boutiqueFilter}
          onChange={(e) => { setBoutiqueFilter(e.target.value); setPage(1); }}
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
        >
          <option value="">Toutes les boutiques</option>
          {stats?.clients_per_boutique?.map((b) => (
            <option key={b.id} value={b.id}>{stripKbeauty(b.nom)}</option>
          ))}
        </select>
        <select
          value={sexeFilter}
          onChange={(e) => { setSexeFilter(e.target.value); setPage(1); }}
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
        >
          <option value="">Tous</option>
          <option value="F">Femme</option>
          <option value="M">Homme</option>
          <option value="Non précisé">Non précisé</option>
        </select>
      </div>

      {/* Mobile cards — hidden on md+ */}
      <div className="md:hidden space-y-3 mb-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Chargement…</div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Aucun client trouvé</div>
        ) : (
          data?.data.map((c: any) => (
            <div
              key={c.id}
              onClick={() => navigate(`/clients/${c.id}`)}
              className="card cursor-pointer active:opacity-70 flex items-center gap-3 py-3 px-4"
            >
              <UserCircle className="w-10 h-10 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm" style={{ color: 'var(--color-primary-deeper)' }}>
                    {c.prenom} {c.nom}
                  </span>
                  {c.sexe && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${SEXE_COLORS[c.sexe] || ''}`}>
                      {SEXE_LABELS[c.sexe]}
                    </span>
                  )}
                </div>
                <div className="flex gap-3 flex-wrap mt-0.5">
                  {c.boutique?.nom && (
                    <span className="text-xs text-gray-500">{stripKbeauty(c.boutique.nom)}</span>
                  )}
                  {c.email && <span className="text-xs text-gray-500 truncate max-w-[160px]">{c.email}</span>}
                </div>
                <div className="flex gap-3 flex-wrap mt-0.5">
                  {c.telephone && <span className="text-xs text-gray-400">{formatPhone(c.telephone)}</span>}
                  {c.date_de_naissance && <span className="text-xs text-gray-400">{formatDob(c.date_de_naissance)}</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Table — hidden on mobile */}
      <div className="card overflow-x-auto hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="pb-3 font-medium">
                <button
                  onClick={() => {
                    if (sortBy === 'nom') {
                      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('nom');
                      setSortDir('asc');
                    }
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-1 text-gray-500 font-medium text-sm hover:text-gray-700 transition-colors"
                >
                  Nom
                  {sortBy === 'nom' ? (
                    sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                  )}
                </button>
              </th>
              <th className="pb-3 font-medium">
                <select
                  value={boutiqueFilter}
                  onChange={(e) => { setBoutiqueFilter(e.target.value); setPage(1); }}
                  className="bg-transparent text-gray-500 font-medium text-sm border-none p-0 cursor-pointer focus:ring-0 focus:outline-none"
                >
                  <option value="">Boutique</option>
                  {stats?.clients_per_boutique?.map((b) => (
                    <option key={b.id} value={b.id}>{stripKbeauty(b.nom)}</option>
                  ))}
                </select>
              </th>
              <th className="pb-3 font-medium">Email</th>
              <th className="pb-3 font-medium">Téléphone</th>
              <th className="pb-3 font-medium">
                <select
                  value={sexeFilter}
                  onChange={(e) => { setSexeFilter(e.target.value); setPage(1); }}
                  className="bg-transparent text-gray-500 font-medium text-sm border-none p-0 cursor-pointer focus:ring-0 focus:outline-none"
                >
                  <option value="">Sexe</option>
                  <option value="F">Femme</option>
                  <option value="M">Homme</option>
                  <option value="Non précisé">Non précisé</option>
                </select>
              </th>
              <th className="pb-3 font-medium">
                <button
                  onClick={() => {
                    if (sortBy === 'date_de_naissance') {
                      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('date_de_naissance');
                      setSortDir('asc');
                    }
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-1 text-gray-500 font-medium text-sm hover:text-gray-700 transition-colors"
                >
                  Date de naissance
                  {sortBy === 'date_de_naissance' ? (
                    sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                  )}
                </button>
              </th>
              <th className="pb-3 font-medium">
                <button
                  onClick={() => {
                    if (sortBy === 'created_at') {
                      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('created_at');
                      setSortDir('desc');
                    }
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-1 text-gray-500 font-medium text-sm hover:text-gray-700 transition-colors"
                >
                  Créé le
                  {sortBy === 'created_at' ? (
                    sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                  )}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="py-8 text-center text-gray-400">Chargement…</td></tr>
            ) : data?.data.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-gray-400">Aucun client trouvé</td></tr>
            ) : (
              data?.data.map((c: any) => (
                <tr key={c.id} className="border-b border-gray-200 last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/clients/${c.id}`)}>
                  <td className="py-3 font-medium" style={{ color: 'var(--color-primary-deeper)' }}>
                    <div className="flex items-center gap-2">
                      <UserCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                      {c.prenom} {c.nom}
                    </div>
                  </td>
                  <td className="py-3 text-gray-500 text-xs">{c.boutique?.nom ? stripKbeauty(c.boutique.nom) : '—'}</td>
                  <td className="py-3 text-gray-600">{c.email || '—'}</td>
                  <td className="py-3 text-gray-600">{formatPhone(c.telephone)}</td>
                  <td className="py-3">{c.sexe ? <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${SEXE_COLORS[c.sexe] || ''}`}>{SEXE_LABELS[c.sexe]}</span> : '—'}</td>
                  <td className="py-3 text-gray-600">{formatDob(c.date_de_naissance)}</td>
                  <td className="py-3 text-gray-500">{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={page} lastPage={data.last_page} onPageChange={setPage} />}

      {/* Create modal */}
      <CreateClienteModal open={showModal} onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); qc.invalidateQueries({ queryKey: ['clientes'] }); }} />
    </div>
  );
}

function CreateClienteModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { data: boutiques = [] } = useBoutiquesList();
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', telephone: '', sexe: '', date_de_naissance: '', boutique_id: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-select first boutique when opening
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
      const { boutique_id, ...rest } = form;
      await api('clientes', {
        method: 'POST',
        body: JSON.stringify({
          ...rest,
          date_de_naissance: form.date_de_naissance || null,
          sexe: form.sexe || 'Non précisé',
        }),
        boutiqueId: boutique_id || undefined,
      });
      setForm({ prenom: '', nom: '', email: '', telephone: '', sexe: '', date_de_naissance: '', boutique_id: boutiques[0]?.id ?? '' });
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nouveau client">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Avatar */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-light)' }}>
            <UserCircle className="w-10 h-10" style={{ color: 'var(--color-primary-deeper)' }} />
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 text-center">{error}</div>}

        {/* Boutique */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-primary-dark)' }}>Boutique</legend>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Boutique <span className="text-red-400">*</span></label>
            <select value={form.boutique_id} onChange={(e) => setForm({ ...form, boutique_id: e.target.value })} className="input" required>
              {boutiques.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
            </select>
          </div>
        </fieldset>

        {/* Identité */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-primary-dark)' }}>Identité</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prénom <span className="text-red-400">*</span></label>
              <input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} className="input" placeholder="Chloé" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nom <span className="text-red-400">*</span></label>
              <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="input" placeholder="Dubois" required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="overflow-hidden">
              <label className="block text-xs text-gray-500 mb-1">Date de naissance</label>
              <input type="date" value={form.date_de_naissance} onChange={(e) => setForm({ ...form, date_de_naissance: e.target.value })} className="input w-full min-w-0 max-w-full" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sexe</label>
              <select value={form.sexe} onChange={(e) => setForm({ ...form, sexe: e.target.value })} className="input">
                <option value="">—</option>
                <option value="F">Femme</option>
                <option value="M">Homme</option>
                <option value="Non précisé">Non précisé</option>
              </select>
            </div>
          </div>
        </fieldset>

        <hr className="border-gray-100" />

        {/* Contact */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-primary-dark)' }}>Contact</legend>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email <span className="text-red-400">*</span></label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="chloe.dubois@gmail.com" required />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Téléphone</label>
            <input value={form.telephone} onChange={(e) => {
              let v = e.target.value.replace(/[^\d+\s]/g, '');
              // Auto-format: 0X → 0X XX XX XX XX, +33X → +33 X XX XX XX
              const digits = v.replace(/\D/g, '');
              if (v.startsWith('+33') && digits.length <= 11) {
                const d = digits.slice(2); // after 33
                v = '+33' + (d[0] ? ' ' + d[0] : '') + (d.length > 1 ? ' ' + d.slice(1, 3) : '') + (d.length > 3 ? ' ' + d.slice(3, 5) : '') + (d.length > 5 ? ' ' + d.slice(5, 7) : '') + (d.length > 7 ? ' ' + d.slice(7, 9) : '');
              } else if (v.startsWith('0') && digits.length <= 10) {
                v = digits.slice(0, 2) + (digits.length > 2 ? ' ' + digits.slice(2, 4) : '') + (digits.length > 4 ? ' ' + digits.slice(4, 6) : '') + (digits.length > 6 ? ' ' + digits.slice(6, 8) : '') + (digits.length > 8 ? ' ' + digits.slice(8, 10) : '');
              }
              setForm({ ...form, telephone: v.trimEnd() });
            }} className="input" placeholder="+33 6 12 34 56 78" pattern="(\+33\s?\d(\s?\d{2}){4}|0\d(\s?\d{2}){4})" title="Format: +33 6 12 34 56 78 ou 06 12 34 56 78" />
          </div>
        </fieldset>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Création…' : 'Créer le client'}</button>
        </div>
      </form>
    </Modal>
  );
}
