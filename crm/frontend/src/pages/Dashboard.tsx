import { useState, useEffect, useRef } from 'react';
import { useDashboardStats } from '@/lib/hooks';
import { useDarkMode } from '@/hooks/useDarkMode';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import echo from '@/lib/echo';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Users, Activity, Monitor, AlertTriangle, ChevronDown, FlaskConical, Loader2 } from 'lucide-react';

// Palette beige/rosé — dégradé du plus clair au plus foncé (light mode)
const LIGHT = {
  c1: '#f5e6dd', // crème très clair
  c2: '#eecbb5', // beige clair
  c3: '#d4a38e', // rosé moyen (brand primary)
  c4: '#c5907b', // rosé soutenu
  c5: '#a67b66', // brun rosé
  c6: '#855c4a', // brun foncé
};

// Dark mode : les mêmes teintes mais plus saturées/lumineuses sur fond sombre
const DARK = {
  c1: '#f7d4c0', // pêche clair
  c2: '#f0b89a', // abricot
  c3: '#e89270', // saumon
  c4: '#d4704d', // terracotta
  c5: '#b8503a', // rouille
  c6: '#8c3626', // brun rouge
};

const LIGHT_COLORS = [LIGHT.c3, LIGHT.c5, LIGHT.c1, LIGHT.c6, LIGHT.c2, LIGHT.c4];
const DARK_COLORS = [DARK.c3, DARK.c1, DARK.c5, DARK.c2, DARK.c6, DARK.c4];

const LIGHT_GENDER: Record<string, string> = { F: LIGHT.c3, M: LIGHT.c5, 'Non précisé': LIGHT.c1 };
const DARK_GENDER: Record<string, string> = { F: DARK.c3, M: DARK.c5, 'Non précisé': DARK.c1 };

