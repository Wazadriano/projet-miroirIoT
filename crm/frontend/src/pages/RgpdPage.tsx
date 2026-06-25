import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getToken } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import {
    Search,
    Shield,
    Download,
    Trash2,
    CheckCircle,
    XCircle,
    ChevronRight,
    AlertTriangle,
    FileText,
    UserX,
    UserCircle,
} from 'lucide-react';
import type { Cliente, Consentement } from '@/lib/types';
import type { Paginated } from '@/lib/types';

const API_URL = import.meta.env.VITE_API_URL || '';

function ConsentementStatusBadge({ c }: { c: Consentement }) {
    if (c.date_revocation) {
        return (
            <span className="badge badge-gray inline-flex items-center gap-1">
                <XCircle size={11} /> Révoqué
            </span>
        );
    }
    return (
        <span className="badge badge-success inline-flex items-center gap-1">
            <CheckCircle size={11} /> Actif
        </span>
    );
}

export default function RgpdPage() {
    const { isGerant } = useAuth();
    const qc = useQueryClient();

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [selectedCliente, setSelectedCliente] = useState<(Cliente & { boutique?: { id: string; nom: string } }) | null>(null);
    const [showAnonymiseModal, setShowAnonymiseModal] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);

    const { data: searchResults, isLoading: searchLoading } = useQuery({
        queryKey: ['rgpd-search', debouncedSearch],
        queryFn: () =>
            api<Paginated<Cliente & { boutique?: { id: string; nom: string } }>>('clientes/all', {
                params: { search: debouncedSearch, page: '1' },
            }),
        enabled: debouncedSearch.length >= 2,
    });

    const { data: consentements, isLoading: consentsLoading } = useQuery({
        queryKey: ['rgpd-consentements', selectedCliente?.id],
        queryFn: () =>
            api<Consentement[]>(`clientes/detail/${selectedCliente!.id}/consentements`),
        enabled: !!selectedCliente,
    });

    const revokeMutation = useMutation({
        mutationFn: (consentementId: string) =>
            api(`consentements/${consentementId}/revoquer`, { method: 'PATCH' }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['rgpd-consentements', selectedCliente?.id] });
        },
    });

    const anonymiseMutation = useMutation({
        mutationFn: () =>
            api(`clientes/detail/${selectedCliente!.id}/anonymiser`, { method: 'POST' }),
        onSuccess: () => {
            setShowAnonymiseModal(false);
            setSelectedCliente(null);
            setSearch('');
            setDebouncedSearch('');
            qc.invalidateQueries({ queryKey: ['rgpd-search'] });
            qc.invalidateQueries({ queryKey: ['clientes-all'] });
        },
    });

    const handleSearchChange = (value: string) => {
        setSearch(value);
        if (debounceTimer) clearTimeout(debounceTimer);
        const t = setTimeout(() => setDebouncedSearch(value), 350);
        setDebounceTimer(t);
    };

    const handleExportRgpd = async () => {
        if (!selectedCliente) return;
        setExportLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/api/clientes/detail/${selectedCliente.id}/export-rgpd`, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            });
            if (!res.ok) throw new Error('Erreur export');
            const data = await res.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rgpd_${selectedCliente.nom}_${selectedCliente.prenom}_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            alert("Erreur lors de l'export des données.");
        } finally {
            setExportLoading(false);
        }
    };

    const clients = searchResults?.data ?? [];

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
            <PageHeader
                title="Gestion RGPD"
                subtitle="Consultez les consentements, exportez ou anonymisez les données personnelles"
            />

            {/* Info banner */}
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 dark:bg-[#2d1a04] dark:border-amber-900/60 p-4 flex gap-3">
                <Shield size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-300">
                    <p className="font-semibold mb-0.5">Conformité RGPD</p>
                    <p>
                        Gérez les consentements, exportez les données (portabilité) et anonymisez un client sur demande (droit à l'oubli).
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left panel: client search */}
                <div className="lg:col-span-1">
                    <div className="card">
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Rechercher un client
                        </h2>
                        <div className="relative mb-3">
                            <Search
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                style={{ color: 'var(--color-primary-dark)' }}
                            />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder="Nom, prénom, email…"
                                className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2.5 text-sm shadow-sm outline-none transition-all focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgb(212_163_142/0.2)]"
                            />
                        </div>

                        {debouncedSearch.length >= 2 && (
                            <div className="space-y-0.5 max-h-80 overflow-y-auto -mx-1 px-1">
                                {searchLoading && (
                                    <p className="text-xs text-gray-400 text-center py-4">Recherche…</p>
                                )}
                                {!searchLoading && clients.length === 0 && (
                                    <p className="text-xs text-gray-400 text-center py-4">Aucun résultat</p>
                                )}
                                {clients.map((c) => (
                                    <button
                                        key={c.id}
                                        onClick={() => setSelectedCliente(c)}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between gap-2 ${selectedCliente?.id === c.id
                                                ? 'bg-[var(--color-primary)] text-white'
                                                : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        <div className="min-w-0">
                                            <div className="font-medium truncate">{c.prenom} {c.nom}</div>
                                            {c.email && (
                                                <div className={`text-xs truncate ${selectedCliente?.id === c.id ? 'text-white/80' : 'text-gray-400'}`}>
                                                    {c.email}
                                                </div>
                                            )}
                                        </div>
                                        <ChevronRight size={13} className="shrink-0 opacity-40" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {debouncedSearch.length < 2 && (
                            <p className="text-xs text-gray-400 text-center py-2">Saisissez au moins 2 caractères</p>
                        )}
                    </div>
                </div>

                {/* Right panel */}
                <div className="lg:col-span-2">
                    {!selectedCliente ? (
                        <div className="card flex flex-col items-center justify-center py-16 text-center">
                            <Shield size={36} className="mb-3 opacity-20" style={{ color: 'var(--color-primary)' }} />
                            <p className="text-sm text-gray-400">Sélectionnez un client pour gérer ses données RGPD</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Client identity */}
                            <div className="card">
                                <div className="flex items-start gap-3">
                                    <UserCircle size={42} className="shrink-0" style={{ color: 'var(--color-primary)' }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-base" style={{ color: 'var(--color-primary-deeper)' }}>
                                            {selectedCliente.prenom} {selectedCliente.nom}
                                        </p>
                                        <p className="text-sm text-gray-500">{selectedCliente.email ?? '—'}</p>
                                        {selectedCliente.telephone && (
                                            <p className="text-sm text-gray-500">{selectedCliente.telephone}</p>
                                        )}
                                        {selectedCliente.boutique && (
                                            <p className="text-xs text-gray-400 mt-0.5">{selectedCliente.boutique.nom}</p>
                                        )}
                                    </div>
                                    {isGerant && (
                                        <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                                            <button
                                                onClick={handleExportRgpd}
                                                disabled={exportLoading}
                                                className="btn-primary"
                                            >
                                                <Download size={14} />
                                                {exportLoading ? 'Export…' : 'Portabilité'}
                                            </button>
                                            <button
                                                onClick={() => setShowAnonymiseModal(true)}
                                                className="btn-outline"
                                                style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                                            >
                                                <UserX size={14} />
                                                Droit à l'oubli
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Consentements table */}
                            <div className="card overflow-x-auto !p-0">
                                <div className="px-5 py-3 border-b border-gray-200 flex items-center gap-2">
                                    <FileText size={15} style={{ color: 'var(--color-primary-dark)' }} />
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                        Historique des consentements
                                    </h3>
                                </div>

                                {consentsLoading && (
                                    <div className="py-10 text-center text-sm text-gray-400">Chargement…</div>
                                )}
                                {!consentsLoading && (!consentements || consentements.length === 0) && (
                                    <div className="py-10 text-center text-sm text-gray-400">
                                        Aucun consentement enregistré
                                    </div>
                                )}
                                {!consentsLoading && consentements && consentements.length > 0 && (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200 text-left text-gray-500">
                                                <th className="px-5 pb-3 pt-3 font-medium">Date</th>
                                                <th className="px-5 pb-3 pt-3 font-medium">Consentement</th>
                                                <th className="px-5 pb-3 pt-3 font-medium">Statut</th>
                                                {isGerant && <th className="px-5 pb-3 pt-3 font-medium"></th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {consentements.map((c) => (
                                                <tr
                                                    key={c.id}
                                                    className="border-b border-gray-200 transition-colors hover:bg-gray-50 last:border-0"
                                                >
                                                    <td className="px-5 py-3 whitespace-nowrap text-gray-500 text-xs">
                                                        <div>{new Date(c.date_consentement).toLocaleDateString('fr-FR')}</div>
                                                        <div className="opacity-60">{new Date(c.date_consentement).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                                                        {c.date_revocation && (
                                                            <div className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>
                                                                Révoqué le {new Date(c.date_revocation).toLocaleDateString('fr-FR')}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 max-w-xs">
                                                        <p className="text-gray-700 text-sm line-clamp-2">{c.texte_consent}</p>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <ConsentementStatusBadge c={c} />
                                                    </td>
                                                    {isGerant && (
                                                        <td className="px-5 py-3 text-right">
                                                            {!c.date_revocation && (
                                                                <button
                                                                    onClick={() => revokeMutation.mutate(c.id)}
                                                                    disabled={revokeMutation.isPending}
                                                                    className="text-xs font-medium hover:underline transition-colors"
                                                                    style={{ color: 'var(--color-danger)' }}
                                                                >
                                                                    Révoquer
                                                                </button>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Anonymise confirmation modal */}
            <Modal
                open={showAnonymiseModal && !!selectedCliente}
                onClose={() => setShowAnonymiseModal(false)}
                title="Droit à l'oubli — Anonymisation"
            >
                {selectedCliente && (
                    <div>
                        <div className="flex items-start gap-3 mb-4 p-3 rounded-lg bg-red-50 dark:bg-[#2d1010] border border-red-100 dark:border-red-900/40">
                            <AlertTriangle size={16} style={{ color: 'var(--color-danger)' }} className="shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 dark:text-red-300 font-medium leading-snug">
                                Action irréversible — les données ne pourront pas être restaurées.
                            </p>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            Les données personnelles de{' '}
                            <span className="font-semibold" style={{ color: 'var(--color-primary-deeper)' }}>
                                {selectedCliente.prenom} {selectedCliente.nom}
                            </span>{' '}
                            vont être supprimées :
                        </p>

                        <ul className="text-sm text-gray-600 mb-6 space-y-2">
                            {[
                                'Nom, prénom, email, téléphone, date de naissance effacés',
                                'Photos du serveur supprimées',
                                'Tous les consentements révoqués',
                                'Historique des séances conservé (données anonymes)',
                            ].map((item) => (
                                <li key={item} className="flex items-start gap-2">
                                    <span
                                        className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                                        style={{ background: 'var(--color-primary)' }}
                                    />
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                            <button onClick={() => setShowAnonymiseModal(false)} className="btn-secondary">
                                Annuler
                            </button>
                            <button
                                onClick={() => anonymiseMutation.mutate()}
                                disabled={anonymiseMutation.isPending}
                                className="btn-danger"
                            >
                                <Trash2 size={14} />
                                {anonymiseMutation.isPending ? 'Anonymisation…' : "Confirmer l'anonymisation"}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
