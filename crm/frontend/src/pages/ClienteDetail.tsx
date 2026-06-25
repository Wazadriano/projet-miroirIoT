import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCliente, useClienteSeances, useDashboardStats } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import Pagination from '@/components/Pagination';
import { ArrowLeft, Edit2, Save, X, UserCircle, Check } from 'lucide-react';
import type { Seance } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SEXE_LABELS: Record<string, string> = { F: 'Femme', M: 'Homme', 'Non précisé': 'Non précisé' };
const SEXE_OPTIONS = [
  { value: 'F', label: 'Femme' },
  { value: 'M', label: 'Homme' },
  { value: 'Non précisé', label: 'Non précisé' },
];
const stripKbeauty = (name: string) => name.replace(/Kbeauty\s*/i, '').trim();
const calcAge = (dob: string | null): number | null => {
  if (!dob) return null;
  const d = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  if (today.getMonth() < d.getMonth() || (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())) age--;
  return age;
};

export default function ClienteDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: cliente, isLoading } = useCliente(id!);
  const [page, setPage] = useState(1);
  const { data: seancesData } = useClienteSeances(id!, page);
  const { data: stats } = useDashboardStats();
  const { isGerant } = useAuth();
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', sexe: '', date_de_naissance: '', boutique_id: '', telephone: '' });
  const [saving, setSaving] = useState(false);

  const [editNote, setEditNote] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (cliente) {
      setForm({
        prenom: cliente.prenom || '',
        nom: cliente.nom || '',
        email: cliente.email || '',
        sexe: cliente.sexe || '',
        date_de_naissance: cliente.date_de_naissance || '',
        boutique_id: cliente.boutique_id || '',
        telephone: cliente.telephone || '',
      });
    }
  }, [cliente]);

  if (isLoading) return <div className="text-center py-12 text-gray-400">Chargement…</div>;
  if (!cliente) return <div className="text-center py-12 text-gray-400">Client introuvable</div>;

  const startEdit = () => setEditing(true);
  const cancelEdit = () => {
    setEditing(false);
    setForm({
      prenom: cliente.prenom || '',
      nom: cliente.nom || '',
      email: cliente.email || '',
      sexe: cliente.sexe || '',
      date_de_naissance: cliente.date_de_naissance || '',
      boutique_id: cliente.boutique_id || '',
      telephone: cliente.telephone || '',
    });
  };
  const saveEdit = async () => {
    setSaving(true);
    await api(`clientes/detail/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...form,
        date_de_naissance: form.date_de_naissance || null,
        sexe: form.sexe || null,
        email: form.email || null,
        telephone: form.telephone || null,
      }),
    });
    qc.invalidateQueries({ queryKey: ['cliente', id] });
    setSaving(false);
    setEditing(false);
  };

  const startEditNote = () => {
    setNote(cliente.note_praticien || '');
    setEditNote(true);
  };
  const saveNote = async () => {
    await api(`clientes/detail/${id}`, { method: 'PUT', body: JSON.stringify({ note_praticien: note }) });
    qc.invalidateQueries({ queryKey: ['cliente', id] });
    setEditNote(false);
  };

  const seances = seancesData?.data || [];

  const chartData = seances
    .filter((s: Seance) => s.photos && s.photos.length > 0)
    .map((s: Seance) => {
      const scores: Record<string, number> = {};
      s.photos?.forEach((p) => {
        if (p.diagnostic_ia) {
          Object.entries(p.diagnostic_ia).forEach(([k, v]) => {
            if (typeof v === 'number') scores[k] = (scores[k] || 0) + v;
          });
        }
      });
      return { date: new Date(s.date_debut).toLocaleDateString('fr-FR'), ...scores };
    })
    .reverse();

  const boutiques = stats?.clients_per_boutique || [];

  return (
    <div>
      <Link to="/clients" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      {/* Section 1: Données client — full width */}
      <div className="card w-full mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-gray-500 uppercase">Données client</h3>
          {isGerant && !editing && (
            <button onClick={startEdit} className="p-1 text-gray-400 hover:text-primary"><Edit2 className="w-4 h-4" /></button>
          )}
          {editing && (
            <div className="flex gap-2">
              <button onClick={saveEdit} disabled={saving} className="btn-primary text-xs"><Check className="w-3 h-3" /> Enregistrer</button>
              <button onClick={cancelEdit} className="btn-secondary text-xs"><X className="w-3 h-3" /> Annuler</button>
            </div>
          )}
        </div>

        <div className="flex gap-4 sm:gap-6 flex-col sm:flex-row items-center sm:items-start">
          {/* Avatar */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            <UserCircle className="w-16 h-16 sm:w-24 sm:h-24" style={{ color: 'var(--color-primary)' }} />
            {!editing && (
              <div className="sm:hidden text-center">
                <p className="font-semibold text-base" style={{ color: 'var(--color-primary-deeper)' }}>{cliente.prenom} {cliente.nom}</p>
                {cliente.boutique && <p className="text-xs text-gray-500">{stripKbeauty(cliente.boutique.nom)}</p>}
              </div>
            )}
          </div>

          {/* Fields grid */}
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Prénom</label>
              {editing ? (
                <input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} className="input" />
              ) : (
                <p className="text-sm font-medium" style={{ color: 'var(--color-primary-deeper)' }}>{cliente.prenom}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Nom</label>
              {editing ? (
                <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="input" />
              ) : (
                <p className="text-sm font-medium" style={{ color: 'var(--color-primary-deeper)' }}>{cliente.nom}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Sexe</label>
              {editing ? (
                <select value={form.sexe} onChange={(e) => setForm({ ...form, sexe: e.target.value })} className="input">
                  <option value="">—</option>
                  {SEXE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <p className="text-sm">{SEXE_LABELS[cliente.sexe || ''] || '—'}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Date de naissance</label>
              {editing ? (
                <input type="date" value={form.date_de_naissance} onChange={(e) => setForm({ ...form, date_de_naissance: e.target.value })} className="input" />
              ) : (
                <p className="text-sm">{cliente.date_de_naissance ? `${new Date(cliente.date_de_naissance).toLocaleDateString('fr-FR')} (${calcAge(cliente.date_de_naissance)} ans)` : '—'}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Email</label>
              {editing ? (
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
              ) : (
                <p className="text-sm text-gray-600">{cliente.email || '—'}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Boutique</label>
              {editing ? (
                <select value={form.boutique_id} onChange={(e) => setForm({ ...form, boutique_id: e.target.value })} className="input">
                  {boutiques.map((b) => <option key={b.id} value={b.id}>{stripKbeauty(b.nom)}</option>)}
                </select>
              ) : (
                <p className="text-sm text-gray-600">{cliente.boutique ? stripKbeauty(cliente.boutique.nom) : '—'}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Téléphone</label>
              {editing ? (
                <input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className="input" />
              ) : (
                <p className="text-sm text-gray-600">{cliente.telephone || '—'}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Créé le</label>
              <p className="text-sm text-gray-500">{new Date(cliente.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Note praticien — full width */}
      <div className="card w-full mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm text-gray-500 uppercase">Note praticien</h3>
          {isGerant && !editNote && (
            <button onClick={startEditNote} className="p-1 text-gray-400 hover:text-primary"><Edit2 className="w-4 h-4" /></button>
          )}
        </div>
        {editNote ? (
          <div className="space-y-2">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} className="input" />
            <div className="flex gap-2">
              <button onClick={saveNote} className="btn-primary text-xs"><Save className="w-3 h-3" /> Enregistrer</button>
              <button onClick={() => setEditNote(false)} className="btn-secondary text-xs"><X className="w-3 h-3" /> Annuler</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{cliente.note_praticien || 'Aucune note'}</p>
        )}
      </div>

      {/* Section 3: Diagnostic evolution chart — full width */}
      {chartData.length > 1 && (
        <div className="card w-full mb-6">
          <h3 className="font-semibold mb-4">Évolution diagnostics</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              {Object.keys(chartData[0] || {}).filter((k) => k !== 'date').map((k, i) => (
                <Line key={k} type="monotone" dataKey={k} stroke={['var(--color-primary)', 'var(--color-primary-deeper)', 'var(--color-success)', 'var(--color-primary-dark)'][i % 4]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Section 4: Séances — full width */}
      <div className="card w-full">
        <h3 className="font-semibold mb-4">Séances</h3>
        {seances.length === 0 ? (
          <p className="text-sm text-gray-400">Aucune séance</p>
        ) : (
          <div className="space-y-3">
            {seances.map((s: Seance) => (
              <Link key={s.id} to={`/seances/${s.id}`} className="block p-3 rounded-lg border border-gray-200 hover:border-[var(--color-primary-light)] hover:bg-[var(--color-primary-light)]/10 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{new Date(s.date_debut).toLocaleString('fr-FR')}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.photos?.length ?? 0} photos • {s.miroir?.nom || 'Miroir'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.rapport_url && <span className="badge-success">Rapport</span>}
                    {s.qr_scanne_at && <span className="badge-info">QR scanné</span>}
                    {!s.date_fin && <span className="badge-warning">En cours</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        {seancesData && <Pagination page={page} lastPage={seancesData.last_page} onPageChange={setPage} />}
      </div>
    </div>
  );
}
