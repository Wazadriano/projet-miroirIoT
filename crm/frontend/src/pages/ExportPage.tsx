import { useState } from 'react';
import { getToken, getBoutiqueId } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import { Download, ShoppingBag, Users, CalendarDays, Loader2 } from 'lucide-react';

async function downloadCsv(url: string, filename: string) {
  const headers: Record<string, string> = { Accept: 'text/csv' };
  const token = getToken();
  const boutiqueId = getBoutiqueId();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (boutiqueId) headers['X-Boutique-Id'] = boutiqueId;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

type CardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
  disabled?: boolean;
  badge?: string;
};

function ExportCard({ icon, title, description, action, disabled, badge }: CardProps) {
  return (
    <div className={`card flex flex-col items-center text-center gap-3 p-4 relative ${disabled ? 'opacity-50' : ''}`}>
      {badge && (
        <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-400">
          {badge}
        </span>
      )}
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <p className="text-xs text-gray-400 mt-0.5 leading-snug">{description}</p>
      </div>
      <div className="mt-auto w-full">{action}</div>
    </div>
  );
}

export default function ExportPage() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const apiUrl = import.meta.env.VITE_API_URL || '';

  const doExport = async (key: string, url: string, filename: string) => {
    setLoading(l => ({ ...l, [key]: true }));
    setErrors(e => ({ ...e, [key]: '' }));
    try {
      await downloadCsv(url, filename);
    } catch (err) {
      setErrors(e => ({ ...e, [key]: err instanceof Error ? err.message : 'Erreur' }));
    }
    setLoading(l => ({ ...l, [key]: false }));
  };

  const exports: CardProps[] = [
    {
      icon: <Users className="w-5 h-5 text-primary" />,
      title: 'Clients CSV',
      description: 'Liste complète des clients',
      action: (
        <div>
          <button
            onClick={() => doExport('clientes', `${apiUrl}/api/clientes/export/csv`, 'clients.csv')}
            disabled={loading['clientes']}
            className="btn-primary w-full py-3 disabled:opacity-50"
            style={{ fontSize: '1rem' }}
          >
            {loading['clientes'] ? <Loader2 size={24} className="animate-spin" /> : <Download size={24} />}
            {loading['clientes'] ? 'Export…' : 'Télécharger'}
          </button>
          {errors['clientes'] && <p className="text-xs text-danger mt-1">{errors['clientes']}</p>}
        </div>
      ),
    },
    {
      icon: <CalendarDays className="w-5 h-5 text-primary" />,
      title: 'Séances CSV',
      description: 'Historique de toutes les séances',
      action: (
        <div>
          <button
            onClick={() => doExport('seances', `${apiUrl}/api/export/csv?type=seances`, 'seances.csv')}
            disabled={loading['seances']}
            className="btn-primary w-full py-3 disabled:opacity-50"
            style={{ fontSize: '1rem' }}
          >
            {loading['seances'] ? <Loader2 size={24} className="animate-spin" /> : <Download size={24} />}
            {loading['seances'] ? 'Export…' : 'Télécharger'}
          </button>
          {errors['seances'] && <p className="text-xs text-danger mt-1">{errors['seances']}</p>}
        </div>
      ),
    },
    {
      icon: <ShoppingBag className="w-5 h-5 text-gray-400" />,
      title: 'Shopify',
      description: 'Synchronisation des fiches clients',
      disabled: true,
      badge: 'Bientôt',
      action: (
        <button disabled className="btn-secondary w-full text-sm py-2.5 cursor-not-allowed">
          En développement
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Export" subtitle="Téléchargez vos données" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {exports.map((e) => (
          <ExportCard key={e.title} {...e} />
        ))}
      </div>
    </div>
  );
}
