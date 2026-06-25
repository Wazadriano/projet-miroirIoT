import { useState, useRef, useMemo } from 'react';
import { useProduits, useInvalidate } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import { RefreshCw, ExternalLink, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { Produit } from '@/lib/types';

export default function Produits() {
  const { isGerant } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [statutFilter, setStatutFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [fournisseurFilter, setFournisseurFilter] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const invalidate = useInvalidate();

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(v); setPage(1); }, 300);
  };

  const filters = useMemo(() => {
    const f: Record<string, string> = {};
    if (debouncedSearch) f.search = debouncedSearch;
    if (sortBy) { f.sort_by = sortBy; f.sort_dir = sortDir; }
    if (statutFilter) f.actif = statutFilter;
    if (tagFilter) f.tag = tagFilter;
    if (fournisseurFilter) f.fournisseur = fournisseurFilter;
    return f;
  }, [debouncedSearch, sortBy, sortDir, statutFilter, tagFilter, fournisseurFilter]);

  const { data, isLoading } = useProduits(page, filters);

  // Extraire les tags uniques de la page courante pour le filtre
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    data?.data.forEach((p: Produit) => p.tags?.forEach((t: string) => tags.add(t)));
    return Array.from(tags).sort();
  }, [data]);

  // Extraire les fournisseurs uniques
  const allFournisseurs = useMemo(() => {
    const set = new Set<string>();
    data?.data.forEach((p: Produit) => { if (p.fournisseur) set.add(p.fournisseur); });
    return Array.from(set).sort();
  }, [data]);

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
    setPage(1);
  };

  const toggleMisEnAvant = async (p: Produit) => {
    await api(`produits/${p.id}`, { method: 'PUT', body: JSON.stringify({ mis_en_avant: !p.mis_en_avant }) });
    invalidate('produits');
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await api<{ message: string; synced?: number }>('produits/sync-shopify', { method: 'POST', body: JSON.stringify({}) });
      setSyncMsg({ text: res.message, ok: true });
    } catch (err) {
      setSyncMsg({ text: err instanceof Error ? err.message : 'Erreur de synchronisation', ok: false });
    }
    setSyncing(false);
    invalidate('produits');
  };

  const SortIcon = ({ col }: { col: string }) =>
    sortBy === col
      ? (sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />)
      : <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;

  const MiroirSwitch = ({ p }: { p: Produit }) => (
    <button
      onClick={() => isGerant && toggleMisEnAvant(p)}
      disabled={!isGerant}
      title={p.mis_en_avant ? 'Affiché sur le miroir' : 'Non affiché sur le miroir'}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${p.mis_en_avant ? 'bg-amber-400' : 'bg-gray-200'
        } ${isGerant ? 'cursor-pointer hover:opacity-80' : 'cursor-default opacity-60'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${p.mis_en_avant ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`}
      />
    </button>
  );

  const StatutPill = ({ actif }: { actif: boolean }) => (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${actif
        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
        : 'bg-gray-100 text-gray-500 ring-gray-200'
      }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${actif ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      {actif ? 'Actif' : 'Inactif'}
    </span>
  );

  return (
    <div>
      <PageHeader
        title="Produits"
        subtitle={`${data?.total ?? 0} produits — Shopify`}
        actions={
          isGerant && (
            <button onClick={handleSync} disabled={syncing} className="btn-primary">
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Synchronisation…' : 'Sync Shopify'}
            </button>
          )
        }
      />

      {syncMsg && (
        <div className={`mb-4 rounded-lg p-3 text-sm ${syncMsg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {syncMsg.text}
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-primary-dark)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Rechercher par nom…"
            className="w-full rounded-xl border border-gray-200 bg-white px-10 py-2.5 text-sm shadow-sm outline-none transition-all focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgb(212_163_142/0.2)]"
          />
        </div>
        <select
          value={statutFilter}
          onChange={(e) => { setStatutFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
        >
          <option value="">Tous statuts</option>
          <option value="1">Actif</option>
          <option value="0">Inactif</option>
        </select>
        <select
          value={tagFilter}
          onChange={(e) => { setTagFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
        >
          <option value="">Tous tags</option>
          {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={fournisseurFilter}
          onChange={(e) => { setFournisseurFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
        >
          <option value="">Tous fournisseurs</option>
          {allFournisseurs.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="py-8 text-center text-gray-400">Chargement…</div>
        ) : data?.data.length === 0 ? (
          <div className="py-8 text-center text-gray-400">Aucun produit — cliquez « Sync Shopify » pour importer</div>
        ) : (
          data?.data.map((p: Produit) => (
            <div key={p.id} className="card flex gap-3">
              {p.image_url && <img src={p.image_url} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.nom}</div>
                    {p.fournisseur && <div className="text-xs text-gray-400">{p.fournisseur}</div>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <MiroirSwitch p={p} />
                    {p.url_produit && (
                      <a href={p.url_produit} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
                {p.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {p.prix != null && <span className="text-sm font-medium">{p.prix.toFixed(2)} €</span>}
                  <StatutPill actif={p.actif} />
                  {p.tags?.map((t: string) => (
                    <button key={t} onClick={() => { setTagFilter(t); setPage(1); }} className={`badge-gray cursor-pointer hover:opacity-80 text-xs ${tagFilter === t ? 'ring-1 ring-primary' : ''}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: Table */}
      <div className="card overflow-x-auto hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="pb-3 font-medium">
                <button onClick={() => toggleSort('nom')} className="inline-flex items-center gap-1 text-gray-500 font-medium text-sm hover:text-gray-700 transition-colors">
                  Produit <SortIcon col="nom" />
                </button>
              </th>
              <th className="pb-3 font-medium">
                <button onClick={() => toggleSort('prix')} className="inline-flex items-center gap-1 text-gray-500 font-medium text-sm hover:text-gray-700 transition-colors">
                  Prix <SortIcon col="prix" />
                </button>
              </th>
              <th className="pb-3 font-medium">Fournisseur</th>
              <th className="pb-3 font-medium">Tags</th>
              <th className="pb-3 font-medium">Sur le miroir</th>
              <th className="pb-3 font-medium">Statut</th>
              <th className="pb-3 font-medium">Lien</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="py-8 text-center text-gray-400">Chargement…</td></tr>
            ) : data?.data.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-gray-400">Aucun produit — cliquez « Sync Shopify » pour importer</td></tr>
            ) : (
              data?.data.map((p: Produit) => (
                <tr key={p.id} className="border-b border-gray-200 last:border-0 hover:bg-gray-50">
                  <td className="py-3 font-medium" style={{ color: 'var(--color-primary-deeper)' }}>
                    <div className="flex items-center gap-3">
                      {p.image_url && <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                      <div className="font-medium">{p.nom}</div>
                    </div>
                  </td>
                  <td className="py-3 text-gray-600">{p.prix ? `${p.prix.toFixed(2)} €` : '—'}</td>
                  <td className="py-3 text-gray-500 text-xs">{p.fournisseur ?? '—'}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.tags?.map((t: string) => (
                        <button key={t} onClick={() => { setTagFilter(t); setPage(1); }} className={`badge-gray cursor-pointer hover:opacity-80 ${tagFilter === t ? 'ring-1 ring-primary' : ''}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3">
                    <MiroirSwitch p={p} />
                  </td>
                  <td className="py-3">
                    <StatutPill actif={p.actif} />
                  </td>
                  <td className="py-3 text-gray-500">
                    {p.url_produit && (
                      <a href={p.url_produit} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={page} lastPage={data.last_page} onPageChange={setPage} />}
    </div>
  );
}