// Tooltip personnalisé dark-aware
function ChartTooltip({ active, payload, label, isDark }: any) {
  if (!active || !payload?.length) return null;
  const bg = isDark ? '#1e1714' : '#ffffff';
  const border = isDark ? '#2e2220' : '#e5e7eb';
  const color = isDark ? '#f0e8e3' : '#111827';
  const muted = isDark ? '#9a8277' : '#6b7280';
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: '8px 12px', color, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
      {label && <div style={{ fontSize: 12, color: muted, marginBottom: 4 }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ fontSize: 13, fontWeight: 600, color: p.color || color }}>
          {p.name ? `${p.name} : ` : ''}{p.value}
        </div>
      ))}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: string | number; color: string }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats } = useDashboardStats();
  const { isDark } = useDarkMode();
  const qc = useQueryClient();

  // Temps réel : re-fetch les stats quand un miroir change de statut
  useEffect(() => {
    const cb = () => {
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    };
    echo.channel('miroirs').listen('.MiroirStatusChanged', cb);
    return () => {
      // stopListening seulement — ne pas quitter le channel (partagé avec Miroirs.tsx)
      echo.channel('miroirs').stopListening('.MiroirStatusChanged', cb);
    };
  }, [qc]);
  const THEME = isDark ? DARK : LIGHT;
  const COLORS = isDark ? DARK_COLORS : LIGHT_COLORS;
  const GENDER = isDark ? DARK_GENDER : LIGHT_GENDER;
  const gridStroke = isDark ? '#2e2220' : '#e5e7eb';
  const tickColor = isDark ? '#9a8277' : '#6b7280';
  const cursorStyle = { fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' };
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [testQr, setTestQr] = useState<{ svg: string; url: string } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
      setCountdown(null); setTestQr(null); setTestMsg({ ok: true, text: 'Webhook envoy\u00e9 !' });
      return;
    }
  }, [countdown]);

  useEffect(() => () => { clearInterval(timerRef.current); }, []);

  // Gender label mapping
  const genderLabels: Record<string, string> = { F: 'Femme', M: 'Homme', 'Non précisé': 'Non précisé' };
  const genderData = (stats?.gender_distribution || []).map((g) => ({
    ...g,
    label: genderLabels[g.sexe] || g.sexe,
    fill: GENDER[g.sexe] || COLORS[2],
  }));

  // Weekly bar chart from backend data
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const count = stats?.weekly_seances?.[key] ?? 0;
    return { label, count };
  });

  const offlineMiroirs = stats?.offline_miroirs || [];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Toutes les boutiques" />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={Users} label="Total clients" value={stats?.total_clients ?? 0} color="bg-primary" />
        <KpiCard icon={Activity} label="Séances aujourd'hui" value={stats?.seances_today ?? 0} color="bg-accent" />
        <KpiCard icon={Monitor} label="Miroirs en ligne" value={`${stats?.miroirs_online ?? 0}/${stats?.miroirs_total ?? 0}`} color="bg-success" />
        <KpiCard icon={AlertTriangle} label="Alertes" value={offlineMiroirs.length} color={offlineMiroirs.length > 0 ? 'bg-danger' : 'bg-gray-400'} />
      </div>

      {/* Miroirs offline alert – accordion */}
      {offlineMiroirs.length > 0 && (
        <div className="card border-amber-200 bg-amber-50 mb-6">
          <button
            onClick={() => setAlertsOpen(!alertsOpen)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="font-semibold text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Miroirs hors ligne ({offlineMiroirs.length})
            </h3>
            <ChevronDown className={`w-5 h-5 text-amber-600 transition-transform ${alertsOpen ? 'rotate-180' : ''}`} />
          </button>
          {alertsOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              {offlineMiroirs.map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{m.nom}</div>
                    <div className="text-xs text-gray-500">{m.adresse_mac}</div>
                  </div>
                  <StatusBadge online={false} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6">


        {/* Bar chart – Clients par boutique */}
        <div className="card">
          <h3 className="font-semibold mb-4">Clients par boutique</h3>
          {stats?.clients_per_boutique && stats.clients_per_boutique.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.clients_per_boutique.map(b => ({ ...b, ville: b.nom.replace(/Kbeauty\s*/i, '').trim() }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="ville" tick={{ fontSize: 12, fill: tickColor }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: tickColor }} />
                <Tooltip content={<ChartTooltip isDark={isDark} />} cursor={cursorStyle} />
                <Bar dataKey="count" name="Clients" radius={[6, 6, 0, 0]}>
                  {(stats?.clients_per_boutique || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
              Pas encore de données
            </div>
          )}
        </div>

        {/* Bar chart – séances semaine */}
        <div className="card">
          <h3 className="font-semibold mb-4">Séances — 7 derniers jours</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: tickColor }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: tickColor }} />
              <Tooltip content={<ChartTooltip isDark={isDark} />} cursor={cursorStyle} />
              <Bar dataKey="count" name="Séances" radius={[6, 6, 0, 0]}>
                {weekData.map((entry, i) => {
                  const intensity = weekData.length > 1 ? i / (weekData.length - 1) : 0.5;
                  // Gradient 100% beige/rosé : crème clair → brun rosé foncé
                  const light = isDark ? [247, 212, 192] : [245, 230, 221]; // c1-ish
                  const dark = isDark ? [140, 54, 38] : [133, 92, 74]; // c6-ish
                  const r = Math.round(light[0] + (dark[0] - light[0]) * intensity);
                  const g = Math.round(light[1] + (dark[1] - light[1]) * intensity);
                  const b = Math.round(light[2] + (dark[2] - light[2]) * intensity);
                  return <Cell key={i} fill={`rgb(${r},${g},${b})`} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart – Âge des clients */}
        <div className="card">
          <h3 className="font-semibold mb-4">Répartition par âge</h3>
          {stats?.age_distribution && stats.age_distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.age_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="tranche" tick={{ fontSize: 12, fill: tickColor }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: tickColor }} />
                <Tooltip content={<ChartTooltip isDark={isDark} />} cursor={cursorStyle} />
                <Bar dataKey="count" name="Clients" radius={[6, 6, 0, 0]}>
                  {(stats?.age_distribution || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
              Pas encore de données d'âge
            </div>
          )}
        </div>

        {/* Pie chart – Sexe des clients */}
        <div className="card">
          <h3 className="font-semibold mb-4">Répartition par sexe</h3>
          {genderData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={genderData} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={{ stroke: tickColor }}
                >
                  {genderData.map((g, i) => (
                    <Cell key={i} fill={g.fill} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip isDark={isDark} />} cursor={cursorStyle} />
                <Legend wrapperStyle={{ color: tickColor, fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
              Pas encore de données
            </div>
          )}
        </div>

      </div>

      {/* Test séance webhook */}
      <div className="card mt-6">
        <h3 className="font-semibold mb-2 flex items-center gap-2"><FlaskConical className="w-4 h-4" /> Test webhook séance</h3>
        <p className="text-sm text-gray-500 mb-3">Crée une séance test pour thomas.mazeau@icloud.com. Si le QR n'est pas scanné dans 10s, le webhook nocodeur sera déclenché.</p>
        <div className="flex items-center gap-3">
          <button
            disabled={testLoading}
            onClick={async () => {
              setTestLoading(true);
              setTestMsg(null);
              try {
                const res = await api<{ message: string; qr_svg: string; rapport_url: string }>('seances/test', { method: 'POST' });
                setTestMsg({ ok: true, text: res.message });
                setTestQr({ svg: res.qr_svg, url: res.rapport_url });
                setCountdown(10);
                clearInterval(timerRef.current);
                timerRef.current = setInterval(() => setCountdown(prev => prev !== null ? prev - 1 : null), 1000);
              } catch (e: any) {
                setTestMsg({ ok: false, text: e.message || 'Erreur' });
              } finally {
                setTestLoading(false);
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: 'var(--color-primary-dark)' }}
          >
            {testLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
            Lancer séance test
          </button>
          {testMsg && (
            <span className={`text-sm ${testMsg.ok ? 'text-green-600' : 'text-red-600'}`}>{testMsg.text}</span>
          )}
          {countdown !== null && countdown > 0 && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium tabular-nums" style={{ color: 'var(--color-primary-deeper)' }}>
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--color-primary)' }} /><span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'var(--color-primary-deeper)' }} /></span>
              Webhook dans {countdown}s
            </span>
          )}
        </div>
        {testQr && (
          <div className="mt-4 flex items-start gap-5 rounded-xl border p-4" style={{ backgroundColor: 'var(--color-bg-card, #fafafa)', borderColor: 'var(--color-border, #e5e7eb)' }}>
            <div className="flex-shrink-0 text-center">
              <div
                className="w-36 h-36 rounded-lg border bg-white p-1"
                style={{ borderColor: 'var(--color-border, #e5e7eb)' }}
                dangerouslySetInnerHTML={{ __html: testQr.svg }}
              />
              <p className="mt-1 text-xs text-gray-400">Scanner pour tester</p>
            </div>
            <div className="text-sm space-y-2 pt-1">
              <p className="text-gray-600">QR généré. Scanner ce code marque la séance comme lue — sinon le webhook part dans 10s.</p>
              <a
                href={testQr.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs underline break-all"
                style={{ color: 'var(--color-primary-deeper)' }}
              >
                Voir le rapport PDF →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
