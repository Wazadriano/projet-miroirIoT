import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSeance } from '@/lib/hooks';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import { ArrowLeft, FileText, Clock, Camera, Play, Loader2 } from 'lucide-react';
import type { Photo } from '@/lib/types';

export default function SeanceDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: seance, isLoading } = useSeance(id!);
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleTriggerN8n = async () => {
    setTriggering(true);
    setTriggerMsg(null);
    try {
      const res = await api<{ message: string; status?: number }>(`seances/${id}/trigger-n8n`, { method: 'POST' });
      setTriggerMsg({ ok: true, text: res.message });
    } catch (e: any) {
      setTriggerMsg({ ok: false, text: e.message || 'Erreur' });
    } finally {
      setTriggering(false);
    }
  };

  if (isLoading) return <div className="text-center py-12 text-gray-400">Chargement…</div>;
  if (!seance) return <div className="text-center py-12 text-gray-400">Séance introuvable</div>;

  const photosAvant = seance.photos?.filter((p: Photo) => p.phase === 'avant') || [];
  const photosApres = seance.photos?.filter((p: Photo) => p.phase === 'apres') || [];
  const apiUrl = import.meta.env.VITE_API_URL || '';

  return (
    <div>
      <Link to={`/clientes/${seance.cliente_id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Retour à la fiche
      </Link>

      <PageHeader
        title={`Séance du ${new Date(seance.date_debut).toLocaleDateString('fr-FR')}`}
        subtitle={`${seance.cliente?.prenom} ${seance.cliente?.nom} — ${seance.miroir?.nom || 'Miroir'}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerN8n}
              disabled={triggering}
              className="btn-secondary flex items-center gap-1"
            >
              {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Tester workflow N8N
            </button>
            {seance.rapport_url && (
              <a href={seance.rapport_url} target="_blank" rel="noopener" className="btn-primary flex items-center gap-1">
                <FileText className="w-4 h-4" /> Voir le rapport
              </a>
            )}
          </div>
        }
      />

      {/* Trigger N8N feedback */}
      {triggerMsg && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${triggerMsg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {triggerMsg.text}
        </div>
      )}

      {/* Info bar */}
      <div className="flex items-center gap-6 mb-6 text-sm text-gray-500">
        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(seance.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} → {seance.date_fin ? new Date(seance.date_fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'En cours'}</span>
        <span className="flex items-center gap-1"><Camera className="w-4 h-4" /> {(seance.photos?.length || 0)} photos</span>
        {seance.qr_scanne_at && <span className="badge-info">QR scanné</span>}
        {seance.email_envoye && <span className="badge-success">Email envoyé</span>}
      </div>

      {/* Photos avant/après */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="font-semibold mb-4">Photos AVANT ({photosAvant.length})</h3>
          <div className="grid grid-cols-2 gap-3">
            {photosAvant.map((p: Photo) => (
              <div key={p.id} className="relative group">
                <img
                  src={`${apiUrl}/storage/${p.chemin_serveur}`}
                  alt="Avant"
                  className="w-full aspect-square object-cover rounded-lg"
                />
                {p.modele_ia && <span className="absolute bottom-1 left-1 badge-gray text-[10px]">{p.modele_ia}</span>}
              </div>
            ))}
            {photosAvant.length === 0 && <p className="col-span-2 text-sm text-gray-400">Aucune photo</p>}
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-4">Photos APRÈS ({photosApres.length})</h3>
          <div className="grid grid-cols-2 gap-3">
            {photosApres.map((p: Photo) => (
              <div key={p.id} className="relative group">
                <img
                  src={`${apiUrl}/storage/${p.chemin_serveur}`}
                  alt="Après"
                  className="w-full aspect-square object-cover rounded-lg"
                />
                {p.modele_ia && <span className="absolute bottom-1 left-1 badge-gray text-[10px]">{p.modele_ia}</span>}
              </div>
            ))}
            {photosApres.length === 0 && <p className="col-span-2 text-sm text-gray-400">Aucune photo</p>}
          </div>
        </div>
      </div>

      {/* Diagnostic IA */}
      {seance.photos && seance.photos.some((p: Photo) => p.diagnostic_ia) && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-4">Diagnostic IA</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {seance.photos.filter((p: Photo) => p.diagnostic_ia).map((p: Photo) => (
              <div key={p.id} className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-2 uppercase">{p.phase} — {p.modele_ia || 'IA'}</div>
                {Object.entries(p.diagnostic_ia!).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">{k}</span>
                    <span className="font-medium">{String(v)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Note */}
      {seance.note_seance && (
        <div className="card">
          <h3 className="font-semibold mb-2">Note de séance</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{seance.note_seance}</p>
        </div>
      )}
    </div>
  );
}
